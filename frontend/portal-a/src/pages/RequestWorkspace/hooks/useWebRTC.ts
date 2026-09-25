// src/pages/RequestWorkspace/hooks/useWebRTC.ts
import { useRef, useCallback, useState } from 'react';
import type { CallState, CallType, IncomingCallData } from '../types';
import { ICE_SERVERS } from '../utils/constants';
import type { Socket } from 'socket.io-client';

// ============================================================
// ✅ Hook: useWebRTC
// ============================================================
export const useWebRTC = (
  requestId: string | undefined,
  socketRef: React.MutableRefObject<Socket | null>
) => {
  // ============================================================
  // ✅ Refs (لا تستخدم State داخل callbacks)
  // ============================================================
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerSocketIdRef = useRef<string | null>(null);
  const pendingLocalIceRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingRemoteIceRef = useRef<RTCIceCandidateInit[]>([]);
  const callTypeRef = useRef<CallType>('video');
  const isEndingRef = useRef(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const ringtoneRef = useRef<{
    oscillator: OscillatorNode;
    gainNode: GainNode;
    interval: ReturnType<typeof setInterval>;
    audioContext: AudioContext;
  } | null>(null);

  // ============================================================
  // ✅ State
  // ============================================================
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isCalling: false,
    isRinging: false,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoOn: true,
    callStatus: 'idle',
    callType: 'video',
  });

  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null
  );

  // ============================================================
  // ✅ Ringtone
  // ============================================================
  const stopRingtone = useCallback(() => {
    try {
      const ringtone = ringtoneRef.current;
      if (!ringtone) return;

      clearInterval(ringtone.interval);
      try {
        ringtone.oscillator.stop();
      } catch {}
      try {
        ringtone.audioContext.close();
      } catch {}
      ringtoneRef.current = null;
    } catch (error) {
      console.error('❌ Failed to stop ringtone:', error);
    }
  }, []);

  const playRingtone = useCallback(() => {
    try {
      stopRingtone();

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      gainNode.gain.value = 0.3;
      oscillator.start();

      let count = 0;
      const interval = setInterval(() => {
        gainNode.gain.value = gainNode.gain.value === 0.3 ? 0 : 0.3;
        count++;
        if (count >= 20) clearInterval(interval);
      }, 500);

      ringtoneRef.current = { oscillator, gainNode, interval, audioContext };
    } catch (error) {
      console.error('❌ Failed to play ringtone:', error);
    }
  }, [stopRingtone]);

  // ============================================================
  // ✅ Cleanup
  // ============================================================
  const cleanupPeerConnection = useCallback(() => {
    const pc = peerConnectionRef.current;
    if (pc) {
      try {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.oniceconnectionstatechange = null;
        pc.onconnectionstatechange = null;
        pc.close();
      } catch {}
    }
    peerConnectionRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
    }
    localStreamRef.current = null;

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
    }
    remoteStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    peerSocketIdRef.current = null;
    pendingLocalIceRef.current = [];
    pendingRemoteIceRef.current = [];
  }, []);

  // ============================================================
  // ✅ Peer Connection Failure
  // ============================================================
  const handlePeerFailure = useCallback(() => {
    console.error('❌ WebRTC peer connection failed');
    cleanupPeerConnection();
    setCallState((prev) => ({
      ...prev,
      isInCall: false,
      isCalling: false,
      isRinging: false,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOn: true,
      callStatus: 'ended',
    }));
  }, [cleanupPeerConnection]);

  // ============================================================
  // ✅ Create Peer Connection
  // ============================================================
  const createPeerConnection = useCallback(
    (stream: MediaStream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        console.log('📺 Remote track received');
        let remoteStream = remoteStreamRef.current;

        if (!remoteStream) {
          remoteStream = event.streams?.[0] || new MediaStream();
          remoteStreamRef.current = remoteStream;
        }

        if (
          !event.streams?.[0] &&
          !remoteStream.getTracks().some((t) => t.id === event.track.id)
        ) {
          remoteStream.addTrack(event.track);
        }

        setCallState((prev) => ({ ...prev, remoteStream }));

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(() => {});
        }
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const candidate = event.candidate.toJSON();
        const socket = socketRef.current;
        const targetSocketId = peerSocketIdRef.current;

        if (!socket?.connected || !targetSocketId) {
          pendingLocalIceRef.current.push(candidate);
          return;
        }

        socket.emit('ice-candidate', {
          requestId,
          targetSocketId,
          candidate,
        });
      };

      pc.oniceconnectionstatechange = () => {
        console.log('🔗 ICE state:', pc.iceConnectionState);
        if (
          pc.iceConnectionState === 'failed' ||
          pc.iceConnectionState === 'closed'
        ) {
          handlePeerFailure();
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('🔗 Peer state:', pc.connectionState);
        if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          handlePeerFailure();
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [requestId, socketRef, handlePeerFailure]
  );

  // ============================================================
  // ✅ Get Media Constraints
  // ============================================================
  const getMediaConstraints = useCallback(
    (callType: CallType): MediaStreamConstraints => ({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video:
        callType === 'video'
          ? {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            }
          : false,
    }),
    []
  );

  // ============================================================
  // ✅ Start Call
  // ============================================================
  const startCall = useCallback(
    async (targetUserId: string, callType: CallType = 'video') => {
      if (!socketRef.current) {
        alert('⚠️ الاتصال بالخادم غير جاهز.');
        return;
      }
      if (!targetUserId) {
        alert('⚠️ لم يتم تحديد الطرف الآخر.');
        return;
      }

      try {
        isEndingRef.current = false;
        callTypeRef.current = callType;

        const stream = await navigator.mediaDevices.getUserMedia(
          getMediaConstraints(callType)
        );

        localStreamRef.current = stream;

        setCallState((prev) => ({
          ...prev,
          localStream: stream,
          isCalling: true,
          isInCall: false,
          isRinging: true,
          callStatus: 'calling',
          callType,
        }));

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.style.display =
            callType === 'audio' ? 'none' : 'block';
          if (callType === 'video') {
            localVideoRef.current.muted = true;
            localVideoRef.current.playsInline = true;
            localVideoRef.current.play().catch(() => {});
          }
        }

        const pc = createPeerConnection(stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketRef.current.emit('call-user', {
          requestId,
          targetUserId,
          offer: pc.localDescription,
          type: callType,
        });

        setCallState((prev) => ({ ...prev, callStatus: 'ringing' }));
      } catch (error: any) {
        console.error('❌ Failed to start call:', error);
        cleanupPeerConnection();
        alert(getMediaErrorMessage(error, callType));
        setCallState((prev) => ({
          ...prev,
          isCalling: false,
          isInCall: false,
          isRinging: false,
          callStatus: 'idle',
        }));
      }
    },
    [requestId, socketRef, createPeerConnection, getMediaConstraints, cleanupPeerConnection]
  );

  // ============================================================
  // ✅ Accept Call
  // ============================================================
  const acceptCall = useCallback(
    async (data: IncomingCallData) => {
      if (!socketRef.current) return;

      try {
        isEndingRef.current = false;
        stopRingtone();

        const callType = data.type || 'video';
        callTypeRef.current = callType;
        peerSocketIdRef.current = data.callerSocketId;

        const stream = await navigator.mediaDevices.getUserMedia(
          getMediaConstraints(callType)
        );

        localStreamRef.current = stream;

        setCallState((prev) => ({
          ...prev,
          localStream: stream,
          isInCall: true,
          isCalling: false,
          isRinging: false,
          callStatus: 'in-progress',
          callType,
        }));

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.style.display =
            callType === 'audio' ? 'none' : 'block';
          if (callType === 'video') {
            localVideoRef.current.muted = true;
            localVideoRef.current.playsInline = true;
            localVideoRef.current.play().catch(() => {});
          }
        }

        const pc = createPeerConnection(stream);
        await pc.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        // ✅ Flush pending remote ICE
        const pending = pendingRemoteIceRef.current;
        if (pending.length > 0) {
          for (const c of pending) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            } catch {}
          }
          pendingRemoteIceRef.current = [];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current.emit('accept-call', {
          requestId,
          callerSocketId: data.callerSocketId,
          answer: pc.localDescription,
        });

        setIncomingCall(null);
      } catch (error: any) {
        console.error('❌ Failed to accept call:', error);
        cleanupPeerConnection();
        stopRingtone();
        alert(getMediaErrorMessage(error, callTypeRef.current));
        setIncomingCall(null);
        setCallState((prev) => ({
          ...prev,
          isCalling: false,
          isInCall: false,
          isRinging: false,
          callStatus: 'idle',
        }));
      }
    },
    [requestId, socketRef, createPeerConnection, getMediaConstraints, cleanupPeerConnection, stopRingtone]
  );

  // ============================================================
  // ✅ End Call
  // ============================================================
  const endCall = useCallback(() => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    const socket = socketRef.current;
    const targetSocketId = peerSocketIdRef.current;

    if (socket?.connected) {
      socket.emit('end-call', {
        requestId,
        targetSocketId: targetSocketId || undefined,
      });
    }

    stopRingtone();
    cleanupPeerConnection();

    setCallState((prev) => ({
      ...prev,
      isInCall: false,
      isCalling: false,
      isRinging: false,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOn: true,
      callStatus: 'idle',
    }));

    setIncomingCall(null);

    setTimeout(() => {
      isEndingRef.current = false;
    }, 100);
  }, [requestId, socketRef, cleanupPeerConnection, stopRingtone]);

  // ============================================================
  // ✅ Toggle Mute
  // ============================================================
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setCallState((prev) => ({ ...prev, isMuted: !audioTrack.enabled }));
  }, []);

  // ============================================================
  // ✅ Toggle Video
  // ============================================================
  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCallState((prev) => ({ ...prev, isVideoOn: videoTrack.enabled }));
  }, []);

  // ============================================================
  // ✅ Handle Call Accepted (من Socket)
  // ============================================================
  const handleCallAccepted = useCallback(async (data: any) => {
    try {
      if (data.calleeSocketId) {
        peerSocketIdRef.current = data.calleeSocketId;
      }

      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('❌ No peer connection');
        return;
      }

      if (data.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }

      setCallState((prev) => ({
        ...prev,
        isRinging: false,
        isCalling: false,
        isInCall: true,
        callStatus: 'in-progress',
      }));

      setIncomingCall(null);
      stopRingtone();
    } catch (error) {
      console.error('❌ handleCallAccepted error:', error);
    }
  }, [stopRingtone]);

  // ============================================================
  // ✅ Handle Call Target (from socket)
  // ============================================================
  const handleCallTarget = useCallback((data: any) => {
    if (!data?.targetSocketId) return;
    peerSocketIdRef.current = data.targetSocketId;

    const socket = socketRef.current;
    if (socket?.connected && pendingLocalIceRef.current.length > 0) {
      for (const candidate of pendingLocalIceRef.current) {
        socket.emit('ice-candidate', {
          requestId,
          targetSocketId: data.targetSocketId,
          candidate,
        });
      }
      pendingLocalIceRef.current = [];
    }
  }, [requestId, socketRef]);

  // ============================================================
  // ✅ Handle ICE Candidate (from socket)
  // ============================================================
  const handleIceCandidate = useCallback(async (data: any) => {
    try {
      if (!data?.candidate) return;

      if (String(data.requestId) !== String(requestId)) return;

      if (
        data.socketId &&
        peerSocketIdRef.current &&
        data.socketId !== peerSocketIdRef.current
      ) {
        return;
      }

      const pc = peerConnectionRef.current;
      if (!pc) {
        pendingRemoteIceRef.current.push(data.candidate);
        return;
      }

      if (!pc.remoteDescription) {
        pendingRemoteIceRef.current.push(data.candidate);
        return;
      }

      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('❌ Error adding ICE:', error);
    }
  }, [requestId]);

  // ============================================================
  // ✅ Return
  // ============================================================
  return {
    callState,
    incomingCall,
    setIncomingCall,
    localVideoRef,
    remoteVideoRef,

    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo,

    playRingtone,
    stopRingtone,
    cleanupPeerConnection,

    handleCallAccepted,
    handleCallTarget,
    handleIceCandidate,
  };
};

// ============================================================
// ✅ Helper: رسالة خطأ الوسائط
// ============================================================
const getMediaErrorMessage = (error: any, callType: CallType): string => {
  if (error?.name === 'NotAllowedError') {
    return callType === 'audio'
      ? 'تم رفض الوصول إلى الميكروفون.'
      : 'تم رفض الوصول إلى الميكروفون/الكاميرا.';
  }
  if (error?.name === 'NotFoundError') {
    return callType === 'audio'
      ? 'لم يتم العثور على ميكروفون.'
      : 'لم يتم العثور على ميكروفون أو كاميرا.';
  }
  if (error?.name === 'NotReadableError') {
    return 'الجهاز مستخدم بواسطة تطبيق آخر.';
  }
  if (error?.name === 'OverconstrainedError') {
    return 'مواصفات الوسائط غير مدعومة.';
  }
  return 'تعذر الوصول إلى الميكروفون/الكاميرا.';
};