// frontend/portal-a/src/pages/Specialist/SpecialistMessages.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaSpinner, FaComments, FaUser, FaEnvelope, FaClock, FaCheckCircle } from 'react-icons/fa';

interface Message {
  _id: string;
  sender: { _id: string; profile: { fullName: string } };
  senderRole: string;
  message: string;
  attachments: { fileId: string; filename: string }[];
  readBy: { accountId: string; readAt: Date }[];
  createdAt: string;
  requestId: string;
  requestNumber: string;
}

const SpecialistMessages: React.FC = () => {
  const { token } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const url = filter === 'all' 
          ? `${API_URL}/messages/specialist` 
          : `${API_URL}/messages/specialist?unread=${filter === 'unread'}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });
        const data = await response.json();
        if (data.success) {
          setMessages(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [token, filter]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isRead = (message: Message) => {
    return message.readBy?.some(r => r.accountId === message.sender?._id) || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaComments className="text-purple-600" />
          الرسائل
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({messages.length} رسالة)
          </span>
        </h3>
      </div>

      <div className="flex gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
        >
          <option value="all">جميع الرسائل</option>
          <option value="unread">غير مقروءة</option>
        </select>
      </div>

      {messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((msg) => {
            const read = isRead(msg);
            return (
              <div
                key={msg._id}
                className={`p-4 rounded-xl border transition ${
                  !read 
                    ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaUser className="w-4 h-4 text-gray-400" />
                        {msg.sender?.profile?.fullName || 'مستخدم'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {msg.senderRole === 'customer' ? 'عميل' : 
                         msg.senderRole === 'specialist' ? 'مختص' : 
                         msg.senderRole === 'portal_admin' ? 'مدير' : 'مشرف'}
                      </span>
                      {!read && (
                        <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">جديد</span>
                      )}
                      {read && (
                        <span className="flex items-center gap-1 text-xs text-green-500">
                          <FaCheckCircle className="w-3 h-3" /> مقروءة
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mt-2">{msg.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FaClock className="w-3 h-3" />
                        {formatDate(msg.createdAt)} - {formatTime(msg.createdAt)}
                      </span>
                      <span>📎 {msg.attachments?.length || 0} مرفقات</span>
                      <span>#{msg.requestNumber || 'طلب'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <FaComments className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد رسائل</h4>
          <p className="text-gray-500 dark:text-gray-400">ليس لديك أي رسائل حالياً</p>
        </div>
      )}
    </div>
  );
};

export default SpecialistMessages;