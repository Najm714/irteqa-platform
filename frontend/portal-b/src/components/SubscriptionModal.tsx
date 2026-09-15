// frontend/portal-a/src/components/SubscriptionModal.tsx
import React, { useState, useEffect } from 'react';
import {
  FaTimes, FaSpinner, FaLock, FaCheckCircle,
  FaCreditCard, FaWallet,
  FaUpload, FaFilePdf, FaFileImage, FaFileAlt,
  FaBuilding, FaUser, FaIdCard,
  FaShieldAlt, FaClock
} from 'react-icons/fa';

// ============================================================
// واجهات البيانات
// ============================================================

interface Material {
  _id: string;
  name: string;
  nameAr: string;
  code: string;
  price: number;
  description?: string;
  descriptionAr?: string;
  portalId?: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  material: Material;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  userId?: string;
}

// ============================================================
// المكون الرئيسي
// ============================================================

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  material,
  onClose,
  onSuccess,
  token,
  userId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // بيانات النموذج
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'mada' | 'bank_transfer' | 'manual'>('bank_transfer');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [notes, setNotes] = useState('');
  
  // رفع الملف
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = material.portalId || localStorage.getItem('portalId') || '6aa45ad70a89ed89eeb18e41';

  // ===== إعادة تعيين النموذج عند الإغلاق =====
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setError(null);
    setSuccess(false);
    setSelectedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
    setUploading(false);
    setPaymentMethod('bank_transfer');
    setAccountNumber('');
    setAccountName('');
    setBankName('');
    setNotes('');
  };

  // ===== معالجة اختيار الملف =====
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من حجم الملف (5MB كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        setError('حجم الملف يتجاوز 5MB. يرجى اختيار ملف أصغر.');
        return;
      }
      
      // التحقق من نوع الملف
      const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
      if (!isAllowed) {
        setError('نوع الملف غير مدعوم. يرجى رفع صورة، PDF، أو ملف وورد.');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ===== رفع الملف =====
  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'payment_proof');
      formData.append('portalId', PORTAL_ID);

      // محاكاة تقدم الرفع
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();
      if (data.success) {
        return data.data.file._id;
      }
      throw new Error(data.message || 'فشل رفع الملف');
    } catch (err: any) {
      console.error('Upload error:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // ===== تقديم الاشتراك =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ التحقق من التوكن
    if (!token) {
      setError('الرجاء تسجيل الدخول أولاً');
      return;
    }

    // ✅ التحقق من userId
    if (!userId) {
      setError('معرف المستخدم غير موجود. يرجى تسجيل الدخول مرة أخرى.');
      return;
    }

    // التحقق من البيانات المطلوبة
    if (!accountNumber || accountNumber.trim() === '') {
      setError('رقم الحساب مطلوب');
      return;
    }
    if (!accountName || accountName.trim() === '') {
      setError('اسم صاحب الحساب مطلوب');
      return;
    }
    if (!selectedFile) {
      setError('يرجى رفع إثبات الدفع');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. رفع ملف الإثبات
      let proofFileId = null;
      if (selectedFile) {
        proofFileId = await uploadFile(selectedFile);
      }

      if (!proofFileId) {
        throw new Error('فشل رفع إثبات الدفع');
      }

      // 2. إنشاء سجل الدفع
      const paymentData = {
        portalId: PORTAL_ID,
        accountId: userId,
        amount: material.price || 0,
        currency: 'SAR',
        paymentMethod: paymentMethod,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        bankName: bankName.trim() || '',
        reference: `SUB-${material.code || 'MAT'}-${Date.now()}`,
        proof: proofFileId,
        status: 'submitted',
        notes: notes.trim() || '',
      };

      console.log('📤 Creating payment:', paymentData);

      const paymentResponse = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(paymentData),
      });

      const paymentResult = await paymentResponse.json();
      console.log('📥 Payment response:', paymentResult);

      if (!paymentResult.success) {
        throw new Error(paymentResult.message || 'فشل إنشاء سجل الدفع');
      }

      const paymentId = paymentResult.data._id;

      // 3. إنشاء الاشتراك مع ربطه بسجل الدفع
      const subscriptionData = {
        materialId: material._id,
        price: material.price || 0,
        currency: 'SAR',
        paymentMethod: paymentMethod,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        paymentStatus: 'pending',
        portalId: PORTAL_ID,
        paymentId: paymentId, // ✅ ربط الاشتراك بسجل الدفع
        description: notes.trim() || '',
      };

      console.log('📤 Creating subscription:', subscriptionData);

      const subscriptionResponse = await fetch(`${API_URL}/explanations/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(subscriptionData),
      });

      const subscriptionResult = await subscriptionResponse.json();
      console.log('📥 Subscription response:', subscriptionResult);

      if (!subscriptionResult.success) {
        throw new Error(subscriptionResult.message || 'فشل إنشاء الاشتراك');
      }

      const subscriptionId = subscriptionResult.data._id;

      // 4. ✅ تحديث سجل الدفع بـ subscriptionId (ربط ثنائي)
      await fetch(`${API_URL}/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ subscriptionId: subscriptionId }),
      });

      console.log('✅ Payment and subscription linked successfully');

      // 5. نجاح العملية
      setSuccess(true);
      setLoading(false);
      
      // إغلاق النموذج بعد 2 ثانية
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('❌ Subscription error:', err);
      setError(err.message || 'حدث خطأ في إنشاء الاشتراك');
      setLoading(false);
    }
  };

  // ===== الحصول على أيقونة الملف =====
  const getFileIcon = (file: File | null) => {
    if (!file) return <FaFileAlt className="text-gray-400" />;
    
    const type = file.type;
    if (type.startsWith('image/')) {
      return <FaFileImage className="text-purple-500" />;
    }
    if (type === 'application/pdf') {
      return <FaFilePdf className="text-red-500" />;
    }
    return <FaFileAlt className="text-blue-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* ===== Header ===== */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FaLock className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {material.price > 0 ? 'الاشتراك في المادة' : 'اشتراك مجاني'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {material.nameAr || material.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            disabled={loading}
          >
            <FaTimes className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* ===== Content ===== */}
        <div className="p-6">
          {success ? (
            // ===== رسالة النجاح =====
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                تم إرسال طلب الاشتراك بنجاح!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                سيتم مراجعة طلبك من قبل الإدارة وسيتم تفعيل الاشتراك بعد الموافقة على الدفع.
              </p>
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2 justify-center">
                  <FaClock />
                  في انتظار موافقة المدير
                </p>
              </div>
            </div>
          ) : (
            // ===== نموذج الاشتراك =====
            <form onSubmit={handleSubmit}>
              {/* ===== ملخص المادة ===== */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">المادة</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {material.nameAr || material.name}
                    </p>
                    <p className="text-xs text-gray-400">{material.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">سعر الاشتراك</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {material.price > 0 ? `${material.price} ريال` : 'مجاني'}
                    </p>
                    <p className="text-xs text-gray-400">لمدة 30 يوم</p>
                  </div>
                </div>
              </div>

              {/* ===== طريقة الدفع ===== */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  طريقة الدفع *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'credit_card', label: '💳 بطاقة ائتمان' },
                    { id: 'mada', label: '💳 مدى' },
                    { id: 'bank_transfer', label: '🏦 تحويل بنكي' },
                    { id: 'manual', label: '📝 دفع يدوي' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`p-3 rounded-lg border-2 transition-all text-sm ${
                        paymentMethod === method.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ===== معلومات الحساب (للتحويل البنكي والدفع اليدوي) ===== */}
              {(paymentMethod === 'bank_transfer' || paymentMethod === 'manual') && (
                <div className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FaBuilding className="text-purple-500" />
                    معلومات التحويل البنكي
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      رقم الحساب *
                    </label>
                    <div className="relative">
                      <FaIdCard className="absolute right-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        placeholder="SA01 2345 6789 0123 4567"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      اسم صاحب الحساب *
                    </label>
                    <div className="relative">
                      <FaUser className="absolute right-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        placeholder="أحمد محمد"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      اسم البنك (اختياري)
                    </label>
                    <div className="relative">
                      <FaBuilding className="absolute right-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        placeholder="البنك الأهلي"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ===== رفع إثبات الدفع ===== */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  إثبات الدفع *
                </label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                  selectedFile 
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                }`}>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="proof-upload-client"
                  />
                  <label htmlFor="proof-upload-client" className="cursor-pointer block">
                    {selectedFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-3">
                          {getFileIcon(selectedFile)}
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
                            {selectedFile.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                          {filePreview && filePreview.startsWith('data:image') && (
                            <img src={filePreview} alt="المعاينة" className="max-h-32 rounded-lg" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { 
                            e.stopPropagation();
                            setSelectedFile(null);
                            setFilePreview(null);
                            setError(null);
                          }}
                          className="text-red-500 text-sm hover:text-red-700"
                        >
                          إزالة الملف
                        </button>
                      </div>
                    ) : (
                      <div>
                        <FaUpload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                          اضغط لرفع إثبات الدفع
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          الصور، PDF، وورد - الحد الأقصى 5MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                {uploading && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <FaSpinner className="w-4 h-4 text-purple-600 animate-spin" />
                      <span className="text-sm text-gray-500">جاري رفع الملف...</span>
                      <span className="text-sm text-purple-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ===== ملاحظات إضافية ===== */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  placeholder="أي معلومات إضافية تود إضافتها..."
                />
              </div>

              {/* ===== الخطأ ===== */}
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-xl border border-red-400 mb-4 flex items-center gap-2">
                  <FaTimes className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* ===== معلومات إضافية ===== */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 mb-6">
                <p className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                  <FaShieldAlt className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    سيتم تعليق الاشتراك لحين موافقة الإدارة على إثبات الدفع. 
                    سيتم إشعارك عند تفعيل الاشتراك.
                  </span>
                </p>
              </div>

              {/* ===== الأزرار ===== */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading || uploading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaLock />
                  )}
                  {loading || uploading ? 'جاري الإرسال...' : 'إرسال طلب الاشتراك'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  disabled={loading}
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;