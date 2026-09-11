// backend/src/socket/index.js
import { authenticate } from '../middleware/auth.js';

export const setupSocketHandlers = (io) => {
  // ✅ مصادقة Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const req = {
        headers: { authorization: `Bearer ${token}` },
      };
      
      await new Promise((resolve, reject) => {
        authenticate(req, {}, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      socket.account = req.account;
      socket.accountId = req.accountId;
      socket.portalId = req.portalId;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // ✅ اتصال
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // الانضمام إلى غرفة الطلب
    socket.on('join-request', (requestId) => {
      socket.join(`request-${requestId}`);
      console.log(`📌 Joined request ${requestId}`);
    });

    // الخروج من غرفة الطلب
    socket.on('leave-request', (requestId) => {
      socket.leave(`request-${requestId}`);
      console.log(`📌 Left request ${requestId}`);
    });

    // مؤشر الكتابة
    socket.on('typing', (data) => {
      socket.to(`request-${data.requestId}`).emit('user-typing', {
        userId: socket.accountId,
        isTyping: data.isTyping,
      });
    });

    // قطع الاتصال
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};