// frontend/portal-a/src/pages/Dashboard/Addresses.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaSpinner, 
  FaCheckCircle, FaTimesCircle, FaHome, FaBuilding, 
  FaBriefcase, FaSave, FaTimes 
} from 'react-icons/fa';

interface Address {
  _id: string;
  title: string;
  titleAr: string;
  address: string;
  addressAr: string;
  city: string;
  cityAr: string;
  country: string;
  countryAr: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
}

const Addresses: React.FC = () => {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    address: '',
    addressAr: '',
    city: '',
    cityAr: '',
    country: '',
    countryAr: '',
    postalCode: '',
    phone: '',
    isDefault: false,
    type: 'home' as 'home' | 'work' | 'other',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await fetch(`${API_URL}/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAddresses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const url = editingId ? `${API_URL}/addresses/${editingId}` : `${API_URL}/addresses`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAddresses();
        resetForm();
        setShowForm(false);
        setMessage({ type: 'success', text: 'تم حفظ العنوان بنجاح!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'حدث خطأ في حفظ العنوان' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ في حفظ العنوان' });
    } finally {
      setSaving(false);
    }
  };

  const editAddress = (address: Address) => {
    setFormData({
      title: address.title,
      titleAr: address.titleAr,
      address: address.address,
      addressAr: address.addressAr,
      city: address.city,
      cityAr: address.cityAr,
      country: address.country,
      countryAr: address.countryAr,
      postalCode: address.postalCode,
      phone: address.phone,
      isDefault: address.isDefault,
      type: address.type,
    });
    setEditingId(address._id);
    setShowForm(true);
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنوان؟')) return;

    try {
      const response = await fetch(`${API_URL}/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      const data = await response.json();
      if (data.success) {
        await fetchAddresses();
        setMessage({ type: 'success', text: 'تم حذف العنوان بنجاح!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ في حذف العنوان' });
    }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/addresses/${id}/default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      const data = await response.json();
      if (data.success) {
        await fetchAddresses();
        setMessage({ type: 'success', text: 'تم تعيين العنوان كافتراضي!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ في تعيين العنوان' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      titleAr: '',
      address: '',
      addressAr: '',
      city: '',
      cityAr: '',
      country: '',
      countryAr: '',
      postalCode: '',
      phone: '',
      isDefault: false,
      type: 'home',
    });
    setEditingId(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'home': return <FaHome className="text-blue-500" />;
      case 'work': return <FaBriefcase className="text-purple-500" />;
      default: return <FaMapMarkerAlt className="text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'home': return 'منزل';
      case 'work': return 'عمل';
      default: return 'أخرى';
    }
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
          <FaMapMarkerAlt className="text-purple-600" />
          العناوين
        </h3>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
        >
          {showForm ? <FaTimes /> : <FaPlus />}
          {showForm ? 'إلغاء' : 'إضافة عنوان جديد'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* نموذج إضافة/تعديل العنوان */}
      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            {editingId ? 'تعديل العنوان' : 'إضافة عنوان جديد'}
          </h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان (عربي) *</label>
              <input
                type="text"
                value={formData.titleAr}
                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان (إنجليزي)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان التفصيلي (عربي) *</label>
              <textarea
                value={formData.addressAr}
                onChange={(e) => setFormData({ ...formData, addressAr: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان التفصيلي (إنجليزي)</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدينة (عربي) *</label>
              <input
                type="text"
                value={formData.cityAr}
                onChange={(e) => setFormData({ ...formData, cityAr: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدينة (إنجليزي)</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الدولة</label>
              <input
                type="text"
                value={formData.countryAr}
                onChange={(e) => setFormData({ ...formData, countryAr: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                placeholder="السعودية"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الرمز البريدي</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الجوال</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع العنوان</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              >
                <option value="home">منزل</option>
                <option value="work">عمل</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">تعيين كعنوان افتراضي</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* قائمة العناوين */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 border ${
                address.isDefault ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(address.type)}
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {address.titleAr || address.title}
                  </h4>
                  {address.isDefault && (
                    <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs px-2 py-0.5 rounded-full">
                      افتراضي
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{getTypeLabel(address.type)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editAddress(address)}
                    className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
                  >
                    <FaEdit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteAddress(address._id)}
                    className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {address.addressAr || address.address}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {address.cityAr || address.city} - {address.countryAr || address.country}
              </p>
              {!address.isDefault && (
                <button
                  onClick={() => setDefaultAddress(address._id)}
                  className="mt-2 text-xs text-purple-600 hover:text-purple-700 transition"
                >
                  تعيين كافتراضي
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <FaMapMarkerAlt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد عناوين</h4>
          <p className="text-gray-500 dark:text-gray-400">أضف عنوانك الأول لتسهيل عمليات التسليم</p>
        </div>
      )}
    </div>
  );
};

export default Addresses;