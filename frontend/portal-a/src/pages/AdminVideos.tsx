// frontend/portal-a/src/pages/AdminVideos.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaSpinner, FaSearch,
  FaSave, FaTimes, FaVideo,
  FaLock, FaUnlock, FaFileVideo,
  FaCloudUploadAlt, FaTrashAlt
} from 'react-icons/fa';

interface Video {
  _id: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  universityId: {
    _id: string;
    name: string;
    nameAr: string;
  };
  collegeId: {
    _id: string;
    name: string;
    nameAr: string;
  };
  specialtyId: {
    _id: string;
    name: string;
    nameAr: string;
    code: string;
  };
  materialId: {
    _id: string;
    name: string;
    nameAr: string;
    code: string;
  };
  instructor: string;
  videoUrl: string;
  thumbnail: string;
  duration: number;
  isEncrypted: boolean;
  isPublished: boolean;
  slug: string;
  order: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface Material {
  _id: string;
  name: string;
  nameAr: string;
  code: string;
}

const AdminVideos: React.FC = () => {
  const { token } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  
  // حالة رفع الفيديو
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  useEffect(() => {
    fetchVideos();
    fetchMaterials();
  }, []);

  // ===== تحميل الفيديوهات =====
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/explanations/videos`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        }
      });
      const data = await response.json();
      if (data.success) {
        setVideos(data.data || []);
      } else {
        setError(data.message || 'حدث خطأ في تحميل الفيديوهات');
      }
    } catch (err) {
      setError('حدث خطأ في تحميل الفيديوهات');
    } finally {
      setLoading(false);
    }
  };

  // ===== تحميل المواد =====
  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API_URL}/explanations/materials`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        }
      });
      const data = await response.json();
      if (data.success) {
        setMaterials(data.data.filter((m: any) => m.isPublished) || []);
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
    }
  };
// frontend/portal-a/src/pages/AdminVideos.tsx

// ===== رفع ملف =====
const uploadFile = async (file: File): Promise<string> => {
  setUploading(true);
  setUploadProgress(0);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'video');
    formData.append('portalId', PORTAL_ID);

    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'فشل رفع الملف');
    }
    
    console.log('✅ Video uploaded, fileId:', data.data.file._id);
    return data.data.file._id;
  } catch (err: any) {
    console.error('Upload error:', err);
    throw err;
  } finally {
    setUploading(false);
  }
};

// ===== حفظ الفيديو =====
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  setError(null);

  try {
    let fileId = null;

    // ✅ رفع الفيديو إذا كان موجوداً
    if (selectedFile) {
      console.log('📤 Uploading video file:', selectedFile.name);
      fileId = await uploadFile(selectedFile);
      
      // ✅ حفظ معرف الملف كـ videoUrl
      formData.videoUrl = fileId;
    }

    const submitData = { ...formData };
    submitData.portalId = PORTAL_ID;
    
    // ✅ توليد slug
    if (!submitData.slug) {
      submitData.slug = (submitData.titleAr || submitData.title || 'video')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    console.log('📤 Sending video data:', {
      title: submitData.title,
      titleAr: submitData.titleAr,
      videoUrl: submitData.videoUrl,
      materialId: submitData.materialId,
    });

    const url = editingId 
      ? `${API_URL}/explanations/videos/${editingId}`
      : `${API_URL}/explanations/videos`;
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Portal-Id': PORTAL_ID,
      },
      body: JSON.stringify(submitData),
    });

    const data = await response.json();
    
    if (data.success) {
      await fetchVideos();
      resetForm();
      setShowForm(false);
      setEditingId(null);
      alert('✅ تم حفظ الفيديو بنجاح!');
    } else {
      setError(data.message || 'حدث خطأ في حفظ الفيديو');
    }
  } catch (err: any) {
    console.error('Submit error:', err);
    setError(err.message || 'حدث خطأ في حفظ الفيديو');
  } finally {
    setSubmitting(false);
  }
};
  // ===== حذف فيديو =====
  const deleteVideo = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
    try {
      const response = await fetch(`${API_URL}/explanations/videos/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      const data = await response.json();
      if (data.success) await fetchVideos();
    } catch (err) {
      alert('حدث خطأ في حذف الفيديو');
    }
  };

  // ===== تبديل حالة النشر =====
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_URL}/explanations/videos/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });
      const data = await response.json();
      if (data.success) await fetchVideos();
    } catch (err) {
      alert('حدث خطأ في تغيير الحالة');
    }
  };

  // ===== إعادة تعيين النموذج =====
  const resetForm = () => {
    setFormData({});
    setSelectedFile(null);
    setUploadProgress(0);
    setEditingId(null);
    setError(null);
  };

  // ===== تحرير فيديو =====
  const handleEdit = (video: Video) => {
    setFormData(video);
    setEditingId(video._id);
    setShowForm(true);
    setSelectedFile(null);
  };

  // ===== معالجة اختيار الملف =====
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ✅ التحقق من نوع الملف
      if (!file.type.startsWith('video/')) {
        alert('⚠️ يرجى اختيار ملف فيديو صالح');
        return;
      }
      // ✅ التحقق من حجم الملف (حد أقصى 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('⚠️ حجم الفيديو يتجاوز 100MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // ===== تنسيق المدة =====
  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ===== تصفية الفيديوهات =====
  const filteredVideos = videos.filter(v =>
    (v.titleAr || v.title).includes(searchTerm) ||
    v.instructor.includes(searchTerm) ||
    (v.materialId?.nameAr || v.materialId?.name || '').includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaVideo className="text-purple-600" />
              إدارة الفيديوهات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إضافة وتعديل وحذف فيديوهات المواد
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'إلغاء' : 'إضافة فيديو جديد'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-400 mb-6">
            {error}
          </div>
        )}

        {/* ===== نموذج الإضافة ===== */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    العنوان (عربي) *
                  </label>
                  <input
                    type="text"
                    value={formData.titleAr || ''}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    العنوان (إنجليزي)
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    المادة *
                  </label>
                  <select
                    value={formData.materialId || ''}
                    onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  >
                    <option value="">اختر المادة</option>
                    {materials.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.nameAr || m.name} ({m.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    المختص *
                  </label>
                  <input
                    type="text"
                    value={formData.instructor || ''}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    المدة (بالثواني)
                  </label>
                  <input
                    type="number"
                    value={formData.duration || 0}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    min="0"
                  />
                </div>
              </div>

              {/* ===== رفع الفيديو ===== */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*"
                  className="hidden"
                  id="video-upload"
                />
                
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FaFileVideo className="w-8 h-8 text-purple-500" />
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setUploadProgress(0); }}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                    {uploadProgress === 100 && (
                      <p className="text-green-600 text-sm">✅ تم رفع الفيديو بنجاح</p>
                    )}
                  </div>
                ) : (
                  <label htmlFor="video-upload" className="cursor-pointer block">
                    <FaCloudUploadAlt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">اسحب الفيديو هنا أو اضغط للاختيار</p>
                    <p className="text-xs text-gray-400 mt-1">MP4, WebM, OGG - الحد الأقصى 100MB</p>
                    {formData.videoUrl && !selectedFile && (
                      <p className="text-sm text-green-600 mt-2">✅ فيديو موجود حالياً</p>
                    )}
                  </label>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isEncrypted || false}
                    onChange={(e) => setFormData({ ...formData, isEncrypted: e.target.checked })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">مشفر (يتطلب اشتراك)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished !== undefined ? formData.isPublished : true}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">منشور</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting || uploading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {submitting || uploading ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث عن فيديو..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            {filteredVideos.length} فيديو
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">العنوان</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المادة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المختص</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المدة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">النوع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVideos.map((video, index) => (
                  <tr key={video._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {video.titleAr || video.title}
                      </div>
                      <div className="text-xs text-gray-400">{video.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {video.materialId?.nameAr || video.materialId?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{video.instructor}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {formatDuration(video.duration)}
                    </td>
                    <td className="px-4 py-3">
                      {video.isEncrypted ? (
                        <span className="flex items-center gap-1 text-yellow-500 text-sm">
                          <FaLock className="w-3 h-3" /> مشفر
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-500 text-sm">
                          <FaUnlock className="w-3 h-3" /> مفتوح
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        video.isPublished
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {video.isPublished ? 'منشور' : 'غير منشور'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleStatus(video._id, video.isPublished)}
                          className={`p-2 rounded-lg transition ${
                            video.isPublished
                              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                          }`}
                          title={video.isPublished ? 'إخفاء' : 'نشر'}
                        >
                          {video.isPublished ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <button
                          onClick={() => handleEdit(video)}
                          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
                          title="تعديل"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteVideo(video._id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                          title="حذف"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVideos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      لا توجد فيديوهات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminVideos;