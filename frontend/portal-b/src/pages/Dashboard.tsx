// src/pages/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// ✅ استيراد الأيقونات
import {
  FaHome, FaSearch,
  FaPlus, FaDownload, FaUpload,
  FaSpinner, FaExclamationCircle,
  FaArrowUp,
  FaBriefcase,
  FaMoneyBill,
  FaCalendar, FaClock,
  FaSun, FaMoon, FaSignOutAlt,
} from 'react-icons/fa';

// ✅ أيقونة الورقة للملفات
const PaperclipIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

interface Order {
  _id: string;
  title: string;
  description?: string;
  service: string;
  serviceType?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'revision' | 'cancelled';
  budget?: number;
  deliveryDate?: string;
  createdAt: string;
  name?: string;
  email?: string;
  files?: Array<{
    _id?: string;
    fileId?: string;
    filename?: string;
    name?: string;
    storageProvider?: string;
  }>;
  department?: string;
  orderType?: string;
  source?: string;
}

const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in-progress' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [uploading, setUploading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  // ===== تحميل الوضع =====
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // ===== تبديل الوضع =====
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  };

  // ===== جلب الطلبات =====
  const fetchOrders = useCallback(async () => {
    if (!token || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/orders/my?portalId=${user.portalId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': user.portalId,
        }
      });

      if (response.status === 401) {
        console.error('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(`خطأ ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const ordersData = data.data || [];
        setOrders(ordersData);

        const statsData = {
          total: ordersData.length,
          pending: ordersData.filter((o: Order) => o.status === 'pending').length,
          inProgress: ordersData.filter((o: Order) => o.status === 'in-progress').length,
          completed: ordersData.filter((o: Order) => o.status === 'completed').length,
          cancelled: ordersData.filter((o: Order) => o.status === 'cancelled').length,
        };
        setStats(statsData);
      } else {
        setError(data.message || 'حدث خطأ في تحميل الطلبات');
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'حدث خطأ في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, [token, user, logout, API_URL]);

  // ===== تحميل البيانات =====
  useEffect(() => {
    AOS.init({ duration: 600, once: true, offset: 50 });
    fetchOrders();
  }, [fetchOrders]);
// ===== رفع ملفات =====
const handleUploadFiles = async (orderId: string) => {
  if (!token) {
    alert('يرجى تسجيل الدخول أولاً');
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar';

  // ✅ استخدام function عادي بدلاً من arrow function للحصول على this الصحيح
  input.onchange = function (this: HTMLInputElement, event: Event) {
    const files = this.files; // ✅ this هو HTMLInputElement
    if (!files || files.length === 0) return;

    // ✅ التحقق من حجم الملفات
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 50 * 1024 * 1024) {
        alert(`⚠️ الملف "${files[i].name}" حجمه يتجاوز 50 ميجابايت`);
        return;
      }
    }

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    // ✅ استدعاء الـ API
    fetch(`${API_URL}/orders/${orderId}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    })
      .then(async (response) => {
        const data = await response.json();
        if (data.success) {
          alert(`✅ تم رفع ${data.data?.total || files.length} ملف بنجاح!`);
          fetchOrders();
        } else {
          alert(`❌ خطأ: ${data.message || 'غير معروف'}`);
        }
      })
      .catch((error: any) => {
        alert(`❌ حدث خطأ: ${error.message}`);
      })
      .finally(() => {
        setUploading(false);
      });
  };

  input.click();
};
  // ===== تحميل ملف =====
  const downloadFile = async (orderId: string, fileIndex: number) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/files/${fileIndex}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('فشل تحميل الملف');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'ملف';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('❌ حدث خطأ في تحميل الملف');
    }
  };

  // ===== الحصول على حالة الطلب =====
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-500',
      'in-progress': 'bg-blue-500',
      'completed': 'bg-green-500',
      'revision': 'bg-orange-500',
      'cancelled': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'pending': '⏳ قيد الانتظار',
      'in-progress': '⚡ قيد التنفيذ',
      'completed': '✅ مكتمل',
      'revision': '🔄 مراجعة',
      'cancelled': '❌ ملغي',
    };
    return texts[status] || status;
  };

  // ===== الحصول على أيقونة الملف =====
  const getFileIcon = (filename: string) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    const icons: { [key: string]: string } = {
      'pdf': 'fa-file-pdf',
      'doc': 'fa-file-word',
      'docx': 'fa-file-word',
      'xls': 'fa-file-excel',
      'xlsx': 'fa-file-excel',
      'ppt': 'fa-file-powerpoint',
      'pptx': 'fa-file-powerpoint',
      'zip': 'fa-file-archive',
      'rar': 'fa-file-archive',
      'jpg': 'fa-file-image',
      'jpeg': 'fa-file-image',
      'png': 'fa-file-image',
      'gif': 'fa-file-image',
      'txt': 'fa-file-alt',
    };
    return icons[ext] || 'fa-file';
  };

  // ===== تحديد مصدر الطلب =====
  const getSourceLabel = (order: Order) => {
    if (order.orderType === 'academic' || order.department === 'الخدمات الأكاديمية') {
      return '🔬 بحث علمي';
    }
    if (order.orderType === 'health' || order.department === 'الخدمات الصحية') {
      return '🏥 صحي';
    }
    if (order.orderType === 'business' || order.department === 'إدارة الأعمال والاقتصاد') {
      return '💼 أعمال';
    }
    return '📋 عام';
  };

  // ===== تصفية الطلبات =====
  const getFilteredOrders = () => {
    let filtered = orders;

    if (activeTab !== 'all') {
      filtered = filtered.filter(o => o.status === activeTab);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.title?.toLowerCase().includes(term) ||
        o.service?.toLowerCase().includes(term) ||
        o.description?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // ===== عرض حالة التحميل =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل طلباتك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-white text-xl shadow-lg shadow-purple-500/30">
                {user?.fullName?.charAt(0) || 'م'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  مرحباً {user?.fullName || 'مستخدم'} 👋
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  لوحة تحكم العميل
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                {isDark ? <FaSun className="w-5 h-5 text-yellow-500" /> : <FaMoon className="w-5 h-5 text-gray-700" />}
              </button>
              <Link to="/" className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-600 hover:text-white transition-colors text-sm font-semibold">
                <FaHome className="w-4 h-4 inline ml-1" /> الرئيسية
              </Link>
              <Link to="/services" className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all text-sm font-semibold">
                <FaPlus className="w-4 h-4 inline ml-1" /> طلب جديد
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-semibold"
              >
                <FaSignOutAlt className="w-4 h-4 inline ml-1" /> خروج
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container-custom py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">📊 إجمالي الطلبات</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">⏳ قيد الانتظار</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">⚡ قيد التنفيذ</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">✅ مكتملة</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-500">{stats.cancelled}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">❌ ملغية</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'all'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                  }`}
              >
                الكل ({stats.total})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'pending'
                    ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                  }`}
              >
                ⏳ قيد الانتظار ({stats.pending})
              </button>
              <button
                onClick={() => setActiveTab('in-progress')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'in-progress'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }`}
              >
                ⚡ قيد التنفيذ ({stats.inProgress})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'completed'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                  }`}
              >
                ✅ مكتملة ({stats.completed})
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'cancelled'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30'
                  }`}
              >
                ❌ ملغية ({stats.cancelled})
              </button>
            </div>

            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FaSearch className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث عن طلب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-400 mb-6">
            <FaExclamationCircle className="inline ml-2 w-5 h-5" />
            {error}
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4 opacity-30">📭</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد طلبات</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ? 'لا توجد طلبات تطابق بحثك' : 'قم بطلب خدمة جديدة من صفحة الخدمات'}
            </p>
            <Link
              to="/services"
              className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              <FaPlus className="inline ml-2 w-4 h-4" /> طلب خدمة جديدة
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <div
                key={order._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                data-aos="fade-up"
                data-aos-delay={Math.min(index * 50, 300)}
              >
                {/* Order Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        {order.title || 'طلب بدون عنوان'}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-500 dark:text-gray-400">
                        {getSourceLabel(order)}
                      </span>
                    </div>
                    {order.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {order.description.length > 100 ? order.description.substring(0, 100) + '...' : order.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleUploadFiles(order._id)}
                      disabled={uploading}
                      className="px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-semibold flex items-center gap-1"
                    >
                      <FaUpload className="w-4 h-4" /> رفع ملفات
                    </button>
                  </div>
                </div>

                {/* Order Details */}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <span><FaBriefcase className="inline ml-1 w-4 h-4" /> {order.service || order.serviceType || 'خدمة'}</span>
                  {order.budget && (
                    <span><FaMoneyBill className="inline ml-1 w-4 h-4" /> {order.budget} ريال</span>
                  )}
                  {order.deliveryDate && (
                    <span><FaCalendar className="inline ml-1 w-4 h-4" /> التسليم: {new Date(order.deliveryDate).toLocaleDateString('ar-SA')}</span>
                  )}
                  <span><FaClock className="inline ml-1 w-4 h-4" /> {new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>

                {/* Files */}
                {order.files && order.files.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <PaperclipIcon className="w-4 h-4" />
                      <span className="font-semibold">الملفات المرفقة ({order.files.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.files.map((file, idx) => (
                        <button
                          key={idx}
                          onClick={() => downloadFile(order._id, idx)}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm"
                        >
                          <i className={`fas ${getFileIcon(file.filename || file.name || '')}`} />
                          <span>{file.filename || file.name || 'ملف'}</span>
                          <FaDownload className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 left-6 p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-1"
      >
        <FaArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Dashboard;