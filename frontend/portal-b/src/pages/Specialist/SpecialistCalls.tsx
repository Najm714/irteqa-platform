// frontend/portal-a/src/pages/Specialist/SpecialistCalls.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaPhoneAlt, FaVideo, FaClock, FaCheckCircle, FaTimesCircle, FaUser, FaCalendarAlt, FaFilter, FaPhone, FaMicrophone } from 'react-icons/fa';

interface Call {
  _id: string;
  purpose: string;
  requestId: string;
  requestNumber: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'started' | 'completed' | 'cancelled' | 'missed';
  type: 'audio' | 'video';
  callUrl?: string;
  customer?: { _id: string; profile: { fullName: string } };
  requestedBy?: string;
  requestedRole?: string;
}

const SpecialistCalls: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        // ✅ استخدام المسار الصحيح للمكالمات
        const url = filter === 'all' 
          ? `${API_URL}/calls/specialist` 
          : `${API_URL}/calls/specialist?status=${filter}`;
        
        console.log('📞 Fetching specialist calls:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });
        const data = await response.json();
        console.log('📞 Calls response:', data);
        
        if (data.success) {
          setCalls(data.data || []);
        } else {
          console.error('Error fetching calls:', data.message);
        }
      } catch (error) {
        console.error('Error fetching calls:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCalls();
  }, [token, filter]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      'scheduled': { label: 'مجدولة', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      'started': { label: 'بدأت', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      'completed': { label: 'مكتملة', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      'cancelled': { label: 'ملغية', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      'missed': { label: 'فائتة', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    };
    return map[status] || map.scheduled;
  };

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

  // ✅ دالة بدء المكالمة
  const handleStartCall = (callId: string) => {
    // سيتم تنفيذها لاحقاً
    console.log('📞 Starting call:', callId);
    navigate(`/request/${callId}`);
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
          <FaPhoneAlt className="text-purple-600" />
          المكالمات
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({calls.length} مكالمة)
          </span>
        </h3>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
        >
          <option value="all">جميع المكالمات</option>
          <option value="scheduled">مجدولة</option>
          <option value="started">بدأت</option>
          <option value="completed">مكتملة</option>
          <option value="cancelled">ملغية</option>
        </select>
        <button className="px-4 py-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
          <FaFilter />
        </button>
      </div>

      {/* Calls List */}
      {calls.length > 0 ? (
        <div className="space-y-3">
          {calls.map((call) => {
            const status = getStatusBadge(call.status);
            const isAudio = call.type === 'audio';
            
            return (
              <div
                key={call._id}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer ${
                  call.status === 'scheduled' ? 'border-blue-200 dark:border-blue-800' : ''
                }`}
                onClick={() => navigate(`/request/${call.requestId}`)}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      {isAudio ? (
                        <FaPhone className="text-blue-500" />
                      ) : (
                        <FaVideo className="text-purple-500" />
                      )}
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {call.purpose || 'مكالمة'}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isAudio 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {isAudio ? '🎤 صوتي' : '📹 فيديو'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt className="w-3 h-3" />
                        {formatDate(call.scheduledAt)} - {formatTime(call.scheduledAt)}
                      </span>
                      <span>⏱️ {call.duration} دقيقة</span>
                      <span>#{call.requestNumber || 'طلب'}</span>
                    </div>
                  </div>
                  
                  {/* ✅ أزرار التحكم حسب الحالة */}
                  {call.status === 'scheduled' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartCall(call._id); }}
                      className={`px-4 py-2 text-white rounded-lg transition flex items-center gap-2 ${
                        isAudio 
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      {isAudio ? <FaPhone className="w-4 h-4" /> : <FaVideo className="w-4 h-4" />}
                      ابدأ المكالمة
                    </button>
                  )}
                  
                  {call.status === 'started' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/request/${call.requestId}`); }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <FaCheckCircle className="w-4 h-4" />
                      انضم للمكالمة
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <FaPhoneAlt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد مكالمات</h4>
          <p className="text-gray-500 dark:text-gray-400">ليس لديك أي مكالمات حالياً</p>
        </div>
      )}
    </div>
  );
};

export default SpecialistCalls;