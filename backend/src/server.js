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
// ✅ التحقق المركزي من صلاحية Socket للوصول إلى Request
// ============================================================

const getAuthorizedRequest = async (socket, requestId) => {
  if (!requestId) {
    throw new Error('REQUEST_ID_REQUIRED');
  }

  if (!socket.accountId) {
    throw new Error('AUTHENTICATION_REQUIRED');
  }

  if (!socket.portalId) {
    throw new Error('PORTAL_ID_REQUIRED');
  }

  const request = await Request.findOne({
    _id: requestId,
    portalId: socket.portalId,
    isActive: true,
    isDeleted: { $ne: true },
  }).select(
    '_id portalId accountId specialistId status'
  );

  if (!request) {
    throw new Error('REQUEST_NOT_FOUND');
  }

  const accountId = String(socket.accountId);
  const role = socket.account?.role;

  const isOwner =
    request.accountId &&
    String(request.accountId) === accountId;

  const isSpecialist =
    request.specialistId &&
    String(request.specialistId) === accountId;

  const isPortalAdmin =
    role === 'portal_admin';

  const isSuperAdmin =
    role === 'super_admin';

  if (
    !isOwner &&
    !isSpecialist &&
    !isPortalAdmin &&
    !isSuperAdmin
  ) {
    throw new Error('REQUEST_ACCESS_DENIED');
  }

  return request;
};

// ============================================================
// ✅ اتصال Socket.IO - مع دعم المكالمات المباشرة
// ============================================================
io.on('connection', (socket) => {
  console.log(
    `🔌 Client connected: ${socket.id} (Account: ${socket.accountId}, Portal: ${socket.portalId})`
  );
  if (socket.accountId) {
  const notificationRoom = `user_${socket.accountId}`;
  socket.join(notificationRoom);
  console.log(`📢 User ${socket.accountId} joined notifications room: ${notificationRoom}`);
}

  // ============================================================
  // Helper: التحقق من وجود Socket آخر داخل نفس الطلب والبوابة
  // ============================================================

  const getSocketInAuthorizedRoom = (request, socketId) => {
    if (!socketId) return null;

    const roomName = `request-${request._id}`;
    const room = io.sockets.adapter.rooms.get(roomName);

    if (!room || !room.has(socketId)) {
      return null;
    }

    const targetSocket = io.sockets.sockets.get(socketId);

    if (!targetSocket) {
      return null;
    }

    // حماية إضافية: يجب أن يكون الـ Socket الآخر في نفس البوابة
    if (
      !targetSocket.portalId ||
      String(targetSocket.portalId) !== String(socket.portalId)
    ) {
      return null;
    }

    return targetSocket;
  };

  // ============================================================
  // الانضمام إلى غرفة الطلب
  // ============================================================

  socket.on('join-request', async (requestId) => {
    try {
      const request = await getAuthorizedRequest(socket, requestId);

      const roomName = `request-${request._id}`;

      socket.join(roomName);

      console.log(
        `📌 Account ${socket.accountId} joined request ${request._id}` +
        ` | portal=${socket.portalId}`
      );

      socket.to(roomName).emit('user-connected', {
        userId: socket.accountId,
        userName:
          socket.account?.profile?.fullName ||
          socket.account?.username,
        socketId: socket.id,
      });
    } catch (error) {
      console.warn(
        `🚫 Socket join denied: account=${socket.accountId}, ` +
        `request=${requestId}, portal=${socket.portalId}, ` +
        `reason=${error.message}`
      );

      socket.emit('socket-error', {
        code: error.message,
        message: 'You are not authorized to access this request',
      });
    }
  });

  // ============================================================
  // مغادرة غرفة الطلب
  // ============================================================

  socket.on('leave-request', async (requestId) => {
    try {
      const request = await getAuthorizedRequest(socket, requestId);

      const roomName = `request-${request._id}`;

      socket.leave(roomName);

      console.log(
        `📌 Account ${socket.accountId} left request ${request._id}` +
        ` | portal=${socket.portalId}`
      );
    } catch (error) {
      console.warn(
        `🚫 Socket leave denied: account=${socket.accountId}, ` +
        `request=${requestId}, portal=${socket.portalId}, ` +
        `reason=${error.message}`
      );

      socket.emit('socket-error', {
        code: error.message,
        message: 'You are not authorized to leave this request',
      });
    }
  });

  // ============================================================
  // إرسال رسالة
  // ============================================================

  socket.on('send-message', async (data) => {
    try {
      const request = await getAuthorizedRequest(
        socket,
        data?.requestId
      );

      const roomName = `request-${request._id}`;

      io.to(roomName).emit('new-message', {
        ...data,
        requestId: request._id,
        senderId: socket.accountId,
        senderName:
          socket.account?.profile?.fullName ||
          socket.account?.username,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);

      socket.emit('socket-error', {
        code: error.message,
        message: 'Failed to send message',
      });
    }
  });

  // ============================================================
  // مؤشر الكتابة
  // ============================================================

  socket.on('typing', async (data) => {
    try {
      const request = await getAuthorizedRequest(
        socket,
        data?.requestId
      );

      socket.to(`request-${request._id}`).emit('user-typing', {
        userId: socket.accountId,
        name:
          socket.account?.profile?.fullName ||
          socket.account?.username,
        isTyping: Boolean(data?.isTyping),
      });
    } catch (error) {
      console.warn(
        `🚫 Typing denied: account=${socket.accountId}, ` +
        `request=${data?.requestId}, portal=${socket.portalId}, ` +
        `reason=${error.message}`
      );
    }
  });

  // ============================================================
  // تحديث حالة الطلب عبر Socket
  // ============================================================

  socket.on('status-update', async (data) => {
    try {
      const request = await getAuthorizedRequest(
        socket,
        data?.requestId
      );

      io.to(`request-${request._id}`).emit('status-changed', {
        requestId: request._id,
        status: data?.status,
        updatedBy: socket.accountId,
        updatedByName:
          socket.account?.profile?.fullName ||
          socket.account?.username,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('❌ Status update denied:', error);

      socket.emit('socket-error', {
        code: error.message,
        message: 'Failed to update request status',
      });
    }
  });

  // ============================================================
  // بدء المكالمة
  // ============================================================

  socket.on('call-user', async (data) => {
    try {
      const request = await getAuthorizedRequest(
        socket,
        data?.requestId
      );

      const targetSocket = getSocketInAuthorizedRoom(
        request,
        data?.targetSocketId
      );

      // دعم targetUserId الموجود في الواجهة الحالية
      let finalTargetSocket = targetSocket;

      if (!finalTargetSocket && data?.targetUserId) {
        const roomName = `request-${request._id}`;
        const room = io.sockets.adapter.rooms.get(roomName);

        if (room) {
          for (const socketId of room) {
            const candidate = io.sockets.sockets.get(socketId);

            if (
              candidate &&
              candidate.portalId &&
              String(candidate.portalId) === String(socket.portalId) &&
              String(candidate.accountId) === String(data.targetUserId)
            ) {
              finalTargetSocket = candidate;
              break;
            }
          }
        }
      }

      if (!finalTargetSocket) {
        socket.emit('call-error', {
          message: 'المستخدم المستهدف غير متصل حالياً',
        });
        return;
      }

      console.log(
        `📞 Call request from ${socket.accountId}` +
        ` to ${finalTargetSocket.accountId}` +
        ` | request=${request._id}` +
        ` | portal=${socket.portalId}`
      );

      finalTargetSocket.emit('incoming-call', {
        callerId: socket.accountId,
        callerName:
          socket.account?.profile?.fullName ||
          socket.account?.username,
        callerSocketId: socket.id,
        requestId: request._id,
        offer: data?.offer,
        type: data?.type || 'video',
        isScheduled: data?.isScheduled || false,
        scheduledAt: data?.scheduledAt || null,
      });
    } catch (error) {
      console.error('❌ Call request denied:', error);

      socket.emit('call-error', {
        code: error.message,
        message: 'You are not authorized to start this call',
      });
    }
  });

  // ============================================================
  // قبول المكالمة
  // ============================================================

  socket.on('accept-call', async (data) => {
    try {
      const request = await getAuthorizedRequest(
        socket,
        data?.requestId
      );

      const callerSocket = getSocketInAuthorizedRoom(
        request,
        data?.callerSocketId
      );

      if (!callerSocket) {
        socket.emit('call-error', {
          message: 'المتصل غير موجود في نفس الطلب',
        });
        return;
      }

      console.log(
        `📞 Call accepted by ${socket.accountId}` +
        ` | request=${request._id}` +
        ` | portal=${socket.portalId}`
      );

      callerSocket.emit('call-accepted', {
        calleeId: socket.accountId,
        calleeName:
          socket.account?.profile?.fullName ||
          socket.account?.username,
        calleeSocketId: socket.id,
        requestId: request._id.toString(),
        answer: data?.answer,
      });
    } catch (error) {
      console.error('❌ Accept call denied:', error);

      socket.emit('call-error', {
        code: error.message,
        message: 'You are not authorized to accept this call',
      });
    }
  });

  // ============================================================
  // رفض المكالمة
  // ============================================================

  socket.on('reject-call', async (data) => {
    try {
      const request = await getAuthorizedRequest(
        socket,
        data?.requestId
      );

      const callerSocket = getSocketInAuthorizedRoom(
        request,
        data?.callerSocketId
      );

      if (!callerSocket) {
        socket.emit('call-error', {
          message: 'المتصل غير موجود في نفس الطلب',
        });
        return;
      }

      console.log(
        `📞 Call rejected by ${socket.accountId}` +
        ` | request=${request._id}` +
        ` | portal=${socket.portalId}`
      );

callerSocket.emit('call-rejected', {
  userId: socket.accountId,
  userName:
    socket.account?.profile?.fullName ||
    socket.account?.username,
  requestId: request._id.toString(),
});

    } catch (error) {
      console.error('❌ Reject call denied:', error);

      socket.emit('call-error', {
        code: error.message,
        message: 'You are not authorized to reject this call',
      });
    }
  });
// ============================================================
// إنهاء المكالمة
// ============================================================

socket.on('end-call', async (data) => {
  try {
    const request = await getAuthorizedRequest(
      socket,
      data?.requestId
    );

    const targetSocketId = data?.targetSocketId;

    if (!targetSocketId) {
      console.warn(
        `⚠️ End call ignored: no targetSocketId | ` +
        `account=${socket.accountId}, request=${request._id}`
      );
      return;
    }

    const targetSocket = getSocketInAuthorizedRoom(
      request,
      targetSocketId
    );

    if (!targetSocket) {
      console.warn(
        `⚠️ End call target not found or not authorized: ` +
        `target=${targetSocketId}, request=${request._id}, ` +
        `portal=${socket.portalId}`
      );
      return;
    }

    console.log(
      `📞 Call ended by ${socket.accountId}` +
      ` -> ${targetSocket.accountId}` +
      ` | request=${request._id}` +
      ` | portal=${socket.portalId}`
    );
targetSocket.emit('call-ended', {
  userId: socket.accountId,
  userName:
    socket.account?.profile?.fullName ||
    socket.account?.username,
  socketId: socket.id,
  requestId: request._id.toString(),
});

  } catch (error) {
    console.error('❌ End call denied:', error);

    socket.emit('call-error', {
      code: error.message,
      message: 'You are not authorized to end this call',
    });
  }
});

// ============================================================
// ICE Candidate
// ============================================================

socket.on('ice-candidate', async (data) => {
  try {
    const request = await getAuthorizedRequest(
      socket,
      data?.requestId
    );

    const targetSocketId = data?.targetSocketId;

    if (!targetSocketId) {
      console.warn(
        `⚠️ ICE candidate ignored: no targetSocketId | ` +
        `account=${socket.accountId}, request=${request._id}`
      );
      return;
    }

    const targetSocket = getSocketInAuthorizedRoom(
      request,
      targetSocketId
    );

    if (!targetSocket) {
      console.warn(
        `⚠️ ICE target not found or not authorized: ` +
        `target=${targetSocketId}, request=${request._id}, ` +
        `portal=${socket.portalId}`
      );
      return;
    }
    
targetSocket.emit('ice-candidate', {
  userId: socket.accountId,
  socketId: socket.id,
  requestId: request._id.toString(),
  candidate: data?.candidate,
});

  } catch (error) {
    console.warn(
      `🚫 ICE candidate denied: account=${socket.accountId}, ` +
      `request=${data?.requestId}, portal=${socket.portalId}, ` +
      `reason=${error.message}`
    );

    socket.emit('socket-error', {
      code: error.message,
      message: 'You are not authorized for this request',
    });
  }
});

  // ============================================================
  // تحديث حالة المكالمة
  // ============================================================

  socket.on('call-status', async (data) => {
    try {
      const request = await getAuthorizedRequest(
        socket,
        data?.requestId
      );

      socket.to(`request-${request._id}`).emit(
        'call-status-update',
        {
          userId: socket.accountId,
          userName:
            socket.account?.profile?.fullName ||
            socket.account?.username,
          status: data?.status,
        }
      );
    } catch (error) {
      console.warn(
        `🚫 Call status denied: account=${socket.accountId}, ` +
        `request=${data?.requestId}, portal=${socket.portalId}, ` +
        `reason=${error.message}`
      );

      socket.emit('socket-error', {
        code: error.message,
        message: 'You are not authorized for this request',
      });
    }
  });

  // ============================================================
  // انقطاع الاتصال
  // ============================================================

  socket.on('disconnect', () => {
    console.log(
      `🔌 Client disconnected: ${socket.id}` +
      ` (Account: ${socket.accountId}, Portal: ${socket.portalId})`
    );
  // ============================================================
  // ✅ Live Stream Events
  // ============================================================

  // الانضمام لغرفة البث
  socket.on('join-live', (data) => {
    const { videoId } = data;
    if (!videoId) return;

    socket.join(`live-${videoId}`);
    console.log(`📺 User ${socket.accountId} joined live ${videoId}`);

    socket.to(`live-${videoId}`).emit('viewer-joined', {
      userId: socket.accountId,
      userName: socket.account?.profile?.fullName || 'مستخدم',
    });
  });

  // مغادرة غرفة البث
  socket.on('leave-live', (data) => {
    const { videoId } = data;
    if (!videoId) return;

    socket.leave(`live-${videoId}`);
    console.log(`📺 User ${socket.accountId} left live ${videoId}`);

    socket.to(`live-${videoId}`).emit('viewer-left', {
      userId: socket.accountId,
    });
  });

  // رسالة دردشة
  socket.on('live-message', (data) => {
    const { videoId, message } = data;
    if (!videoId || !message) return;

    io.to(`live-${videoId}`).emit('live-message', {
      userId: socket.accountId,
      userName: socket.account?.profile?.fullName || 'مستخدم',
      message,
      timestamp: new Date(),
    });
  });
    // لا نستخدم io.emit هنا حتى لا يصل الحدث إلى Portal أخرى.
    // نرسل إشعار الانقطاع فقط إلى غرف Requests التي كان Socket
    // عضوًا فيها، وبالتالي تبقى الأحداث معزولة حسب Request/Portal.

    for (const roomName of socket.rooms) {
      if (!roomName.startsWith('request-')) {
        continue;
      }

      socket.to(roomName).emit('user-disconnected', {
        userId: socket.accountId,
        socketId: socket.id,
      });
    }
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