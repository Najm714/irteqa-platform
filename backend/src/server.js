// backend/src/server.js
import { EventEmitter } from 'events';
import app from './app.js';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { connectDB } from './config/database.js';
import { config } from './config/env.js';
import { authenticateSocket } from './middleware/auth.js';
import { Request } from './models/Request.model.js';
import mongoose from 'mongoose'; // ✅ إضافة mongoose

const httpServer = createServer(app);

// ============================================================
// ✅ ✅ دالة تنظيف الفهارس القديمة
// ============================================================

const cleanOldIndexes = async () => {
  try {
    console.log('🧹 Cleaning old indexes...');
    
    const collections = await mongoose.connection.db.collections();
    const videosCollection = collections.find(c => c.collectionName === 'videos');
    
    if (!videosCollection) {
      console.log('ℹ️ Collection "videos" not found, skipping...');
      return;
    }
    
    const indexes = await videosCollection.indexes();
    const oldIndexes = ['streamUid_1', 'streamUid_unique', 'streamUid_1_sparse'];
    
    let droppedCount = 0;
    for (const indexName of oldIndexes) {
      const exists = indexes.some(idx => idx.name === indexName);
      if (exists) {
        try {
          await videosCollection.dropIndex(indexName);
          console.log(`✅ Dropped old index: ${indexName}`);
          droppedCount++;
        } catch (err) {
          console.log(`⚠️ Could not drop ${indexName}:`, err.message);
        }
      }
    }
    
    if (droppedCount === 0) {
      console.log('ℹ️ No old indexes found to drop');
    } else {
      console.log(`✅ Cleaned ${droppedCount} old index(es)`);
    }
  } catch (error) {
    console.log('⚠️ Index cleanup warning:', error.message);
    // لا نوقف تشغيل السيرفر
  }
};

// ============================================================
// ✅ Socket.IO مع مصادقة ودعم المكالمات المباشرة
// ============================================================

const io = new SocketServer(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8080',
      'http://127.0.0.1',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// ✅ استخدام authenticateSocket من auth.js
io.use(authenticateSocket);

// ============================================================
// ✅ اتصال Socket.IO - مع دعم المكالمات المباشرة
// ============================================================

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id} (Account: ${socket.accountId})`);

  // ===== الانضمام إلى غرفة الطلب =====
  socket.on('join-request', (requestId) => {
    socket.join(`request-${requestId}`);
    console.log(`📌 Account ${socket.accountId} joined request ${requestId}`);
    
    socket.to(`request-${requestId}`).emit('user-connected', {
      userId: socket.accountId,
      userName: socket.account?.profile?.fullName || socket.account?.username,
      socketId: socket.id,
    });
  });

  // ===== مغادرة غرفة الطلب =====
  socket.on('leave-request', (requestId) => {
    socket.leave(`request-${requestId}`);
    console.log(`📌 Account ${socket.accountId} left request ${requestId}`);
  });

  // ===== الرسائل الفورية =====
  socket.on('send-message', async (data) => {
    try {
      io.to(`request-${data.requestId}`).emit('new-message', {
        ...data,
        senderId: socket.accountId,
        senderName: socket.account?.profile?.fullName || socket.account?.username,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ===== حالة الكتابة =====
  socket.on('typing', (data) => {
    socket.to(`request-${data.requestId}`).emit('user-typing', {
      userId: socket.accountId,
      name: socket.account?.profile?.fullName || socket.account?.username,
      isTyping: data.isTyping,
    });
  });

  // ===== تحديث حالة الطلب =====
  socket.on('status-update', (data) => {
    io.to(`request-${data.requestId}`).emit('status-changed', {
      requestId: data.requestId,
      status: data.status,
      updatedBy: socket.accountId,
      updatedByName: socket.account?.profile?.fullName || socket.account?.username,
      timestamp: new Date(),
    });
  });

  // ============================================================
  // ✅ ✅ WebRTC Signaling - المكالمات المباشرة (محدث)
  // ============================================================

  // ===== بدء مكالمة (إرسال فقط للمستخدم المستهدف) =====
  socket.on('call-user', (data) => {
    console.log(`📞 Call request from ${socket.accountId}`);
    console.log('  - Request ID:', data.requestId);
    console.log('  - Target User ID:', data.targetUserId);
    console.log('  - Type:', data.type || 'video');
    
    const roomName = `request-${data.requestId}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    
    let targetSocket = null;
    
    if (room) {
      for (const socketId of room) {
        const s = io.sockets.sockets.get(socketId);
        if (s && s.accountId?.toString() === data.targetUserId) {
          targetSocket = s;
          break;
        }
      }
    }
    
    if (targetSocket) {
      console.log(`✅ Sending incoming-call to target user: ${data.targetUserId}`);
      targetSocket.emit('incoming-call', {
        callerId: socket.accountId,
        callerName: socket.account?.profile?.fullName || socket.account?.username,
        callerSocketId: socket.id,
        requestId: data.requestId,
        offer: data.offer,
        type: data.type || 'video',
        isScheduled: data.isScheduled || false,
        scheduledAt: data.scheduledAt || null,
      });
    } else {
      console.log(`❌ Target user ${data.targetUserId} not found in room ${roomName}`);
      socket.emit('call-error', {
        message: 'المستخدم المستهدف غير متصل حالياً',
      });
    }
  });

  // ===== قبول المكالمة (إرسال فقط للمتصل) =====
  socket.on('accept-call', (data) => {
    console.log(`📞 Call accepted by ${socket.accountId}`);
    console.log('  - Request ID:', data.requestId);
    console.log('  - Caller Socket ID:', data.callerSocketId);
    
    const roomName = `request-${data.requestId}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    
    if (room) {
      for (const socketId of room) {
        const s = io.sockets.sockets.get(socketId);
        if (s && s.id === data.callerSocketId) {
          console.log(`✅ Sending call-accepted to caller: ${s.id}`);
          s.emit('call-accepted', {
            calleeId: socket.accountId,
            calleeName: socket.account?.profile?.fullName || socket.account?.username,
            calleeSocketId: socket.id,
            answer: data.answer,
          });
          break;
        }
      }
    }
  });

  // ===== رفض المكالمة (إرسال فقط للمتصل) =====
  socket.on('reject-call', (data) => {
    console.log(`📞 Call rejected by ${socket.accountId}`);
    console.log('  - Request ID:', data.requestId);
    console.log('  - Caller Socket ID:', data.callerSocketId);
    
    const roomName = `request-${data.requestId}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    
    if (room) {
      for (const socketId of room) {
        const s = io.sockets.sockets.get(socketId);
        if (s && s.id === data.callerSocketId) {
          console.log(`✅ Sending call-rejected to caller: ${s.id}`);
          s.emit('call-rejected', {
            userId: socket.accountId,
            userName: socket.account?.profile?.fullName || socket.account?.username,
          });
          break;
        }
      }
    }
  });

  // ===== إنهاء المكالمة (إرسال للطرف الآخر فقط) =====
  socket.on('end-call', (data) => {
    console.log(`📞 Call ended by ${socket.accountId}`);
    console.log('  - Request ID:', data.requestId);
    
    const roomName = `request-${data.requestId}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    
    if (room) {
      for (const socketId of room) {
        const s = io.sockets.sockets.get(socketId);
        if (s && s.id !== socket.id) {
          console.log(`✅ Sending call-ended to: ${s.id}`);
          s.emit('call-ended', {
            userId: socket.accountId,
            userName: socket.account?.profile?.fullName || socket.account?.username,
          });
          break;
        }
      }
    }
  });

  // ===== مرشحات ICE (إرسال للطرف الآخر فقط) =====
  socket.on('ice-candidate', (data) => {
    console.log(`🧊 ICE candidate from ${socket.accountId}`);
    console.log('  - Request ID:', data.requestId);
    
    const roomName = `request-${data.requestId}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    
    if (room) {
      for (const socketId of room) {
        const s = io.sockets.sockets.get(socketId);
        if (s && s.id !== socket.id) {
          s.emit('ice-candidate', {
            userId: socket.accountId,
            candidate: data.candidate,
          });
          break;
        }
      }
    }
  });

  // ===== تحديث حالة المكالمة =====
  socket.on('call-status', (data) => {
    console.log(`📞 Call status update from ${socket.accountId}: ${data.status}`);
    socket.to(`request-${data.requestId}`).emit('call-status-update', {
      userId: socket.accountId,
      userName: socket.account?.profile?.fullName || socket.account?.username,
      status: data.status,
    });
  });

  // ============================================================
  // ✅ انقطاع الاتصال
  // ============================================================

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id} (Account: ${socket.accountId})`);
    io.emit('user-disconnected', {
      userId: socket.accountId,
      socketId: socket.id,
    });
  });
});

// ✅ تخزين io في app للاستخدام في controllers
app.set('io', io);

// ============================================================
// ✅ مسار requests/my
// ============================================================

app.get('/api/requests/my', async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;

    console.log('📋 جلب طلبات المستخدم:', accountId, portalId);

    const orders = await Request.find({ 
      portalId, 
      accountId,
      isActive: true 
    })
      .populate('serviceId', 'name slug')
      .populate('requestTypeId', 'name slug')
      .populate('files.fileId')
      .sort({ createdAt: -1 });

    console.log(`✅ تم العثور على ${orders.length} طلب`);

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      title: order.formData?.title || 'طلب',
      description: order.formData?.description || '',
      service: order.serviceId?.name || 'خدمة',
      serviceType: order.serviceId?.name || 'خدمة',
      status: order.status || 'pending',
      budget: order.scope?.price || order.formData?.budget || 0,
      deliveryDate: order.formData?.deliveryDate || order.scope?.estimatedDuration,
      createdAt: order.createdAt,
      files: order.files.map(f => ({
        _id: f.fileId?._id,
        filename: f.fileId?.originalName,
        name: f.fileId?.originalName,
        storageProvider: f.fileId?.storageProvider,
      })),
      department: order.formData?.department || '',
      orderType: order.formData?.orderType || '',
      name: order.formData?.name || '',
      email: order.formData?.email || '',
    }));

    res.json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error('❌ Error in /api/requests/my:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ============================================================
// ✅ مسار health check
// ============================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================
// ✅ ✅ تشغيل الخادم
// ============================================================

const startServer = async () => {
  try {
    await connectDB();
    
    // ✅ ✅ تنظيف الفهارس القديمة (لتجنب خطأ streamUid)
    await cleanOldIndexes();
    
    httpServer.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API URL: http://localhost:${config.port}/api`);
      console.log(`🔌 Socket.IO: ws://localhost:${config.port}`);
      console.log(`📋 Socket.IO Authentication: Enabled`);
      console.log(`📞 WebRTC Signaling: Enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// ============================================================
// ✅ إيقاف الخادم بشكل نظيف
// ============================================================

const gracefulShutdown = () => {
  console.log('🛑 Shutting down gracefully...');
  
  io.close(() => {
    console.log('✅ Socket.IO closed');
  });
  
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.log('⚠️ Forceful shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  gracefulShutdown();
});

// ✅ تصدير io للاستخدام في ملفات أخرى
export { io };