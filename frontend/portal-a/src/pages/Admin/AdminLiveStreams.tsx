// frontend/portal-a/src/pages/Admin/AdminLiveStreams.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaVideo,
  FaPlus,
  FaEdit,
  FaTrash,
  FaPlay,
  FaStop,
  FaCopy,
  FaEye,
  FaSpinner,
  FaTimes,
  FaCheckCircle,
  FaClock,
  FaUserTie,
  FaBook,
  FaCalendarAlt,
  FaCircle,
  FaKey,
  FaBroadcastTower,
  FaExclamationTriangle,
  FaSyncAlt,
  FaChartLine,
} from 'react-icons/fa';

// ============================================================
// Types
// ============================================================
interface LiveStream {
  _id: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  instructor: string;
  materialId: any;
  universityId: any;
  collegeId: any;
  specialtyId: any;
  liveStreamUid: string;
  liveRtmpUrl: string;
  liveRtmpKey?: string;
  livePlaybackUrl: string;
  liveStatus: 'idle' | 'live' | 'ended' | 'error';
  liveAccessType: 'public' | 'subscription' | 'private';
  liveSchedule: {
    scheduledAt?: string;
    startedAt?: string;
    endedAt?: string;
    duration?: number;
  };
  liveViewers: number;
  liveStats: {
    peakViewers: number;
    totalViews: number;
  };
  liveCreatedBy?: any;
  thumbnail?: string;
  createdAt: string;
}

interface Material {
  _id: string;
  name: string;
  nameAr: string;
  code: string;
  specialtyId?: string | { _id: string; name: string; nameAr: string };
  universityId?: string | any;
  collegeId?: string | any;
}

interface Specialist {
  _id: string;
  profile: { fullName: string };
  email: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

const AdminLiveStreams: React.FC = () => {
  const { token } = useAuth();

  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showCredentials, setShowCredentials] = useState<LiveStream | null>(null);
  const [editingStream, setEditingStream] = useState<LiveStream | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    instructor: '',
    materialId: '',
    universityId: '',
    collegeId: '',
    specialtyId: '',
    scheduledAt: '',
    recording: true,
    accessType: 'subscription',
  });

  // ============================================================
  // جلب البيانات
  // ============================================================
  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Portal-Id': PORTAL_ID,
      };

      const [streamsRes, materialsRes, usersRes, universitiesRes] = await Promise.all([
        fetch(`${API_URL}/live-streams`, { headers }),
        fetch(`${API_URL}/explanations/materials`, { headers }),
        fetch(`${API_URL}/admin/users?role=specialist&limit=100`, { headers }),
        fetch(`${API_URL}/explanations/universities`, { headers }),
      ]);

      const [streamsData, materialsData, usersData, universitiesData] = await Promise.all([
        streamsRes.json(),
        materialsRes.json(),
        usersRes.json(),
        universitiesRes.json(),
      ]);

      if (streamsData.success) setLiveStreams(streamsData.data || []);
      if (materialsData.success) setMaterials(materialsData.data || []);
      if (usersData.success) setSpecialists(usersData.data || []);
      if (universitiesData.success) setUniversities(universitiesData.data || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // جلب الكليات عند اختيار الجامعة
  // ============================================================
  useEffect(() => {
    if (!formData.universityId || !token) return;

    const fetchColleges = async () => {
      try {
        const response = await fetch(
          `${API_URL}/explanations/colleges?universityId=${formData.universityId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Portal-Id': PORTAL_ID,
            },
          }
        );
        const data = await response.json();
        if (data.success) setColleges(data.data || []);
      } catch (err) {
        console.error('Error fetching colleges:', err);
      }
    };

    fetchColleges();
  }, [formData.universityId, token]);

  // ============================================================
  // جلب التخصصات عند اختيار الكلية
  // ============================================================
  useEffect(() => {
    if (!formData.collegeId || !token) return;

    const fetchSpecialties = async () => {
      try {
        const response = await fetch(
          `${API_URL}/explanations/specialties?collegeId=${formData.collegeId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Portal-Id': PORTAL_ID,
            },
          }
        );
        const data = await response.json();
        if (data.success) setSpecialties(data.data || []);
      } catch (err) {
        console.error('Error fetching specialties:', err);
      }
    };

    fetchSpecialties();
  }, [formData.collegeId, token]);

  // ============================================================
  // إنشاء بث جديد
  // ============================================================
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.titleAr) {
      alert('العنوان مطلوب');
      return;
    }

    if (!formData.materialId) {
      alert('المادة مطلوبة');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/live-streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'فشل إنشاء البث');
      }

      await fetchData();
      setShowModal(false);
      setShowCredentials(data.data);
      setFormData({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        instructor: '',
        materialId: '',
        universityId: '',
        collegeId: '',
        specialtyId: '',
        scheduledAt: '',
        recording: true,
        accessType: 'subscription',
      });
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // بدء / إنهاء / حذف
  // ============================================================
  const handleStart = async (id: string) => {
    if (!confirm('هل تريد بدء البث؟')) return;

    try {
      const response = await fetch(`${API_URL}/live-streams/${id}/start`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEnd = async (id: string) => {
    if (!confirm('هل تريد إنهاء البث؟')) return;

    try {
      const response = await fetch(`${API_URL}/live-streams/${id}/end`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      const response = await fetch(`${API_URL}/live-streams/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ============================================================
  // عرض Credentials
  // ============================================================
  const handleShowCredentials = async (stream: LiveStream) => {
    try {
      const response = await fetch(
        `${API_URL}/live-streams/${stream._id}/details`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        }
      );
      const data = await response.json();

      if (data.success && data.data.cloudflare) {
        setShowCredentials({
          ...stream,
          liveRtmpUrl: data.data.cloudflare.rtmpUrl,
          liveRtmpKey: data.data.cloudflare.rtmpKey,
        });
      } else {
        setShowCredentials(stream);
      }
    } catch (err) {
      setShowCredentials(stream);
    }
  };

  // ============================================================
  // نسخ
  // ============================================================
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`✅ تم نسخ ${label}`);
  };

  // ============================================================
  // Status Badge
  // ============================================================
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      idle: { color: 'bg-yellow-100 text-yellow-700', text: '⏸️ بانتظار' },
      live: { color: 'bg-red-100 text-red-700 animate-pulse', text: '🔴 مباشر' },
      ended: { color: 'bg-gray-100 text-gray-700', text: '✅ انتهى' },
      error: { color: 'bg-red-100 text-red-700', text: '❌ خطأ' },
    };
    const badge = badges[status] || badges.idle;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // ============================================================
  // تنسيق التاريخ
  // ============================================================
  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ============================================================
  // Loading
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <FaSpinner className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaBroadcastTower className="text-purple-600" />
              إدارة البث المباشر
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              إنشاء وإدارة البثوث المباشرة للمواد التعليمية
            </p>
          </div>

          <button
            onClick={() => {
              setEditingStream(null);
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center gap-2"
          >
            <FaPlus />
            بث مباشر جديد
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">الإجمالي</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {liveStreams.length}
                </p>
              </div>
              <FaVideo className="text-purple-500 text-2xl" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">مباشر الآن</p>
                <p className="text-2xl font-bold text-red-500 mt-1">
                  {liveStreams.filter(s => s.liveStatus === 'live').length}
                </p>
              </div>
              <FaCircle className="text-red-500 text-2xl animate-pulse" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">بانتظار البدء</p>
                <p className="text-2xl font-bold text-yellow-500 mt-1">
                  {liveStreams.filter(s => s.liveStatus === 'idle').length}
                </p>
              </div>
              <FaClock className="text-yellow-500 text-2xl" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المشاهدات</p>
                <p className="text-2xl font-bold text-blue-500 mt-1">
                  {liveStreams.reduce((sum, s) => sum + (s.liveStats?.totalViews || 0), 0)}
                </p>
              </div>
              <FaChartLine className="text-blue-500 text-2xl" />
            </div>
          </div>
        </div>

        {/* Live Streams List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">البث</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المادة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المختص</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الجدولة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المشاهدون</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {liveStreams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <FaVideo className="text-4xl mx-auto mb-3 opacity-30" />
                      <p>لا توجد بثوث مباشرة</p>
                      <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 text-purple-600 hover:underline text-sm"
                      >
                        إنشاء أول بث مباشر
                      </button>
                    </td>
                  </tr>
                ) : (
                  liveStreams.map((stream) => (
                    <tr
                      key={stream._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                            <FaBroadcastTower />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {stream.titleAr}
                            </p>
                            <p className="text-xs text-gray-500">
                              {stream.title}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <FaBook className="text-purple-500" />
                          {stream.materialId?.nameAr || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <FaUserTie className="text-blue-500" />
                          {stream.instructor || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {stream.liveSchedule?.scheduledAt ? (
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt className="text-purple-500" />
                            {formatDate(stream.liveSchedule.scheduledAt)}
                          </div>
                        ) : (
                          <span className="text-gray-400">فوري</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(stream.liveStatus)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {stream.liveStatus === 'live' ? (
                          <span className="flex items-center gap-1 font-bold text-red-500">
                            <FaEye /> {stream.liveViewers}
                          </span>
                        ) : (
                          <span>ذروة: {stream.liveStats?.peakViewers || 0}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {stream.liveStatus === 'idle' && (
                            <>
                              <button
                                onClick={() => handleShowCredentials(stream)}
                                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 transition"
                                title="عرض بيانات البث"
                              >
                                <FaKey />
                              </button>
                              <button
                                onClick={() => handleStart(stream._id)}
                                className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 transition"
                                title="بدء البث"
                              >
                                <FaPlay />
                              </button>
                            </>
                          )}

                          {stream.liveStatus === 'live' && (
                            <>
                              <Link
                                to={`/live/${stream._id}`}
                                target="_blank"
                                className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 transition"
                                title="مشاهدة"
                              >
                                <FaEye />
                              </Link>
                              <button
                                onClick={() => handleEnd(stream._id)}
                                className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 transition"
                                title="إنهاء البث"
                              >
                                <FaStop />
                              </button>
                            </>
                          )}

                          {stream.liveStatus === 'ended' && (
                            <span className="text-xs text-gray-500">
                              انتهى ({formatDuration(stream.liveSchedule?.duration)})
                            </span>
                          )}

                          <button
                            onClick={() => handleDelete(stream._id)}
                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 transition"
                            title="حذف"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================
          Modal: إنشاء بث جديد
      ============================================================ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaBroadcastTower className="text-purple-600" />
                بث مباشر جديد
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {/* Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    العنوان (عربي) *
                  </label>
                  <input
                    type="text"
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                    placeholder="مثال: محاضرة الرياضيات"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                    placeholder="Math Lecture"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الوصف
                </label>
                <textarea
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                  placeholder="وصف مختصر للبث"
                />
              </div>

              {/* Instructor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FaUserTie className="inline ml-1" />
                  المختص *
                </label>
                <select
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">اختر المختص...</option>
                  {specialists.map((s) => (
                    <option key={s._id} value={s.profile?.fullName || s.email}>
                      {s.profile?.fullName || s.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* University → College → Specialty → Material */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الجامعة *
                  </label>
                  <select
                    value={formData.universityId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        universityId: e.target.value,
                        collegeId: '',
                        specialtyId: '',
                        materialId: '',
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    required
                  >
                    <option value="">اختر الجامعة...</option>
                    {universities.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.nameAr || u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الكلية *
                  </label>
                  <select
                    value={formData.collegeId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        collegeId: e.target.value,
                        specialtyId: '',
                        materialId: '',
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    disabled={!formData.universityId}
                    required
                  >
                    <option value="">اختر الكلية...</option>
                    {colleges.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.nameAr || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    التخصص *
                  </label>
                  <select
                    value={formData.specialtyId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialtyId: e.target.value,
                        materialId: '',
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    disabled={!formData.collegeId}
                    required
                  >
                    <option value="">اختر التخصص...</option>
                    {specialties.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.nameAr || s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <FaBook className="inline ml-1" />
                    المادة *
                  </label>
                  <select
                    value={formData.materialId}
                    onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    required
                  >
                    <option value="">اختر المادة...</option>
                    {materials
                      .filter((m) => {
                        if (!formData.specialtyId) return true;
                        const specId = typeof m.specialtyId === 'object'
                          ? m.specialtyId?._id
                          : m.specialtyId;
                        return specId === formData.specialtyId;
                      })
                      .map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.nameAr || m.name} ({m.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <FaCalendarAlt className="inline ml-1" />
                    موعد البث (اختياري)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    اتركه فارغاً للبث الفوري
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    نوع الوصول
                  </label>
                  <select
                    value={formData.accessType}
                    onChange={(e) => setFormData({ ...formData, accessType: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  >
                    <option value="subscription">🔒 للمشتركين فقط</option>
                    <option value="public">🌍 عام للجميع</option>
                    <option value="private">🔐 خاص (مصرح فقط)</option>
                  </select>
                </div>
              </div>

              {/* Recording */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <input
                  type="checkbox"
                  id="recording"
                  checked={formData.recording}
                  onChange={(e) => setFormData({ ...formData, recording: e.target.checked })}
                  className="w-5 h-5 text-purple-600"
                />
                <label htmlFor="recording" className="text-sm text-gray-700 dark:text-gray-300">
                  💾 تسجيل البث تلقائياً (يُحفظ كفيديو بعد الانتهاء)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <FaBroadcastTower />
                      إنشاء البث
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          Modal: RTMP Credentials
      ============================================================ */}
      {showCredentials && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCredentials(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaKey className="text-yellow-500" />
                بيانات البث (RTMP)
              </h2>
              <button
                onClick={() => setShowCredentials(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle className="text-yellow-500 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                      ⚠️ تحذير أمني
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      لا تشارك Stream Key مع أي شخص. استخدمه فقط في OBS/Streamlabs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stream Info */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">البث</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {showCredentials.titleAr}
                </p>
              </div>

              {/* RTMP URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🎥 RTMP URL (Server)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={showCredentials.liveRtmpUrl || ''}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(showCredentials.liveRtmpUrl || '', 'RTMP URL')}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* Stream Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🔑 Stream Key (مفتاح البث)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={showCredentials.liveRtmpKey || 'غير متوفر - استخدم التفاصيل'}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(showCredentials.liveRtmpKey || '', 'Stream Key')}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* Playback URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📺 رابط المشاهدة (HLS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={showCredentials.livePlaybackUrl || ''}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 font-mono text-xs"
                  />
                  <button
                    onClick={() => copyToClipboard(showCredentials.livePlaybackUrl || '', 'Playback URL')}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <p className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
                  📋 خطوات البث في OBS:
                </p>
                <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-2 list-decimal list-inside">
                  <li>افتح OBS → الإعدادات → البث</li>
                  <li>اختر الخدمة: <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">Custom...</span></li>
                  <li>الصق <strong>RTMP URL</strong> في "Server"</li>
                  <li>الصق <strong>Stream Key</strong> في "Stream Key"</li>
                  <li>اضغط "موافق" ثم "بدء البث"</li>
                  <li>ارجع هنا واضغط "بدء البث" لتفعيل المشاهدة</li>
                </ol>
              </div>

              {/* View Link */}
              <Link
                to={`/live/${showCredentials._id}`}
                target="_blank"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition"
              >
                <FaEye className="inline ml-2" />
                فتح صفحة المشاهدة
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLiveStreams;