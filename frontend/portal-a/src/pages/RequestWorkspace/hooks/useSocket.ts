// src/pages/RequestWorkspace/hooks/useSocket.ts
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { IncomingCallData } from '../types';

// ============================================================
// ✅ Helper: استخراج portalId
// ============================================================
const resolvePortalId = (): string => {
  const envId = import.meta.env.VITE_PORTAL_ID;
  if (envId) return envId;
  const pathMatch = window.location.pathname.match(/\/portal\/([^/]+)/);
  if (pathMatch?.[1]) return pathMatch[1];
  const host = window.location.hostname;
  if (host !== 'localhost' && host.includes('.')) {
    const sub = host.split('.')[0];
    if (sub && sub !== 'www') return sub;
  }
  return '';
};

// ============================================================
// ✅ Types
// ============================================================
interface UseSocketOptions {
  requestId: string | undefined;
  token: string | null;
  socketRef: React.RefObject<Socket | null>;  // ✅ RefObject بدل MutableRefObject
  onIncomingCall?: (data: IncomingCallData) => void;
  onCallAccepted?: (data: any) => void;
  onCallRejected?: (data: any) => void;
  onCallEnded?: (data: any) => void;
  onIceCandidate?: (data: any) => void;
  onCallTarget?: (data: any) => void;
  onCallStarted?: (data: any) => void;
  onCallScheduled?: (data: any) => void;
  onCallCancelled?: (data: any) => void;
}

// ============================================================
// ✅ Hook: useSocket
// ============================================================
export const useSocket = ({
  requestId,
  token,
  socketRef,                                 // ← من prop
  onIncomingCall,
  onCallAccepted,
  onCallRejected,
  onCallEnded,
  onIceCandidate,
  onCallTarget,
  onCallStarted,
  onCallScheduled,
  onCallCancelled,
}: UseSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);

  // ✅ الـ ref يأتي من الخارج — لا ننشئ واحداً جديداً
  // const socketRef = useRef<Socket | null>(null);  ← احذف هذا السطر

  const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
  const PORTAL_ID = resolvePortalId();

  // ✅ Use refs for callbacks to avoid re-creating socket
  const callbacksRef = useRef({
    onIncomingCall,
    onCallAccepted,
    onCallRejected,
    onCallEnded,
    onIceCandidate,
    onCallTarget,
    onCallStarted,
    onCallScheduled,
    onCallCancelled,
  });

  useEffect(() => {
    callbacksRef.current = {
      onIncomingCall,
      onCallAccepted,
      onCallRejected,
      onCallEnded,
      onIceCandidate,
      onCallTarget,
      onCallStarted,
      onCallScheduled,
      onCallCancelled,
    };
  }, [
    onIncomingCall,
    onCallAccepted,
    onCallRejected,
    onCallEnded,
    onIceCandidate,
    onCallTarget,
    onCallStarted,
    onCallScheduled,
    onCallCancelled,
  ]);

  // ============================================================
  // ✅ Init Socket
  // ============================================================
  useEffect(() => {
    if (!token || !PORTAL_ID || !requestId) {
      console.warn('⚠️ Socket init skipped: missing token/portalId/requestId');
      return;
    }

    console.log('🔌 useSocket: Initializing socket for request', requestId);

    const socket = io(SOCKET_URL, {
      auth: { token, portalId: PORTAL_ID },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // ============================================================
    // ✅ Handlers
    // ============================================================
    const handleConnect = () => {
      console.log('🔌 Socket connected:', socket.id);
      setIsConnected(true);
      socket.emit('join-request', requestId);
      console.log(`📌 Joined request room: request-${requestId}`);
    };

    const handleDisconnect = (reason: string) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    };

    const handleIncomingCall = (data: IncomingCallData) => {
      console.log('📞 INCOMING CALL:', data);
      if (data.requestId !== requestId) return;
      callbacksRef.current.onIncomingCall?.(data);
    };

    const handleCallAccepted = (data: any) => {
      if (data?.requestId && String(data.requestId) !== String(requestId)) return;
      console.log('📞 Call accepted');
      callbacksRef.current.onCallAccepted?.(data);
    };

    const handleCallRejected = (data: any) => {
      if (data?.requestId && String(data.requestId) !== String(requestId)) return;
      console.log('📞 Call rejected');
      callbacksRef.current.onCallRejected?.(data);
    };

    const handleCallEnded = (data: any) => {
      if (data?.requestId && String(data.requestId) !== String(requestId)) return;
      console.log('📞 Call ended');
      callbacksRef.current.onCallEnded?.(data);
    };

    const handleIceCandidate = (data: any) => {
      if (String(data?.requestId) !== String(requestId)) return;
      callbacksRef.current.onIceCandidate?.(data);
    };

    const handleCallTarget = (data: any) => {
      if (String(data?.requestId) !== String(requestId)) return;
      callbacksRef.current.onCallTarget?.(data);
    };

    const handleCallStarted = (data: any) => {
      callbacksRef.current.onCallStarted?.(data);
    };

    const handleCallScheduled = (data: any) => {
      callbacksRef.current.onCallScheduled?.(data);
    };

    const handleCallCancelled = (data: any) => {
      callbacksRef.current.onCallCancelled?.(data);
    };

    // ============================================================
    // ✅ Register Listeners
    // ============================================================
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-target', handleCallTarget);
    socket.on('call-started', handleCallStarted);
    socket.on('call-scheduled', handleCallScheduled);
    socket.on('call-cancelled', handleCallCancelled);

    // ============================================================
    // ✅ Cleanup
    // ============================================================
    return () => {
      console.log('🔌 useSocket: Cleaning up socket for request', requestId);

      // ✅ غادر الغرفة أولاً
      if (socket.connected && requestId) {
        socket.emit('leave-request', requestId);
      }

      // ✅ أزل جميع المستمعين
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-target', handleCallTarget);
      socket.off('call-started', handleCallStarted);
      socket.off('call-scheduled', handleCallScheduled);
      socket.off('call-cancelled', handleCallCancelled);

      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [requestId, token, SOCKET_URL, PORTAL_ID, socketRef]);

  // ============================================================
  // ✅ Return
  // ============================================================
  return {
    isConnected,
    emit: (event: string, data: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data);
      } else {
        console.warn('⚠️ Cannot emit — socket not connected');
      }
    },
  };
};