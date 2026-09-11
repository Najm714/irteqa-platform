// frontend/portal-a/src/pages/Specialist/SpecialistProfile.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaSpinner, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe, FaSave, FaCamera, FaUserCircle, FaTrash } from 'react-icons/fa';

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  website: string;
  avatar?: string;
}

const SpecialistProfile: React.FC = () => {
  const { token, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<ProfileData>({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.profile?.bio || '',
    location: user?.profile?.location || '',
    website: user?.profile?.website || '',
    avatar: user?.profile?.avatar || '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });
        const data = await response.json();
        if (data.success) {
          setProfile({
            fullName: data.data.fullName || '',
            email: data.data.email || '',
            phone: data.data.phone || '',
            bio: data.data.profile?.bio || '',
            location: data.data.profile?.location || '',
            website: data.data.profile?.website || '',
            avatar: data.data.profile?.avatar || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  // ✅ ✅ دالة حفظ الملف الشخصي - المفقودة
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '✅ تم تحديث الملف الشخصي بنجاح!' });
        // تحديث بيانات المستخدم في localStorage
        const updatedUser = { ...user, ...data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'حدث خطأ في التحديث' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'حدث خطأ في حفظ الملف الشخصي' });
    } finally {
      setSaving(false);
    }
  };

  // ✅ دالة رفع الصورة الشخصية
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: '⚠️ حجم الصورة يجب أن لا يتجاوز 5 ميجابايت' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '⚠️ يرجى اختيار ملف صورة فقط' });
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'profile');
      formData.append('portalId', PORTAL_ID);

      const uploadResponse = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        throw new Error(uploadData.message || 'فشل رفع الصورة');
      }

      const fileId = uploadData.data.file._id;

      const profileResponse = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({
          ...profile,
          avatar: fileId,
        }),
      });

      const profileData = await profileResponse.json();
      
      if (profileData.success) {
        setProfile(prev => ({ ...prev, avatar: fileId }));
        setMessage({ type: 'success', text: '✅ تم تحديث الصورة الشخصية بنجاح!' });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error(profileData.message || 'فشل تحديث الملف الشخصي');
      }
    } catch (error: any) {
      console.error('❌ Error uploading avatar:', error);
      setMessage({ type: 'error', text: error.message || 'حدث خطأ في رفع الصورة' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ✅ دالة حذف الصورة الشخصية
  const handleRemoveAvatar = async () => {
    if (!confirm('هل أنت متأكد من حذف الصورة الشخصية؟')) return;

    try {
      setUploadingAvatar(true);
      
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({
          ...profile,
          avatar: null,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setProfile(prev => ({ ...prev, avatar: undefined }));
        setMessage({ type: 'success', text: '✅ تم حذف الصورة الشخصية' });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error(data.message || 'فشل حذف الصورة');
      }
    } catch (error: any) {
      console.error('❌ Error removing avatar:', error);
      setMessage({ type: 'error', text: error.message || 'حدث خطأ في حذف الصورة' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ✅ دالة الحصول على رابط الصورة
  const getAvatarUrl = (avatarId: string | undefined) => {
    if (!avatarId) return null;
    return `${API_URL}/files/public/${avatarId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">👤 الملف الشخصي</h3>

      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ✅ الصورة الشخصية */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center overflow-hidden border-4 border-purple-200 dark:border-purple-800">
              {uploadingAvatar ? (
                <FaSpinner className="w-10 h-10 text-purple-600 animate-spin" />
              ) : profile.avatar ? (
                <img 
                  src={getAvatarUrl(profile.avatar) || ''} 
                  alt="الصورة الشخصية" 
                  className="w-full h-full object-cover"
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <FaUserCircle className="text-purple-600 dark:text-purple-400 text-6xl" />
              )}
            </div>
            
            <div className="absolute bottom-0 right-0 flex gap-1">
              <label className="p-2 bg-purple-600 text-white rounded-full cursor-pointer hover:bg-purple-700 transition shadow-lg">
                <FaCamera className="w-4 h-4" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
              {profile.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
                  disabled={uploadingAvatar}
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {uploadingAvatar ? 'جاري رفع الصورة...' : 'اضغط على الكاميرا لتغيير الصورة'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FaUser className="inline ml-1" /> الاسم الكامل *
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FaEnvelope className="inline ml-1" /> البريد الإلكتروني
            </label>
            <input
              type="email"
              value={profile.email}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FaPhone className="inline ml-1" /> رقم الجوال
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FaMapMarkerAlt className="inline ml-1" /> الموقع
            </label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نبذة عني</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            placeholder="اكتب نبذة عن نفسك..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <FaGlobe className="inline ml-1" /> الموقع الإلكتروني
          </label>
          <input
            type="url"
            value={profile.website}
            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            placeholder="https://example.com"
          />
        </div>

        <button
          type="submit"
          disabled={saving || uploadingAvatar}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </form>
    </div>
  );
};

export default SpecialistProfile;