// frontend/portal-a/src/pages/LiveStreamViewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Hls from 'hls.js';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import {
  FaUsers,
  FaEye,
  FaCircle,
  FaPaperPlane,
  FaSpinner,
  FaExclamationCircle,
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const SOCKET_URL = API_URL.replace('/api', '');
const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

const LiveStreamViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [liveStream, setLiveStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewers, setViewers] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(false);

  // ✅ جلب بيانات البث
  useEffect(() => {
    const fetchLiveStream = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/live-streams/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Portal-Id': PORTAL_ID,
            },
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'فشل جلب البث');
        }

        setLiveStream(data.data);
        setViewers(data.data.liveViewers || 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchLiveStream();
    }
  }, [id, token]);

  // ✅ تشغيل HLS
  useEffect(() => {
    if (!liveStream?.livePlaybackUrl || !videoRef.current) return;

    const video = videoRef.current;
    const url = liveStream.livePlaybackUrl;

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 30,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS manifest parsed');
        video.play().catch((err) => {
          console.warn('⚠️ Autoplay failed:', err);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS error:', data);
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // ✅ Safari
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
      });
    }
  }, [liveStream?.livePlaybackUrl]);

  // ✅ Socket.IO
  useEffect(() => {
    if (!token || !id) return;

    const socket = io(SOCKET_URL, {
      auth: {
        token: token.replace('Bearer ', ''),
        portalId: PORTAL_ID,
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      setConnected(true);

      // ✅ الانضمام لغرفة البث
      socket.emit('join-live', { videoId: id });

      // ✅ إشعار انضمام
      fetch(`${API_URL}/live-streams/${id}/viewers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'join' }),
      }).catch(console.error);
    });

    socket.on('disconnect', () => {
      setConnected(false);

      // ✅ إشعار مغادرة
      fetch(`${API_URL}/live-streams/${id}/viewers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'leave' }),
      }).catch(console.error);
    });

    socket.on('viewers-update', (data) => {
      setViewers(data.viewers);
    });

    socket.on('live-message', (msg) => {
      setMessages((prev) => [...prev, msg]);

      // ✅ Scroll للأسفل
      setTimeout(() => {
        chatRef.current?.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    });

    socket.on('live-ended', () => {
      setError('انتهى البث المباشر');
    });

    return () => {
      socket.emit('leave-live', { videoId: id });
      socket.disconnect();
    };
  }, [token, id]);

  // ✅ إرسال رسالة
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('live-message', {
      videoId: id,
      message: newMessage.trim(),
    });

    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <FaSpinner className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="text-center text-white">
          <FaExclamationCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">خطأ</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white" dir="rtl">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{liveStream?.titleAr}</h1>
            <p className="text-gray-400 text-sm">
              {liveStream?.instructor}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Live Badge */}
            {liveStream?.liveStatus === 'live' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full animate-pulse">
                <FaCircle className="text-xs" />
                <span className="font-bold">مباشر</span>
              </div>
            )}
            
            {/* Viewers */}
            <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full">
              <FaEye />
              <span>{viewers}</span>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full"
                controls
                autoPlay
                playsInline
                muted
              />
            </div>

            {/* Description */}
            {liveStream?.descriptionAr && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="font-bold mb-2">عن البث</h3>
                <p className="text-gray-300 text-sm">
                  {liveStream.descriptionAr}
                </p>
              </div>
            )}
          </div>

          {/* Live Chat */}
          <div className="bg-gray-800 rounded-lg flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <FaUsers />
                الدردشة المباشرة
              </h3>
              <span className="text-xs text-gray-400">
                {connected ? '🟢 متصل' : '🔴 غير متصل'}
              </span>
            </div>

            {/* Messages */}
            <div
              ref={chatRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>لا توجد رسائل بعد</p>
                  <p className="text-xs mt-2">كن أول من يشارك!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      msg.userId === user?.id ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-purple-400">
                        {msg.userName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-lg max-w-[80%] ${
                        msg.userId === user?.id
                          ? 'bg-purple-600'
                          : 'bg-gray-700'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="اكتب رسالة..."
                  className="flex-1 px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={!connected}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!connected || !newMessage.trim()}
                  className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamViewer;