// frontend/portal-a/src/pages/AdminSubscriptions.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FaCoins, FaSearch, FaSpinner,
  FaCheckCircle, FaTimesCircle,
  FaEye,
  FaFilter, FaFilePdf, FaFileImage,
  FaDownload,
  FaFileAlt, FaInfoCircle, FaSync,
  FaTimes, FaUser, FaBook, FaMoneyBill,
  FaBuilding, FaIdCard, FaClock,
  FaExclamationTriangle, FaShieldAlt
} from 'react-icons/fa';

// ============================================================
// واجهات البيانات
// ============================================================

interface Account {
  _id: string;
  profile: { fullName: string };
  email: string;
}

interface Material {
  _id: string;
  name: string;
  nameAr: string;
  code: string;
  price: number;
}

interface PaymentProof {
  _id: string;
  originalName: string;
  size: number;
  mimeType: string;
  url?: string;
}

interface Payment {
  _id: string;
  paymentId: string;
  portalId: string;
  accountId: Account;
  subscriptionId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  reference: string;
  proof?: PaymentProof;
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'refunded';
  verifiedBy?: Account;
  verifiedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  _id: string;
  accountId: Account;
  materialId: Material;
  price: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  description?: string;
  descriptionAr?: string;
  benefits: string[];
  benefitsAr: string[];
  portalId: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// المكون الرئيسي
// ============================================================

const AdminSubscriptions: React.FC = () => {
  const { token, user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  
  // مودال عرض تفاصيل الاشتراك
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // مودال عرض إثبات الدفع
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{ url: string; name: string; type: string; size: number } | null>(null);
  
  // مودال رفض الدفع
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingSubscriptionId, setRejectingSubscriptionId] = useState<string | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);

  // حالة المعالجة
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  // ===== تحميل الاشتراكات =====
  const fetchSubscriptions = useCallback(async () => {
    if (!token) return;
    try {
      console.log('📤 Fetching subscriptions...');
      const response = await fetch(`${API_URL}/explanations/subscriptions`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        }
      });
      const data = await response.json();
      console.log('📥 Subscriptions response:', data);
      if (data.success) {
        const sorted = (data.data || []).sort((a: Subscription, b: Subscription) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSubscriptions(sorted);
        console.log('✅ Subscriptions loaded:', sorted.length);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    }
  }, [token, API_URL, PORTAL_ID]);

  // ===== تحميل المدفوعات =====
  const fetchPayments = useCallback(async () => {
    if (!token) return;
    try {
      console.log('📤 Fetching payments...');
      const response = await fetch(`${API_URL}/payments`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        }
      });
      const data = await response.json();
      console.log('📥 Payments response:', data);
      if (data.success) {
        const sorted = (data.data || []).sort((a: Payment, b: Payment) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPayments(sorted);
        console.log('✅ Payments loaded:', sorted.length);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  }, [token, API_URL, PORTAL_ID]);

  // ===== تحميل جميع البيانات =====
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSubscriptions(), fetchPayments()]);
      setLoading(false);
    };
    loadData();
  }, [fetchSubscriptions, fetchPayments]);

  // ===== تحديث البيانات =====
  const refreshData = async () => {
    setRefreshing(true);
    setActionMessage(null);
    await Promise.all([fetchSubscriptions(), fetchPayments()]);
    setRefreshing(false);
  };

  // ===== الحصول على أيقونة الملف =====
  const getFileIcon = (mimeType?: string, filename?: string) => {
    if (!mimeType && !filename) return <FaFileAlt className="text-gray-500" />;
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <FaFileImage className="text-purple-500" />;
    }
    if (mimeType === 'application/pdf' || ext === 'pdf') {
      return <FaFilePdf className="text-red-500" />;
    }
    return <FaFileAlt className="text-gray-500" />;
  };

  // ===== عرض إثبات الدفع =====
  const viewProof = async (proof: PaymentProof) => {
    if (!proof) return;
    try {
      const response = await fetch(`${API_URL}/files/${proof._id}/download-direct`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل تحميل الملف');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setSelectedProof({
        url,
        name: proof.originalName || 'إثبات الدفع',
        type: proof.mimeType || '',
        size: proof.size || 0,
      });
      setShowProofModal(true);
    } catch (err) {
      console.error('Error viewing proof:', err);
      alert('حدث خطأ في عرض إثبات الدفع');
    }
  };

  // ===== الحصول على الدفع المرتبط بالاشتراك =====
  const getPaymentForSubscription = (subscriptionId: string): Payment | undefined => {
    return payments.find(p => p.subscriptionId === subscriptionId);
  };

  // ===== عرض تفاصيل الاشتراك =====
  const viewSubscriptionDetail = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowDetailModal(true);
  };

  // ===== ✅ الموافقة على الاشتراك (مُحسَّن) =====
  const handleVerifySubscription = async (subscriptionId: string, paymentId?: string) => {
    if (!paymentId) {
      setActionMessage({ type: 'error', message: 'لا يوجد سجل دفع لهذا الاشتراك' });
      return;
    }
    
    if (!confirm('✅ هل أنت متأكد من الموافقة على هذا الاشتراك؟\nسيتم تفعيل الاشتراك فوراً.') ) return;
    
    setProcessing(true);
    setActionMessage(null);
    
    try {
      // 1. تحديث حالة الدفع إلى verified
      const verifyResponse = await fetch(`${API_URL}/payments/${paymentId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ 
          status: 'verified',
          verifiedBy: user?.id,
        }),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyData.success) {
        throw new Error(verifyData.message || 'فشل تحديث حالة الدفع');
      }
      
      // 2. تحديث الاشتراك إلى active
      const subResponse = await fetch(`${API_URL}/explanations/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ 
          status: 'active',
          paymentStatus: 'paid',
        }),
      });
      const subData = await subResponse.json();
      if (!subData.success) {
        throw new Error(subData.message || 'فشل تحديث الاشتراك');
      }
      
      await refreshData();
      setActionMessage({ type: 'success', message: '✅ تم الموافقة على الاشتراك وتفعيله بنجاح!' });
      
    } catch (err: any) {
      console.error('❌ Verify error:', err);
      setActionMessage({ type: 'error', message: err.message || 'حدث خطأ في الموافقة على الاشتراك' });
    } finally {
      setProcessing(false);
    }
  };

  // ===== ✅ رفض الاشتراك (مُحسَّن) =====
  const handleRejectSubscription = async () => {
    if (!rejectingSubscriptionId || !rejectingPaymentId) return;
    if (!rejectionReason.trim()) {
      setActionMessage({ type: 'error', message: 'يرجى إدخال سبب الرفض' });
      return;
    }
    
    if (!confirm('❌ هل أنت متأكد من رفض هذا الاشتراك؟')) return;
    
    setProcessing(true);
    setActionMessage(null);
    
    try {
      // 1. تحديث حالة الدفع إلى rejected
      const rejectResponse = await fetch(`${API_URL}/payments/${rejectingPaymentId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ 
          status: 'rejected',
          rejectionReason: rejectionReason.trim(),
          verifiedBy: user?.id,
        }),
      });
      const rejectData = await rejectResponse.json();
      if (!rejectData.success) {
        throw new Error(rejectData.message || 'فشل تحديث حالة الدفع');
      }
      
      // 2. تحديث الاشتراك إلى cancelled
      const subResponse = await fetch(`${API_URL}/explanations/subscriptions/${rejectingSubscriptionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ 
          status: 'cancelled',
          paymentStatus: 'failed',
        }),
      });
      const subData = await subResponse.json();
      if (!subData.success) {
        throw new Error(subData.message || 'فشل تحديث الاشتراك');
      }
      
      await refreshData();
      setShowRejectionModal(false);
      setRejectingSubscriptionId(null);
      setRejectingPaymentId(null);
      setRejectionReason('');
      setActionMessage({ type: 'success', message: '❌ تم رفض الاشتراك بنجاح' });
      
    } catch (err: any) {
      console.error('❌ Reject error:', err);
      setActionMessage({ type: 'error', message: err.message || 'حدث خطأ في رفض الاشتراك' });
    } finally {
      setProcessing(false);
    }
  };

  // ===== الحصول على حالة الاشتراك =====
  const getSubscriptionStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: '⏳ قيد الانتظار', icon: <FaClock className="w-3 h-3" /> },
      'active': { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: '✅ نشط', icon: <FaCheckCircle className="w-3 h-3" /> },
      'expired': { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: '❌ منتهي', icon: <FaTimesCircle className="w-3 h-3" /> },
      'cancelled': { color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400', label: '🚫 ملغي', icon: <FaTimesCircle className="w-3 h-3" /> },
    };
    const { color, label, icon } = config[status] || config.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${color}`}>{icon} {label}</span>;
  };

  // ===== الحصول على حالة الدفع =====
  const getPaymentStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400', label: '⏳ قيد الانتظار' },
      'submitted': { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: '📤 تم الإرسال' },
      'verified': { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: '✅ تم الموافقة' },
      'rejected': { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: '❌ مرفوض' },
      'refunded': { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: '🔄 مسترجع' },
    };
    const { color, label } = config[status] || config.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{label}</span>;
  };

  // ===== تنسيق التاريخ =====
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ===== تصفية الاشتراكات =====
  const filteredSubscriptions = subscriptions.filter(s => {
    const matchesSearch = 
      s.accountId?.profile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.accountId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.materialId?.nameAr || s.materialId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.materialId?.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ===== إحصائيات الاشتراكات =====
  const subscriptionStats = {
    total: subscriptions.length,
    pending: subscriptions.filter(s => s.status === 'pending').length,
    active: subscriptions.filter(s => s.status === 'active').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
    totalAmount: subscriptions.reduce((sum, s) => sum + (s.status === 'active' ? s.price : 0), 0),
  };

  // ===== مودال عرض إثبات الدفع =====
  const renderProofModal = () => {
    if (!showProofModal || !selectedProof) return null;
    const isImage = selectedProof.type?.startsWith('image/');
    const isPdf = selectedProof.type === 'application/pdf';
    const fileSize = selectedProof.size > 0 ? (selectedProof.size / 1024 / 1024).toFixed(2) : '0';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => { if (selectedProof.url.startsWith('blob:')) URL.revokeObjectURL(selectedProof.url); setShowProofModal(false); }}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {getFileIcon(selectedProof.type, selectedProof.name)}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-md">{selectedProof.name}</h3>
              <span className="text-xs text-gray-400">({fileSize} MB)</span>
            </div>
            <div className="flex items-center gap-2">
              <a href={selectedProof.url} download={selectedProof.name} className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 transition" title="تحميل الملف"><FaDownload /></a>
              <button onClick={() => { if (selectedProof.url.startsWith('blob:')) URL.revokeObjectURL(selectedProof.url); setShowProofModal(false); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"><FaTimes className="w-5 h-5 text-gray-500" /></button>
            </div>
          </div>
          <div className="p-4 overflow-auto max-h-[calc(90vh-80px)] flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
            {isImage ? <img src={selectedProof.url} alt={selectedProof.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            : isPdf ? <iframe src={selectedProof.url} className="w-full h-[70vh] rounded-lg" title={selectedProof.name} />
            : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{getFileIcon(selectedProof.type, selectedProof.name)}</div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">لا يمكن معاينة هذا الملف</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{selectedProof.name} ({fileSize} MB)</p>
                <a href={selectedProof.url} download={selectedProof.name} className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"><FaDownload className="inline ml-2" /> تحميل الملف</a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ===== مودال تفاصيل الاشتراك =====
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedSubscription) return null;
    const sub = selectedSubscription;
    const payment = getPaymentForSubscription(sub._id);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><FaCoins className="text-purple-600" /> تفاصيل الاشتراك</h3>
            <button onClick={() => setShowDetailModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"><FaTimes className="w-5 h-5 text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-6">
            {/* معلومات المادة والمستخدم */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><FaBook className="w-3 h-3" /> المادة</p>
                <p className="font-bold text-gray-900 dark:text-white">{sub.materialId?.nameAr || sub.materialId?.name || '-'}</p>
                <p className="text-xs text-gray-400">{sub.materialId?.code || ''}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><FaMoneyBill className="w-3 h-3" /> السعر</p>
                <p className="text-lg font-bold text-purple-600">{sub.price} {sub.currency}</p>
              </div>
            </div>
            
            {/* معلومات المستخدم */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><FaUser className="w-3 h-3" /> المستخدم</p>
              <p className="font-bold text-gray-900 dark:text-white">{sub.accountId?.profile?.fullName || 'مستخدم'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{sub.accountId?.email || ''}</p>
            </div>
            
            {/* طريقة الدفع */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">طريقة الدفع</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {sub.paymentMethod === 'credit_card' ? '💳 بطاقة ائتمان' :
                 sub.paymentMethod === 'mada' ? '💳 مدى' :
                 sub.paymentMethod === 'paypal' ? '💳 بايبال' :
                 sub.paymentMethod === 'bank_transfer' ? '🏦 تحويل بنكي' :
                 sub.paymentMethod === 'free' ? '🎁 مجاني' : '📝 يدوي'}
              </p>
            </div>
            
            {/* حالة الاشتراك */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">حالة الاشتراك</p>
              <div className="mt-1">{getSubscriptionStatusBadge(sub.status)}</div>
            </div>
            
            {/* حالة الدفع */}
            {payment && (
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">حالة الدفع</p>
                <div className="mt-1">{getPaymentStatusBadge(payment.status)}</div>
              </div>
            )}
            
            {/* معلومات الحساب البنكي */}
            {payment?.accountNumber && (
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><FaBuilding className="w-3 h-3" /> معلومات الحساب البنكي</p>
                <div className="mt-1 space-y-1">
                  <p className="text-sm font-mono text-gray-900 dark:text-white flex items-center gap-1"><FaIdCard className="w-3 h-3" /> رقم الحساب: {payment.accountNumber}</p>
                  {payment.accountName && <p className="text-sm text-gray-700 dark:text-gray-300">اسم صاحب الحساب: {payment.accountName}</p>}
                  {payment.bankName && <p className="text-sm text-gray-700 dark:text-gray-300">البنك: {payment.bankName}</p>}
                </div>
              </div>
            )}
            
            {/* إثبات الدفع */}
            {payment?.proof && (
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">إثبات الدفع</p>
                <button onClick={() => viewProof(payment.proof!)} className="mt-1 flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition">
                  {getFileIcon(payment.proof?.mimeType, payment.proof?.originalName)}
                  <span>{payment.proof?.originalName}</span>
                  <FaEye className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* المدة */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><FaClock className="w-3 h-3" /> المدة</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">من {formatDate(sub.startDate)} إلى {formatDate(sub.endDate)}</p>
            </div>
            
            {/* الملاحظات */}
            {payment?.notes && (
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">ملاحظات</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{payment.notes}</p>
              </div>
            )}
            
            {/* سبب الرفض */}
            {payment?.rejectionReason && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1"><FaExclamationTriangle className="w-3 h-3" /> سبب الرفض</p>
                <p className="text-sm text-red-700 dark:text-red-300">{payment.rejectionReason}</p>
              </div>
            )}
            
            {/* تاريخ الإنشاء */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ الإنشاء</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(sub.createdAt)}</p>
            </div>
            
            {/* أزرار الموافقة والرفض */}
            {sub.status === 'pending' && payment && (payment.status === 'pending' || payment.status === 'submitted') && (
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => { 
                    setShowDetailModal(false); 
                    handleVerifySubscription(sub._id, payment._id); 
                  }} 
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FaCheckCircle /> الموافقة على الاشتراك
                </button>
                <button 
                  onClick={() => { 
                    setShowDetailModal(false); 
                    setRejectingSubscriptionId(sub._id); 
                    setRejectingPaymentId(payment._id); 
                    setShowRejectionModal(true); 
                  }} 
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FaTimesCircle /> رفض الاشتراك
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ===== مودال رفض الاشتراك =====
  const renderRejectionModal = () => {
    if (!showRejectionModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaTimesCircle className="text-red-500" /> رفض الاشتراك
            </h3>
            <button 
              onClick={() => { 
                setShowRejectionModal(false); 
                setRejectingSubscriptionId(null); 
                setRejectingPaymentId(null); 
                setRejectionReason(''); 
              }} 
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                <FaExclamationTriangle className="w-5 h-5" />
                تأكد من إدخال سبب الرفض ليتم إبلاغ المستخدم به.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                سبب الرفض <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
                rows={4}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition"
                placeholder="اكتب سبب رفض الاشتراك (سيظهر للمستخدم)..."
                required 
              />
              <p className="text-xs text-gray-400 mt-1">{rejectionReason.length}/500 حرف</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleRejectSubscription} 
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />} 
                تأكيد الرفض
              </button>
              <button 
                onClick={() => { 
                  setShowRejectionModal(false); 
                  setRejectingSubscriptionId(null); 
                  setRejectingPaymentId(null); 
                  setRejectionReason(''); 
                }}
                className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== عرض حالة التحميل =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // ===== JSX الرئيسي =====
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaCoins className="text-purple-600" />
              إدارة الاشتراكات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              مراجعة طلبات الاشتراك والموافقة عليها أو رفضها مع عرض إثباتات الدفع
            </p>
          </div>
          <div className="flex items-center gap-3">
            {actionMessage && (
              <div className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                actionMessage.type === 'success' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {actionMessage.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
                {actionMessage.message}
              </div>
            )}
            <button 
              onClick={refreshData} 
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaSync className={refreshing ? 'animate-spin' : ''} /> 
              {refreshing ? 'جاري التحديث...' : 'تحديث'}
            </button>
          </div>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition">
            <div className="text-2xl font-bold text-gray-700">{subscriptionStats.total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">📊 إجمالي الاشتراكات</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition">
            <div className="text-2xl font-bold text-yellow-500">{subscriptionStats.pending}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">⏳ قيد المراجعة</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition">
            <div className="text-2xl font-bold text-green-500">{subscriptionStats.active}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">✅ نشطة</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition">
            <div className="text-2xl font-bold text-red-500">{subscriptionStats.expired + subscriptionStats.cancelled}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">❌ منتهية/ملغية</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition">
            <div className="text-2xl font-bold text-purple-600">{subscriptionStats.totalAmount.toLocaleString()} ريال</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">💰 الإيرادات</div>
          </div>
        </div>

        {/* رسائل الخطأ */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-400 mb-6 flex items-center gap-2">
            <FaTimesCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* البحث والتصفية */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="بحث عن اشتراك (المستخدم، المادة، الكود)..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" 
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">⏳ قيد الانتظار</option>
              <option value="active">✅ نشط</option>
              <option value="expired">❌ منتهي</option>
              <option value="cancelled">🚫 ملغي</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            {filteredSubscriptions.length} اشتراك
          </div>
        </div>

        {/* جدول الاشتراكات */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المستخدم</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المادة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">السعر</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">طريقة الدفع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">إثبات الدفع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المدة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSubscriptions.map((sub, index) => {
                  const payment = getPaymentForSubscription(sub._id);
                  const isPending = sub.status === 'pending' && payment && (payment.status === 'pending' || payment.status === 'submitted');
                  
                  return (
                    <tr key={sub._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition ${isPending ? 'bg-yellow-50/30 dark:bg-yellow-900/10' : ''}`}>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{sub.accountId?.profile?.fullName || 'مستخدم'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{sub.accountId?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {sub.materialId?.nameAr || sub.materialId?.name || '-'}
                        <div className="text-xs text-gray-400">{sub.materialId?.code || ''}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">{sub.price} {sub.currency}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                        {sub.paymentMethod === 'credit_card' ? '💳 بطاقة ائتمان' :
                         sub.paymentMethod === 'mada' ? '💳 مدى' :
                         sub.paymentMethod === 'paypal' ? '💳 بايبال' :
                         sub.paymentMethod === 'bank_transfer' ? '🏦 تحويل بنكي' :
                         sub.paymentMethod === 'free' ? '🎁 مجاني' : '📝 يدوي'}
                      </td>
                      <td className="px-4 py-3">{getSubscriptionStatusBadge(sub.status)}</td>
                      <td className="px-4 py-3">
                        {payment?.proof ? (
                          <button 
                            onClick={() => viewProof(payment.proof!)} 
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm transition group" 
                            title="عرض إثبات الدفع"
                          >
                            {getFileIcon(payment.proof?.mimeType, payment.proof?.originalName)}
                            <span className="truncate max-w-[80px]">{payment.proof?.originalName || 'إثبات'}</span>
                            <FaEye className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                          </button>
                        ) : <span className="text-gray-400 text-sm">لا يوجد</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                        <div>{formatDate(sub.startDate)}</div>
                        <div className="text-xs text-gray-400">→</div>
                        <div>{formatDate(sub.endDate)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button 
                            onClick={() => viewSubscriptionDetail(sub)} 
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition" 
                            title="عرض التفاصيل"
                          >
                            <FaInfoCircle />
                          </button>
                          {isPending && (
                            <>
                              <button 
                                onClick={() => handleVerifySubscription(sub._id, payment._id)} 
                                disabled={processing} 
                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 transition disabled:opacity-50" 
                                title="الموافقة على الاشتراك"
                              >
                                <FaCheckCircle />
                              </button>
                              <button 
                                onClick={() => { 
                                  setRejectingSubscriptionId(sub._id); 
                                  setRejectingPaymentId(payment._id); 
                                  setShowRejectionModal(true); 
                                }} 
                                disabled={processing} 
                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition disabled:opacity-50" 
                                title="رفض الاشتراك"
                              >
                                <FaTimesCircle />
                              </button>
                            </>
                          )}
                          {sub.status === 'active' && (
                            <span className="text-green-500 text-sm flex items-center gap-1 px-2">
                              <FaCheckCircle className="w-4 h-4" /> نشط
                            </span>
                          )}
                          {sub.status === 'cancelled' && (
                            <span className="text-gray-500 text-sm flex items-center gap-1 px-2">
                              <FaTimesCircle className="w-4 h-4" /> ملغي
                            </span>
                          )}
                          {sub.status === 'expired' && (
                            <span className="text-red-500 text-sm flex items-center gap-1 px-2">
                              <FaTimesCircle className="w-4 h-4" /> منتهي
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSubscriptions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="text-6xl mb-4">📭</div>
                      {searchTerm || filterStatus !== 'all' ? 'لا توجد اشتراكات تطابق البحث' : 'لا توجد اشتراكات حالياً'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ملاحظة في الأسفل */}
        {subscriptionStats.pending > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 flex items-center gap-3">
            <FaClock className="text-yellow-500 w-5 h-5" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              يوجد <span className="font-bold">{subscriptionStats.pending}</span> طلب اشتراك في انتظار المراجعة.
              {subscriptionStats.pending === 1 ? ' يرجى مراجعة الطلب.' : ' يرجى مراجعة الطلبات.'}
            </p>
          </div>
        )}
      </div>

      {/* مودالات */}
      {renderProofModal()}
      {renderDetailModal()}
      {renderRejectionModal()}
    </div>
  );
};

export default AdminSubscriptions;