// frontend/portal-a/src/pages/AdminUsers.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaUsers, FaSearch, FaSpinner, FaUserCheck, FaUserTimes,
  FaEdit, FaUserPlus, FaCheckCircle, FaTimesCircle,
  FaSave, FaTimes, FaEye, FaTrash, FaFilter,
  FaChevronLeft, FaChevronRight, FaUserCog,
  FaShieldAlt, FaUserGraduate, FaUserTie,
  FaEnvelope, FaPhone, FaCalendarAlt, FaUser, // ✅ إضافة FaUser
} from 'react-icons/fa';

// ============================================================
// ✅ واجهات البيانات
// ============================================================

interface User {
  _id: string;
  email: string;
  username: string;
  fullName: string;
  profile: {
    fullName: string;
    avatar?: string;
    bio?: string;
  };
  phone: string;
  role: 'customer' | 'specialist' | 'portal_admin' | 'super_admin';
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  customers: number;
  specialists: number;
  admins: number;
}

// ============================================================
// ✅ المكون الرئيسي
// ============================================================

const AdminUsers: React.FC = () => {
  const { token } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    role: 'customer',
    isActive: true,
    isVerified: true,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  // ===== جلب المستخدمين =====
  const fetchUsers = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let url = `${API_URL}/admin/users?page=${pagination.page}&limit=${pagination.limit}`;
      if (roleFilter) url += `&role=${roleFilter}`;
      if (statusFilter) url += `&isActive=${statusFilter === 'active'}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages,
        }));
      } else {
        setError(data.message || 'حدث خطأ في تحميل المستخدمين');
      }
    } catch (err) {
      setError('حدث خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.limit, roleFilter, statusFilter, searchTerm]);

  // ===== جلب الإحصائيات =====
  const fetchStats = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/admin/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [token]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    Promise.all([fetchUsers(), fetchStats()]);
  }, [fetchUsers, fetchStats]);

  // ===== إنشاء مستخدم جديد =====
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        await fetchUsers();
        await fetchStats();
        resetForm();
        setShowFormModal(false);
        alert('✅ تم إنشاء المستخدم بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في إنشاء المستخدم');
      }
    } catch (error) {
      alert('حدث خطأ في إنشاء المستخدم');
    } finally {
      setLoading(false);
    }
  };

  // ===== تحديث مستخدم =====
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        await fetchUsers();
        await fetchStats();
        resetForm();
        setShowFormModal(false);
        setEditingUser(null);
        alert('✅ تم تحديث المستخدم بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في تحديث المستخدم');
      }
    } catch (error) {
      alert('حدث خطأ في تحديث المستخدم');
    } finally {
      setLoading(false);
    }
  };

  // ===== تبديل حالة المستخدم =====
  const handleToggleStatus = async (userId: string) => {
    if (!confirm('هل أنت متأكد من تغيير حالة هذا المستخدم؟')) return;

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        await fetchUsers();
        await fetchStats();
        alert('✅ تم تغيير حالة المستخدم بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في تغيير حالة المستخدم');
      }
    } catch (error) {
      alert('حدث خطأ في تغيير حالة المستخدم');
    }
  };

  // ===== حذف مستخدم =====
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        await fetchUsers();
        await fetchStats();
        alert('✅ تم حذف المستخدم بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في حذف المستخدم');
      }
    } catch (error) {
      alert('حدث خطأ في حذف المستخدم');
    }
  };

  // ===== فتح نموذج التعديل =====
  const openEditForm = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || user.profile?.fullName || '',
      email: user.email || '',
      username: user.username || '',
      phone: user.phone || '',
      password: '',
      role: user.role || 'customer',
      isActive: user.isActive !== undefined ? user.isActive : true,
      isVerified: user.isVerified !== undefined ? user.isVerified : true,
    });
    setShowFormModal(true);
  };

  // ===== فتح نموذج الإضافة =====
  const openCreateForm = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      username: '',
      phone: '',
      password: '',
      role: 'customer',
      isActive: true,
      isVerified: true,
    });
    setShowFormModal(true);
  };

  // ===== إعادة تعيين النموذج =====
  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      username: '',
      phone: '',
      password: '',
      role: 'customer',
      isActive: true,
      isVerified: true,
    });
    setEditingUser(null);
  };

  // ===== الحصول على شارة الدور =====
  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      'customer': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'specialist': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'portal_admin': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'super_admin': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    const labels: Record<string, string> = {
      'customer': 'عميل',
      'specialist': 'مختص',
      'portal_admin': 'مدير البوابة',
      'super_admin': 'مشرف عام',
    };
    const icons: Record<string, React.ReactNode> = {
      'customer': <FaUser className="w-3 h-3" />,
      'specialist': <FaUserGraduate className="w-3 h-3" />,
      'portal_admin': <FaUserTie className="w-3 h-3" />,
      'super_admin': <FaShieldAlt className="w-3 h-3" />,
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${colors[role] || colors.customer}`}>
        {icons[role] || icons.customer}
        {labels[role] || role}
      </span>
    );
  };

  // ===== الحصول على شارة الحالة =====
  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
        isActive
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}>
        {isActive ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
        {isActive ? 'نشط' : 'غير نشط'}
      </span>
    );
  };

  // ===== تنسيق التاريخ =====
  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom max-w-7xl">
        {/* ===== Header ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaUsers className="text-purple-600" />
              إدارة المستخدمين
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              عرض وإدارة المستخدمين المسجلين في المنصة
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
          >
            <FaUserPlus /> إضافة مستخدم
          </button>
        </div>

        {/* ===== الإحصائيات ===== */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard label="إجمالي" value={stats.total} color="gray" />
            <StatCard label="نشط" value={stats.active} color="green" />
            <StatCard label="غير نشط" value={stats.inactive} color="red" />
            <StatCard label="عملاء" value={stats.customers} color="blue" />
            <StatCard label="مختصين" value={stats.specialists} color="purple" />
            <StatCard label="مديرين" value={stats.admins} color="yellow" />
          </div>
        )}

        {/* ===== Search & Filter ===== */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث عن مستخدم (الاسم، البريد الإلكتروني، اسم المستخدم)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            >
              <option value="">جميع الأدوار</option>
              <option value="customer">عميل</option>
              <option value="specialist">مختص</option>
              <option value="portal_admin">مدير البوابة</option>
              <option value="super_admin">مشرف عام</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            >
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
            <button className="px-4 py-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">
              <FaFilter />
            </button>
          </div>
        </div>

        {/* ===== جدول المستخدمين ===== */}
        {users.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المستخدم</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">البريد الإلكتروني</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">رقم الجوال</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الدور</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">تاريخ التسجيل</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user, index) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                        {((pagination.page - 1) * pagination.limit) + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                            {(user.fullName || user.profile?.fullName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.fullName || user.profile?.fullName || 'مستخدم'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              @{user.username || user.email?.split('@')[0]}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <FaEnvelope className="w-3 h-3 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {user.phone || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(user.isActive)}
                          {user.isVerified && (
                            <span className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
                              <FaCheckCircle className="w-3 h-3" /> موثق
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
                            title="عرض التفاصيل"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditForm(user)}
                            className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 transition"
                            title="تعديل"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user._id)}
                            className={`p-2 rounded-lg transition ${
                              user.isActive
                                ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                            }`}
                            title={user.isActive ? 'تعطيل' : 'تفعيل'}
                          >
                            {user.isActive ? <FaUserTimes className="w-4 h-4" /> : <FaUserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                            title="حذف"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <FaUsers className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد مستخدمين</h4>
            <p className="text-gray-500 dark:text-gray-400">لم يتم تسجيل أي مستخدم في هذه البوابة بعد</p>
            <button
              onClick={openCreateForm}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <FaUserPlus className="inline ml-1" /> إضافة مستخدم
            </button>
          </div>
        )}

        {/* ===== Pagination ===== */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between gap-4 mt-6">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
            >
              <FaChevronRight />
            </button>
            <span className="text-sm text-gray-500">
              صفحة {pagination.page} من {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
            >
              <FaChevronLeft />
            </button>
          </div>
        )}
      </div>

      {/* ===== مودال إضافة/تعديل مستخدم ===== */}
      {showFormModal && (
        <UserFormModal
          isEditing={!!editingUser}
          formData={formData}
          setFormData={setFormData}
          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
          onClose={() => {
            setShowFormModal(false);
            resetForm();
          }}
          loading={loading}
        />
      )}

      {/* ===== مودال تفاصيل المستخدم ===== */}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// ✅ مكون بطاقة الإحصائيات
// ============================================================

interface StatCardProps {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    gray: 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className={`${colors[color]} rounded-xl p-4 border text-center`}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};

// ============================================================
// ✅ مودال إضافة/تعديل مستخدم
// ============================================================

interface UserFormModalProps {
  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  loading: boolean;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isEditing,
  formData,
  setFormData,
  onSubmit,
  onClose,
  loading,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                الاسم الكامل *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                البريد الإلكتروني *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                required
                disabled={isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                اسم المستخدم
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                رقم الجوال
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                كلمة المرور {!isEditing && '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                required={!isEditing}
                minLength={6}
                placeholder={isEditing ? 'اتركه فارغاً إذا لم ترد التغيير' : ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                الدور
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              >
                <option value="customer">عميل</option>
                <option value="specialist">مختص</option>
                <option value="portal_admin">مدير البوابة</option>
                <option value="super_admin">مشرف عام</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">حساب نشط</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isVerified}
                onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">حساب موثق</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {loading ? 'جاري الحفظ...' : isEditing ? 'تحديث' : 'إضافة'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// ✅ مودال تفاصيل المستخدم
// ============================================================

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            <FaUser className="inline ml-2 text-purple-600" />
            تفاصيل المستخدم
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(user.fullName || user.profile?.fullName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {user.fullName || user.profile?.fullName || 'مستخدم'}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username || user.email?.split('@')[0]}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">البريد الإلكتروني</p>
              <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">رقم الجوال</p>
              <p className="font-medium text-gray-900 dark:text-white">{user.phone || '-'}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">الدور</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.role === 'customer' ? 'عميل' :
                 user.role === 'specialist' ? 'مختص' :
                 user.role === 'portal_admin' ? 'مدير البوابة' : 'مشرف عام'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">الحالة</p>
              <p className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {user.isActive ? 'نشط' : 'غير نشط'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ التسجيل</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(user.createdAt).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {user.lastLogin && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">آخر تسجيل دخول</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(user.lastLogin).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;