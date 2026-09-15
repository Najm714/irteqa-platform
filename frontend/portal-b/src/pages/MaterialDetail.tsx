// frontend/portal-a/src/pages/MaterialDetail.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaBook, FaVideo, FaUserGraduate, FaStar, FaPlay,
  FaLock, FaUnlock, FaCheckCircle, FaClock, FaUsers,
  FaSpinner, FaExclamationCircle,
  FaFolder, FaChevronLeft, FaTimes,
  FaDownload, FaFilePdf, FaFileWord, FaFileImage, FaFileAlt,
  FaFileArchive, FaFileCode, FaFileExcel, FaFilePowerpoint,
  FaCreditCard, FaWallet, FaUpload, FaBuilding, FaUser,
  FaIdCard, FaShieldAlt
} from 'react-icons/fa';

// ============================================================
// واجهات البيانات
// ============================================================

interface MaterialDetail {
  _id: string;
  name: string;
  nameAr: string;
  code: string;
  description?: string;
  descriptionAr?: string;
  portalId: string;
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
  icon: string;
  instructor: string;
  instructorBio?: string;
  duration: string;
  price: number;
  features: string[];
  featuresAr: string[];
  units: {
    _id?: string;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    files: {
      _id?: string;
      fileId: string;
      filename: string;
      isEncrypted: boolean;
      size?: number;
      mimeType?: string;
    }[];
    order: number;
  }[];
  summaries: {
    _id?: string;
    fileId: string;
    title: string;
    titleAr: string;
    isEncrypted: boolean;
    order: number;
  }[];
  slug: string;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Video {
  _id: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  instructor: string;
  duration: number;
  isEncrypted: boolean;
  isPublished: boolean;
  thumbnail: string;
  videoUrl: string;
  slug: string;
  portalId: string;
  order: number;
  views: number;
  createdAt: string;
  hasValidUrl?: boolean;
}

interface Subscription {
  _id: string;
  accountId: {
    _id: string;
    profile: { fullName: string };
    email: string;
  };
  materialId: string | MaterialDetail;
  price: number;
  currency: string;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  description?: string;
  descriptionAr?: string;
  benefits: string[];
  benefitsAr: string[];
  portalId: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  _id: string;
  paymentId: string;
  portalId: string;
  accountId: string;
  requestId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  reference: string;
  proof?: {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'refunded';
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// المكون الرئيسي
// ============================================================

const MaterialDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'loading' | 'active' | 'pending' | 'none'>('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'videos' | 'summaries' | 'subscription'>('overview');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  
  // حالات الدفع
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'mada' | 'bank_transfer' | 'manual'>('bank_transfer');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofFilePreview, setProofFilePreview] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentResult, setPaymentResult] = useState<Payment | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  // ===== دالة للحصول على portalId =====
  const getPortalId = useCallback(() => {
    if (material?.portalId) return material.portalId;
    const stored = localStorage.getItem('portalId');
    if (stored) return stored;
    return '6aa45ad70a89ed89eeb18e41';
  }, [material]);

  // ===== دالة للحصول على التوكن =====
  const getAuthHeader = useCallback(() => {
    if (!token) return null;
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }, [token]);

  // ===== تحميل بيانات المادة =====
  const fetchMaterial = useCallback(async () => {
    if (!id || !token) {
      setLoading(false);
      return;
    }
    try {
      const portalId = getPortalId();
      const authHeader = getAuthHeader();
      
      console.log('📤 Fetching material:', id);
      
      const response = await fetch(`${API_URL}/explanations/materials/${id}`, {
        headers: { 
          'Authorization': authHeader || '',
          'X-Portal-Id': portalId,
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('جلسة الدخول منتهية. يرجى تسجيل الدخول مرة أخرى.');
          return;
        }
        if (response.status === 404) {
          setError('المادة غير موجودة');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Material data:', data);
      
      if (data.success) {
        const materialData = data.data;
        // التأكد من وجود fileId
        if (materialData.units) {
          materialData.units = materialData.units.map((unit: any) => ({
            ...unit,
            files: unit.files?.map((file: any) => ({
              ...file,
              fileId: file.fileId || file._id,
            })) || [],
          }));
        }
        if (materialData.summaries) {
          materialData.summaries = materialData.summaries.map((summary: any) => ({
            ...summary,
            fileId: summary.fileId || summary._id,
          }));
        }
        setMaterial(materialData);
      } else {
        setError(data.message || 'حدث خطأ في تحميل المادة');
      }
    } catch (err: any) {
      console.error('❌ Error fetching material:', err);
      setError(err.message || 'حدث خطأ في تحميل المادة');
    }
  }, [id, token, API_URL, getPortalId, getAuthHeader]);

  // ===== تحميل فيديوهات المادة =====
  const fetchVideos = useCallback(async () => {
    if (!id || !token) return;

    try {
      const portalId = getPortalId();
      const authHeader = getAuthHeader();
      
      console.log('📤 Fetching videos for material:', id);
      
      const response = await fetch(`${API_URL}/explanations/videos?materialId=${id}`, {
        headers: { 
          'Authorization': authHeader || '',
          'X-Portal-Id': portalId,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // ✅ استخدام الفيديوهات مع الروابط الصحيحة
          const publishedVideos = data.data.filter((v: Video) => v.isPublished);
          setVideos(publishedVideos);
          console.log(`✅ Loaded ${publishedVideos.length} videos`);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching videos:', err);
    }
  }, [id, token, API_URL, getPortalId, getAuthHeader]);

// ===== التحقق من حالة الاشتراك =====
const fetchSubscriptionStatus = useCallback(async () => {
  if (!id || !token || !user) {
    setSubscriptionStatus('none');
    return;
  }
  try {
    const portalId = getPortalId();
    const authHeader = getAuthHeader();
    
    // ✅ استخدم المسار المخصص للعميل /my
    const response = await fetch(`${API_URL}/explanations/subscriptions/my?materialId=${id}`, {
      headers: { 
        'Authorization': authHeader || '',
        'X-Portal-Id': portalId,
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📥 My subscription status:', data);
      
      if (data.success) {
        const activeSub = data.data.find((s: Subscription) => s.status === 'active');
        const pendingSub = data.data.find((s: Subscription) => s.status === 'pending');
        
        if (activeSub) {
          setSubscription(activeSub);
          setIsSubscribed(true);
          setSubscriptionStatus('active');
        } else if (pendingSub) {
          setSubscription(pendingSub);
          setIsSubscribed(false);
          setSubscriptionStatus('pending');
        } else {
          setSubscription(null);
          setIsSubscribed(false);
          setSubscriptionStatus('none');
        }
      }
    } else {
      console.error('❌ Failed to fetch subscriptions:', response.status);
      setSubscriptionStatus('none');
    }
  } catch (err) {
    console.error('❌ Error fetching subscription status:', err);
    setSubscriptionStatus('none');
  }
}, [id, token, user, API_URL, getPortalId, getAuthHeader]);

  // ===== دالة احتياطية للتوافق مع الإصدارات القديمة =====
  const fetchSubscriptionStatusFallback = useCallback(async () => {
    if (!id || !token || !user) return;
    try {
      const portalId = getPortalId();
      const authHeader = getAuthHeader();
      
      const response = await fetch(`${API_URL}/explanations/subscriptions?materialId=${id}`, {
        headers: { 
          'Authorization': authHeader || '',
          'X-Portal-Id': portalId,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const userSubscriptions = data.data.filter((s: Subscription) => 
            typeof s.accountId === 'object' && s.accountId._id === user.id
          );
          
          const activeSub = userSubscriptions.find((s: Subscription) => s.status === 'active');
          const pendingSub = userSubscriptions.find((s: Subscription) => s.status === 'pending');
          
          if (activeSub) {
            setSubscription(activeSub);
            setIsSubscribed(true);
            setSubscriptionStatus('active');
          } else if (pendingSub) {
            setSubscription(pendingSub);
            setIsSubscribed(false);
            setSubscriptionStatus('pending');
          } else {
            setSubscription(null);
            setIsSubscribed(false);
            setSubscriptionStatus('none');
          }
        }
      }
    } catch (err) {
      console.error('❌ Fallback error:', err);
    }
  }, [id, token, user, API_URL, getPortalId, getAuthHeader]);

  // ===== تحميل جميع البيانات =====
  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchMaterial(), fetchVideos(), fetchSubscriptionStatus()]);
      setLoading(false);
    };
    loadData();
  }, [fetchMaterial, fetchVideos, fetchSubscriptionStatus]);

  // ===== ✅ تشغيل الفيديو - مع التوكن =====
  const handlePlayVideo = async (video: Video) => {
    if (!video.videoUrl) {
      alert('⚠️ لا يوجد رابط لهذا الفيديو');
      return;
    }

    if (video.isEncrypted && !isSubscribed) {
      alert('⚠️ هذا الفيديو مشفر، يرجى الاشتراك لمشاهدته');
      return;
    }

    setVideoLoading(true);
    setSelectedVideo(video);
    setShowVideoModal(true);

    try {
      const portalId = getPortalId();
      const authHeader = getAuthHeader();
      
      console.log('📤 Loading video:', video._id);
      console.log('📤 Video URL:', video.videoUrl);
      
      // ✅ تحميل الفيديو عبر fetch مع التوكن
      const response = await fetch(video.videoUrl, {
        headers: {
          'Authorization': authHeader || '',
          'X-Portal-Id': portalId,
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('⚠️ جلسة الدخول منتهية. يرجى تسجيل الدخول مرة أخرى.');
          navigate('/login');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const videoUrl = URL.createObjectURL(blob);
      
      // ✅ تحديث الفيديو بـ Blob URL
      setSelectedVideo({
        ...video,
        videoUrl: videoUrl,
      });
      
      console.log('✅ Video loaded successfully');
      
    } catch (err: any) {
      console.error('❌ Error loading video:', err);
      alert('حدث خطأ في تحميل الفيديو');
      setShowVideoModal(false);
    } finally {
      setVideoLoading(false);
    }
  };

// frontend/portal-a/src/pages/RequestWorkspace.tsx

// ===== معاينة ملف (مع حماية) =====
const handleViewFile = (fileId: string) => {
  if (!fileId) {
    alert('⚠️ لا يوجد معرف للملف');
    return;
  }

  const token = localStorage.getItem('token');
  // ✅ استخدام مسار view بدلاً من download-direct
  window.open(`${API_URL}/files/${fileId}/view?token=${token}`, '_blank');
};

  // ===== تحميل الملف =====
  const handleDownloadFile = async (fileId: string, filename: string, isEncrypted: boolean) => {
    if (!fileId) {
      alert('⚠️ لا يوجد معرف للملف');
      return;
    }

    if (isEncrypted && !isSubscribed) {
      alert('⚠️ هذا الملف مشفر، يرجى الاشتراك لتحميله');
      return;
    }

    try {
      const portalId = getPortalId();
      const authHeader = getAuthHeader();
      
      console.log('📤 Downloading file:', fileId);
      
      const response = await fetch(`${API_URL}/files/${fileId}/download-direct`, {
        headers: { 
          'Authorization': authHeader || '',
          'X-Portal-Id': portalId,
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('⚠️ جلسة الدخول منتهية. يرجى تسجيل الدخول مرة أخرى.');
          navigate('/login');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ File downloaded successfully');
      
    } catch (err: any) {
      console.error('❌ Download error:', err);
      alert(err.message || 'حدث خطأ في تحميل الملف');
    }
  };

  // ===== معالجة رفع ملف الإثبات =====
  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSubscriptionError('حجم الملف يتجاوز 5MB');
        return;
      }
      setProofFile(file);
      const reader = new FileReader();
      reader.onload = () => setProofFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ===== رفع ملف =====
  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const portalId = getPortalId();
      const authHeader = getAuthHeader();
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'payment_proof');
      formData.append('portalId', portalId);
      
      console.log('📤 Uploading proof file...');
      
      const response = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': authHeader || '' },
        body: formData,
      });
      
      const data = await response.json();
      console.log('📥 Upload response:', data);
      
      if (data.success) {
        return data.data.file._id;
      }
      throw new Error(data.message || 'فشل رفع الملف');
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // ===== إنشاء اشتراك مجاني =====
  const createFreeSubscription = async () => {
    if (!token || !user || !material) return;
    setSubscribing(true);
    setSubscriptionError(null);
    try {
      const portalId = getPortalId();
      const authHeader = getAuthHeader();
      
      console.log('📤 Creating free subscription...');
      
      const response = await fetch(`${API_URL}/explanations/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader || '',
          'Content-Type': 'application/json',
          'X-Portal-Id': portalId,
        },
        body: JSON.stringify({
          materialId: material._id,
          price: 0,
          paymentMethod: 'free',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          paymentStatus: 'paid',
          portalId: portalId,
        }),
      });
      
      const data = await response.json();
      console.log('📥 Free subscription response:', data);
      
      if (data.success) {
        setSubscription(data.data);
        setIsSubscribed(true);
        setSubscriptionStatus('active');
        alert('✅ تم الاشتراك المجاني بنجاح!');
        await fetchSubscriptionStatus();
      } else {
        setSubscriptionError(data.message || 'حدث خطأ في الاشتراك');
      }
    } catch (err: any) {
      console.error('❌ Free subscription error:', err);
      setSubscriptionError(err.message || 'حدث خطأ في الاشتراك');
    } finally {
      setSubscribing(false);
    }
  };

  // ===== معالجة الدفع =====
  const handlePaymentSubmit = async () => {
    if (!token || !user || !material) {
      navigate('/login');
      return;
    }
    
    if (paymentMethod === 'manual' || paymentMethod === 'bank_transfer') {
      if (!accountNumber.trim()) {
        setSubscriptionError('رقم الحساب مطلوب');
        return;
      }
      if (!accountName.trim()) {
        setSubscriptionError('اسم صاحب الحساب مطلوب');
        return;
      }
      if (!proofFile) {
        setSubscriptionError('يرجى رفع إثبات الدفع');
        return;
      }
    }
    
    setPaymentStatus('processing');
    setSubscriptionError(null);
    
    try {
      const portalId = getPortalId();
      const authHeader = getAuthHeader();
      
      let proofFileId = null;
      if (proofFile && (paymentMethod === 'manual' || paymentMethod === 'bank_transfer')) {
        proofFileId = await uploadFile(proofFile);
        if (!proofFileId) {
          throw new Error('فشل رفع إثبات الدفع');
        }
        console.log('✅ Proof uploaded:', proofFileId);
      }
      
      // 1. إنشاء سجل الدفع
      const paymentData = {
        portalId: portalId,
        accountId: user.id,
        amount: material.price,
        currency: 'SAR',
        paymentMethod: paymentMethod,
        accountNumber: accountNumber.trim() || '',
        accountName: accountName.trim() || '',
        bankName: bankName.trim() || '',
        reference: `SUB-${material.code}-${Date.now()}`,
        proof: proofFileId || null,
        status: proofFileId ? 'submitted' : 'pending',
        notes: notes || '',
      };
      
      console.log('📤 Creating payment:', paymentData);
      
      const paymentResponse = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader || '',
          'Content-Type': 'application/json',
          'X-Portal-Id': portalId,
        },
        body: JSON.stringify(paymentData),
      });
      
      const paymentResultData = await paymentResponse.json();
      console.log('📥 Payment response:', paymentResultData);
      
      if (!paymentResultData.success) {
        throw new Error(paymentResultData.message || 'فشل إنشاء سجل الدفع');
      }
      
      const paymentId = paymentResultData.data._id;
      console.log('✅ Payment created with ID:', paymentId);
      
      // 2. إنشاء الاشتراك مع ربطه بسجل الدفع
      const subscriptionData = {
        materialId: material._id,
        price: material.price,
        currency: 'SAR',
        paymentMethod: paymentMethod,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: proofFileId ? 'pending' : 'active',
        paymentStatus: proofFileId ? 'pending' : 'paid',
        portalId: portalId,
        paymentId: paymentId,
        description: notes || '',
      };
      
      console.log('📤 Creating subscription:', subscriptionData);
      
      const subscriptionResponse = await fetch(`${API_URL}/explanations/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader || '',
          'Content-Type': 'application/json',
          'X-Portal-Id': portalId,
        },
        body: JSON.stringify(subscriptionData),
      });
      
      const subscriptionResult = await subscriptionResponse.json();
      console.log('📥 Subscription response:', subscriptionResult);
      
      if (!subscriptionResult.success) {
        throw new Error(subscriptionResult.message || 'فشل إنشاء الاشتراك');
      }
      
      const subscriptionId = subscriptionResult.data._id;
      console.log('✅ Subscription created with ID:', subscriptionId);
      
      // 3. تحديث سجل الدفع بـ subscriptionId
      await fetch(`${API_URL}/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader || '',
          'Content-Type': 'application/json',
          'X-Portal-Id': portalId,
        },
        body: JSON.stringify({ subscriptionId: subscriptionId }),
      });
      
      setPaymentResult(paymentResultData.data);
      setPaymentStatus('success');
      
      if (proofFileId) {
        setSubscription(subscriptionResult.data);
        setIsSubscribed(false);
        setSubscriptionStatus('pending');
        setShowPaymentModal(false);
        alert('✅ تم إرسال طلب الاشتراك بنجاح! في انتظار موافقة المدير.');
      } else {
        setSubscription(subscriptionResult.data);
        setIsSubscribed(true);
        setSubscriptionStatus('active');
        setShowPaymentModal(false);
        alert('✅ تم الاشتراك بنجاح!');
      }
      
      await fetchSubscriptionStatus();
      
    } catch (err: any) {
      console.error('❌ Payment error:', err);
      setPaymentStatus('failed');
      setSubscriptionError(err.message || 'حدث خطأ في معالجة الدفع');
    } finally {
      setSubscribing(false);
    }
  };

  // ===== الاشتراك في المادة =====
  const handleSubscribe = async () => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    if (!material) return;
    if (material.price === 0) {
      await createFreeSubscription();
      return;
    }
    setShowPaymentModal(true);
  };

  // ===== الحصول على أيقونة الملف =====
  const getFileIcon = (filename: string) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    const icons: { [key: string]: React.ReactNode } = {
      'pdf': <FaFilePdf className="text-red-500 w-5 h-5" />,
      'doc': <FaFileWord className="text-blue-500 w-5 h-5" />,
      'docx': <FaFileWord className="text-blue-500 w-5 h-5" />,
      'xls': <FaFileExcel className="text-green-500 w-5 h-5" />,
      'xlsx': <FaFileExcel className="text-green-500 w-5 h-5" />,
      'ppt': <FaFilePowerpoint className="text-orange-500 w-5 h-5" />,
      'pptx': <FaFilePowerpoint className="text-orange-500 w-5 h-5" />,
      'jpg': <FaFileImage className="text-purple-500 w-5 h-5" />,
      'jpeg': <FaFileImage className="text-purple-500 w-5 h-5" />,
      'png': <FaFileImage className="text-purple-500 w-5 h-5" />,
      'gif': <FaFileImage className="text-purple-500 w-5 h-5" />,
      'zip': <FaFileArchive className="text-gray-500 w-5 h-5" />,
      'rar': <FaFileArchive className="text-gray-500 w-5 h-5" />,
      'js': <FaFileCode className="text-yellow-500 w-5 h-5" />,
      'ts': <FaFileCode className="text-yellow-500 w-5 h-5" />,
      'py': <FaFileCode className="text-yellow-500 w-5 h-5" />,
      'java': <FaFileCode className="text-yellow-500 w-5 h-5" />,
    };
    return icons[ext] || <FaFileAlt className="text-gray-500 w-5 h-5" />;
  };

  // ===== تنسيق المدة =====
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ===== الحصول على أيقونة المادة =====
  const getMaterialIcon = (icon: string) => {
    const icons: { [key: string]: string } = {
      'fa-book': '📚',
      'fa-graduation-cap': '🎓',
      'fa-flask': '🧪',
      'fa-calculator': '🧮',
      'fa-code': '💻',
      'fa-brain': '🧠',
      'fa-heart': '❤️',
      'fa-star': '⭐',
      'fa-atom': '⚛️',
      'fa-microscope': '🔬',
    };
    return icons[icon] || '📚';
  };

  // ===== عرض مودال الدفع =====
  const renderPaymentModal = () => {
    if (!showPaymentModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaCreditCard className="text-purple-600" /> الدفع والاشتراك
            </h2>
            <button onClick={() => setShowPaymentModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition" disabled={paymentStatus === 'processing'}>
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">المادة</p>
                  <p className="font-bold text-gray-900 dark:text-white">{material?.nameAr || material?.name}</p>
                  <p className="text-xs text-gray-400">{material?.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">المبلغ</p>
                  <p className="text-2xl font-bold text-purple-600">{material?.price} ريال</p>
                  <p className="text-xs text-gray-400">لمدة 30 يوم</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">طريقة الدفع *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'credit_card', label: '💳 بطاقة ائتمان' },
                  { id: 'mada', label: '💳 مدى' },
                  { id: 'bank_transfer', label: '🏦 تحويل بنكي' },
                  { id: 'manual', label: '📝 دفع يدوي' },
                ].map((method) => (
                  <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id as any)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm ${paymentMethod === method.id ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 text-gray-600 dark:text-gray-400'}`}>
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
            {(paymentMethod === 'bank_transfer' || paymentMethod === 'manual') && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FaBuilding className="text-purple-500" /> معلومات التحويل البنكي
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الحساب *</label>
                  <div className="relative">
                    <FaIdCard className="absolute right-3 top-3 text-gray-400" />
                    <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      placeholder="SA01 2345 6789 0123 4567" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم صاحب الحساب *</label>
                  <div className="relative">
                    <FaUser className="absolute right-3 top-3 text-gray-400" />
                    <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      placeholder="أحمد محمد" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم البنك (اختياري)</label>
                  <div className="relative">
                    <FaBuilding className="absolute right-3 top-3 text-gray-400" />
                    <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      placeholder="البنك الأهلي" />
                  </div>
                </div>
              </div>
            )}
            {(paymentMethod === 'manual' || paymentMethod === 'bank_transfer') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">إثبات الدفع *</label>
                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition ${proofFile ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'}`}>
                  <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleProofFileChange} className="hidden" id="proof-upload" />
                  <label htmlFor="proof-upload" className="cursor-pointer block">
                    {proofFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-3">
                          {proofFile.type.startsWith('image/') ? <FaFileImage className="text-purple-500 w-6 h-6" /> : proofFile.type === 'application/pdf' ? <FaFilePdf className="text-red-500 w-6 h-6" /> : <FaFileAlt className="text-blue-500 w-6 h-6" />}
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">{proofFile.name}</span>
                          <span className="text-xs text-gray-400">({(proofFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        {proofFilePreview && proofFilePreview.startsWith('data:image') && <img src={proofFilePreview} alt="المعاينة" className="max-h-32 mx-auto rounded-lg" />}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setProofFile(null); setProofFilePreview(null); }} className="text-red-500 text-sm hover:text-red-700">إزالة الملف</button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <FaUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">اضغط لرفع إثبات الدفع (صورة، PDF، وورد)</p>
                        <p className="text-xs text-gray-400 mt-1">الحد الأقصى 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
                {uploading && (
                  <div className="mt-2 text-center">
                    <FaSpinner className="w-5 h-5 text-purple-600 animate-spin mx-auto" />
                    <p className="text-xs text-gray-500">جاري رفع الملف...</p>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات إضافية (اختياري)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                placeholder="أي معلومات إضافية تود إضافتها..." />
            </div>
            {paymentStatus === 'processing' && (
              <div className="text-center py-4">
                <FaSpinner className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">جاري معالجة الدفع...</p>
              </div>
            )}
            {paymentStatus === 'success' && paymentResult && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 text-center">
                <FaCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-green-700 dark:text-green-400">{paymentResult.proof ? 'تم إرسال طلب الاشتراك بنجاح!' : 'تم الاشتراك بنجاح!'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">رقم المرجع: {paymentResult.reference}</p>
                {paymentResult.proof && <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">⏳ في انتظار موافقة المدير</p>}
              </div>
            )}
            {paymentStatus === 'failed' && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 text-center">
                <p className="font-bold text-red-700 dark:text-red-400">فشل الدفع</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subscriptionError}</p>
              </div>
            )}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                <FaShieldAlt className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{(paymentMethod === 'manual' || paymentMethod === 'bank_transfer') && proofFile ? 'سيتم تعليق الاشتراك لحين موافقة الإدارة على إثبات الدفع. سيتم إشعارك عند تفعيل الاشتراك.' : 'سيتم تفعيل الاشتراك فوراً بعد إتمام عملية الدفع.'}</span>
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handlePaymentSubmit} disabled={paymentStatus === 'processing' || paymentStatus === 'success' || uploading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {paymentStatus === 'processing' ? <FaSpinner className="animate-spin" /> : <FaWallet />}
                {paymentStatus === 'processing' ? 'جاري المعالجة...' : 'تأكيد الدفع'}
              </button>
              <button onClick={() => setShowPaymentModal(false)} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition" disabled={paymentStatus === 'processing'}>إلغاء</button>
            </div>
            {subscriptionError && paymentStatus !== 'failed' && <p className="text-red-500 text-sm text-center">{subscriptionError}</p>}
          </div>
        </div>
      </div>
    );
  };

  // ===== عرض حالة الاشتراك =====
  const renderSubscriptionStatus = () => {
    if (subscriptionStatus === 'loading') {
      return <FaSpinner className="animate-spin w-6 h-6 text-purple-600" />;
    }
    if (subscriptionStatus === 'active') {
      return (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
            <FaCheckCircle className="w-5 h-5" /> مشترك
          </span>
          {subscription?.endDate && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">حتى {new Date(subscription.endDate).toLocaleDateString('ar-SA')}</p>}
        </div>
      );
    }
    if (subscriptionStatus === 'pending') {
      return (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <span className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-bold">
            <FaClock className="w-5 h-5" /> قيد المراجعة
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">في انتظار موافقة المدير</p>
        </div>
      );
    }
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{material?.price > 0 ? `${material.price} ريال` : 'مجاني'}</div>
        <button onClick={handleSubscribe} disabled={subscribing}
          className="mt-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 flex items-center gap-2">
          {subscribing ? <FaSpinner className="animate-spin" /> : <FaLock className="w-4 h-4" />}
          {subscribing ? 'جاري الاشتراك...' : material?.price > 0 ? 'اشتراك' : 'اشتراك مجاني'}
        </button>
        {subscriptionError && <p className="text-red-500 text-xs mt-2">{subscriptionError}</p>}
      </div>
    );
  };

  // ===== عرض حالة التحميل =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل المادة...</p>
        </div>
      </div>
    );
  }

  // ===== عرض الخطأ =====
  if (error || !material) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <FaExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">عذراً!</h2>
          <p className="text-gray-600 dark:text-gray-400">{error || 'المادة غير موجودة'}</p>
          <Link to="/explanations" className="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">العودة إلى الشروحات</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap">
          <Link to="/explanations" className="hover:text-purple-600 transition">الشروحات</Link>
          <FaChevronLeft className="w-3 h-3" />
          <Link to={`/explanations/${material.universityId?._id}`} className="hover:text-purple-600 transition">{material.universityId?.nameAr || material.universityId?.name}</Link>
          <FaChevronLeft className="w-3 h-3" />
          <Link to={`/explanations/${material.universityId?._id}/${material.collegeId?._id}`} className="hover:text-purple-600 transition">{material.collegeId?.nameAr || material.collegeId?.name}</Link>
          <FaChevronLeft className="w-3 h-3" />
          <Link to={`/explanations/${material.universityId?._id}/${material.collegeId?._id}/${material.specialtyId?._id}`} className="hover:text-purple-600 transition">{material.specialtyId?.nameAr || material.specialtyId?.name}</Link>
          <FaChevronLeft className="w-3 h-3" />
          <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{material.nameAr || material.name}</span>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-4xl flex-shrink-0">
              {getMaterialIcon(material.icon)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{material.nameAr || material.name}</h1>
                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono">{material.code}</span>
                {material.isFeatured && <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><FaStar className="w-3 h-3" /> مميز</span>}
                {subscriptionStatus === 'active' && <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><FaCheckCircle className="w-3 h-3" /> مشترك</span>}
                {subscriptionStatus === 'pending' && <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><FaClock className="w-3 h-3" /> قيد المراجعة</span>}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><FaUserGraduate className="w-4 h-4" /> {material.instructor}</span>
                <span className="flex items-center gap-1"><FaClock className="w-4 h-4" /> {material.duration || 'غير محدد'}</span>
                <span className="flex items-center gap-1"><FaBook className="w-4 h-4" /> {material.units?.length || 0} وحدات</span>
                <span className="flex items-center gap-1"><FaVideo className="w-4 h-4" /> {videos.length} فيديو</span>
                <span className="flex items-center gap-1"><FaUsers className="w-4 h-4" /> 0 طالب</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-3">{material.descriptionAr || material.description || 'لا يوجد وصف للمادة'}</p>
            </div>
            <div className="flex-shrink-0">{renderSubscriptionStatus()}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          {[
            { id: 'overview', label: '📋 نظرة عامة' },
            { id: 'units', label: '📂 الوحدات' },
            { id: 'videos', label: '🎬 الفيديوهات' },
            { id: 'summaries', label: '📄 الملخصات' },
            { id: 'subscription', label: '💳 الاشتراك' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== تبويب نظرة عامة ===== */}
        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📋 نظرة عامة</h3>
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">👨‍🏫 عن المختص</h4>
                  <p className="text-gray-600 dark:text-gray-400">{material.instructorBio || 'لا توجد معلومات عن المختص'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">✨ مميزات المادة</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(material.featuresAr.length > 0 ? material.featuresAr : material.features).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><FaCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {feature}</li>
                    ))}
                    {material.features.length === 0 && <li className="text-gray-400 dark:text-gray-500">لا توجد مميزات</li>}
                  </ul>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">📊 إحصائيات سريعة</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg"><span className="text-sm text-gray-500 dark:text-gray-400">📚 الوحدات</span><span className="font-bold text-purple-600">{material.units?.length || 0}</span></div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg"><span className="text-sm text-gray-500 dark:text-gray-400">🎬 الفيديوهات</span><span className="font-bold text-blue-600">{videos.length}</span></div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg"><span className="text-sm text-gray-500 dark:text-gray-400">📄 الملخصات</span><span className="font-bold text-green-600">{material.summaries?.length || 0}</span></div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg"><span className="text-sm text-gray-500 dark:text-gray-400">💰 السعر</span><span className="font-bold text-amber-600">{material.price > 0 ? `${material.price} ريال` : 'مجاني'}</span></div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg"><span className="text-sm text-gray-500 dark:text-gray-400">⏱️ المدة</span><span className="font-bold text-gray-700 dark:text-gray-300">{material.duration || '-'}</span></div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg"><span className="text-sm text-gray-500 dark:text-gray-400">👨‍🏫 المختص</span><span className="font-bold text-gray-700 dark:text-gray-300">{material.instructor}</span></div>
                  {subscriptionStatus === 'active' && <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"><span className="text-sm text-green-600 dark:text-green-400">✅ الحالة</span><span className="font-bold text-green-600 dark:text-green-400">مشترك</span></div>}
                  {subscriptionStatus === 'pending' && <div className="flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"><span className="text-sm text-yellow-600 dark:text-yellow-400">⏳ الحالة</span><span className="font-bold text-yellow-600 dark:text-yellow-400">قيد المراجعة</span></div>}
                </div>
              </div>
            </div>
            {subscription && subscriptionStatus !== 'none' && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">📋 تفاصيل الاشتراك</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <span className="text-gray-500 dark:text-gray-400">الحالة</span>
                    <p className={`font-semibold ${subscription.status === 'active' ? 'text-green-600' : subscription.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {subscription.status === 'active' ? '✅ نشط' : subscription.status === 'pending' ? '⏳ قيد المراجعة' : subscription.status === 'expired' ? '❌ منتهي' : '🚫 ملغي'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <span className="text-gray-500 dark:text-gray-400">تاريخ البدء</span>
                    <p className="font-semibold text-gray-900 dark:text-white">{new Date(subscription.startDate).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <span className="text-gray-500 dark:text-gray-400">تاريخ الانتهاء</span>
                    <p className="font-semibold text-gray-900 dark:text-white">{new Date(subscription.endDate).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <span className="text-gray-500 dark:text-gray-400">طريقة الدفع</span>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {subscription.paymentMethod === 'credit_card' ? '💳 بطاقة ائتمان' :
                       subscription.paymentMethod === 'mada' ? '💳 مدى' :
                       subscription.paymentMethod === 'bank_transfer' ? '🏦 تحويل بنكي' :
                       subscription.paymentMethod === 'free' ? '🎁 مجاني' : '📝 يدوي'}
                    </p>
                  </div>
                </div>
                {subscription.status === 'pending' && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                      <FaClock className="w-4 h-4" /> ⏳ الاشتراك قيد المراجعة. سيتم تفعيله بعد موافقة المدير على إثبات الدفع.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== تبويب الوحدات ===== */}
        {activeTab === 'units' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📂 الوحدات الدراسية</h3>
            {material.units && material.units.length > 0 ? (
              <div className="space-y-4">
                {material.units.map((unit, index) => (
                  <div key={unit._id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" data-aos="fade-up" data-aos-delay={index * 50}>
                    <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">{index + 1}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{unit.titleAr || unit.title}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{unit.files?.length || 0} ملفات</span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{unit.descriptionAr || unit.description || 'لا يوجد وصف للوحدة'}</p>
                      {unit.files && unit.files.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {unit.files.map((file, i) => {
                            const fileId = file.fileId || file._id;
                            if (!fileId) {
                              console.warn('⚠️ File without ID:', file);
                              return null;
                            }
                            return (
                              <button key={file._id || i} onClick={() => handleDownloadFile(fileId, file.filename, file.isEncrypted)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${file.isEncrypted && !isSubscribed ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300 cursor-pointer'}`}
                                disabled={file.isEncrypted && !isSubscribed} title={file.isEncrypted && !isSubscribed ? 'يتطلب اشتراك' : 'تحميل الملف'}>
                                {getFileIcon(file.filename)} <span>{file.filename}</span>
                                {file.isEncrypted ? <FaLock className="w-3 h-3 text-yellow-500" /> : <FaUnlock className="w-3 h-3 text-green-500" />}
                                <FaDownload className="w-3 h-3 text-gray-400" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400"><FaFolder className="w-12 h-12 mx-auto mb-4 opacity-30" /> لا توجد وحدات لهذه المادة</div>
            )}
          </div>
        )}

        {/* ===== تبويب الفيديوهات ===== */}
        {activeTab === 'videos' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🎬 فيديوهات المادة</h3>
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => {
                  const hasValidUrl = video.videoUrl && video.videoUrl.trim() !== '';
                  const isAvailable = hasValidUrl && (!video.isEncrypted || isSubscribed);
                  
                  return (
                    <div
                      key={video._id}
                      className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all ${
                        isAvailable ? 'hover:shadow-lg cursor-pointer group hover:-translate-y-1' : 'opacity-60 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (!hasValidUrl) {
                          alert('⚠️ هذا الفيديو غير متاح حالياً');
                          return;
                        }
                        if (video.isEncrypted && !isSubscribed) {
                          alert('⚠️ هذا الفيديو مشفر، يرجى الاشتراك لمشاهدته');
                          return;
                        }
                        handlePlayVideo(video);
                      }}
                      data-aos="fade-up"
                    >
                      <div className="relative bg-gray-200 dark:bg-gray-700 h-40 flex items-center justify-center">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.titleAr}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <FaVideo className="w-12 h-12 text-gray-400" />
                        )}
                        {isAvailable && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            {videoLoading && selectedVideo?._id === video._id ? (
                              <FaSpinner className="w-8 h-8 text-white animate-spin" />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:scale-110 transition">
                                <FaPlay className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                        )}
                        {video.isEncrypted && !isSubscribed && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10">
                            <FaLock className="w-3 h-3" /> مشفر
                          </div>
                        )}
                        {!hasValidUrl && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10">
                            <FaTimes className="w-3 h-3" /> غير متاح
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                          {formatDuration(video.duration)}
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {video.titleAr || video.title}
                        </h4>
                        <div className="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>👨‍🏫 {video.instructor}</span>
                          <span>{video.views || 0} مشاهدة</span>
                        </div>
                        {video.isEncrypted && !isSubscribed && (
                          <div className="mt-2 text-xs text-yellow-500">⚠️ يتطلب اشتراك</div>
                        )}
                        {!hasValidUrl && (
                          <div className="mt-2 text-xs text-red-500">⚠️ الرابط غير متاح</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FaVideo className="w-12 h-12 mx-auto mb-4 opacity-30" />
                لا توجد فيديوهات لهذه المادة
              </div>
            )}
          </div>
        )}

        {/* ===== تبويب الملخصات ===== */}
        {activeTab === 'summaries' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📄 ملخصات المادة</h3>
            {material.summaries && material.summaries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {material.summaries.map((summary, index) => {
                  const fileId = summary.fileId || summary._id;
                  if (!fileId) {
                    console.warn('⚠️ Summary without fileId:', summary);
                    return null;
                  }
                  return (
                    <div key={summary._id || index} className={`flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition group ${summary.isEncrypted && !isSubscribed ? 'opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`} data-aos="fade-up" data-aos-delay={index * 50}>
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">{getFileIcon(summary.title || 'file.pdf')}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">{summary.titleAr || summary.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          {summary.isEncrypted ? <span className="flex items-center gap-1 text-yellow-500"><FaLock className="w-3 h-3" /> مشفر</span> : <span className="flex items-center gap-1 text-green-500"><FaUnlock className="w-3 h-3" /> مفتوح</span>}
                          {summary.isEncrypted && !isSubscribed && <span className="text-xs text-yellow-500">(يتطلب اشتراك)</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDownloadFile(fileId, summary.title || 'ملخص.pdf', summary.isEncrypted)}
                        className={`p-2 rounded-lg transition ${summary.isEncrypted && !isSubscribed ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'}`}
                        disabled={summary.isEncrypted && !isSubscribed} title={summary.isEncrypted && !isSubscribed ? 'يتطلب اشتراك' : 'تحميل الملف'}>
                        <FaDownload className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400"><FaFileAlt className="w-12 h-12 mx-auto mb-4 opacity-30" /> لا توجد ملخصات لهذه المادة</div>
            )}
          </div>
        )}

        {/* ===== تبويب الاشتراك ===== */}
        {activeTab === 'subscription' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">💳 الاشتراك في المادة</h3>
            {subscriptionStatus === 'active' ? (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-4"><FaCheckCircle className="w-8 h-8 text-green-500" /><h4 className="text-xl font-bold text-green-600 dark:text-green-400">أنت مشترك في هذه المادة</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3"><span className="text-gray-500 dark:text-gray-400">تاريخ البداية</span><p className="font-semibold text-gray-900 dark:text-white">{subscription?.startDate ? new Date(subscription.startDate).toLocaleDateString('ar-SA') : '-'}</p></div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3"><span className="text-gray-500 dark:text-gray-400">تاريخ النهاية</span><p className="font-semibold text-gray-900 dark:text-white">{subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString('ar-SA') : '-'}</p></div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3"><span className="text-gray-500 dark:text-gray-400">طريقة الدفع</span><p className="font-semibold text-gray-900 dark:text-white">
                    {subscription?.paymentMethod === 'credit_card' ? '💳 بطاقة ائتمان' :
                     subscription?.paymentMethod === 'mada' ? '💳 مدى' :
                     subscription?.paymentMethod === 'bank_transfer' ? '🏦 تحويل بنكي' :
                     subscription?.paymentMethod === 'free' ? '🎁 مجاني' : '📝 يدوي'}
                  </p></div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3"><span className="text-gray-500 dark:text-gray-400">حالة الدفع</span>
                    <p className={`font-semibold ${subscription?.paymentStatus === 'paid' ? 'text-green-600' : subscription?.paymentStatus === 'pending' ? 'text-yellow-600' : subscription?.paymentStatus === 'failed' ? 'text-red-600' : 'text-gray-600'}`}>
                      {subscription?.paymentStatus === 'paid' ? '✅ تم الدفع' : subscription?.paymentStatus === 'pending' ? '⏳ قيد الانتظار' : subscription?.paymentStatus === 'failed' ? '❌ فشل الدفع' : subscription?.paymentStatus === 'refunded' ? '🔄 تم الاسترجاع' : '-'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400"><p>✅ يمكنك الآن الوصول إلى جميع محتويات المادة بما في ذلك الفيديوهات المشفرة والملفات.</p></div>
              </div>
            ) : subscriptionStatus === 'pending' ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-3 mb-4"><FaClock className="w-8 h-8 text-yellow-500" /><h4 className="text-xl font-bold text-yellow-600 dark:text-yellow-400">في انتظار الموافقة</h4></div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">تم إرسال طلب الاشتراك الخاص بك. سيتم مراجعته من قبل الإدارة وتفعيله بعد الموافقة على الدفع.</p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center text-sm"><span className="text-gray-500 dark:text-gray-400">تاريخ الطلب</span><span className="font-semibold text-gray-900 dark:text-white">{subscription?.createdAt ? new Date(subscription.createdAt).toLocaleDateString('ar-SA') : '-'}</span></div>
                  <div className="flex justify-between items-center text-sm mt-2"><span className="text-gray-500 dark:text-gray-400">المبلغ</span><span className="font-semibold text-purple-600">{subscription?.price} ريال</span></div>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto text-center">
                <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4"><FaLock className="w-8 h-8 text-purple-600 dark:text-purple-400" /></div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">اشترك الآن</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">احصل على وصول كامل إلى جميع محتويات المادة بما في ذلك الفيديوهات المشفرة والملفات.</p>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 mb-6 text-right">
                  <div className="flex justify-between items-center"><span className="text-gray-500 dark:text-gray-400">سعر الاشتراك</span><span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{material.price > 0 ? `${material.price} ريال` : 'مجاني'}</span></div>
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-500 dark:text-gray-400"><span>المدة</span><span>30 يوم</span></div>
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-500 dark:text-gray-400"><span>طريقة الدفع</span><span>بطاقة ائتمان / مدى / تحويل بنكي</span></div>
                </div>
                <button onClick={handleSubscribe} disabled={subscribing}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto">
                  {subscribing ? <FaSpinner className="animate-spin" /> : <FaLock className="w-4 h-4" />}
                  {subscribing ? 'جاري الاشتراك...' : material.price > 0 ? 'اشتراك الآن' : 'اشتراك مجاني'}
                </button>
                {subscriptionError && <p className="text-red-500 text-sm mt-2">{subscriptionError}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== مودال عرض الفيديو ===== */}
      {showVideoModal && selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => {
            // ✅ تنظيف Blob URL عند الإغلاق
            if (selectedVideo.videoUrl?.startsWith('blob:')) {
              URL.revokeObjectURL(selectedVideo.videoUrl);
            }
            setShowVideoModal(false);
            setSelectedVideo(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-md">
                {selectedVideo.titleAr || selectedVideo.title}
              </h3>
              <button
                onClick={() => {
                  if (selectedVideo.videoUrl?.startsWith('blob:')) {
                    URL.revokeObjectURL(selectedVideo.videoUrl);
                  }
                  setShowVideoModal(false);
                  setSelectedVideo(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FaTimes className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
                {selectedVideo.videoUrl ? (
                  videoLoading ? (
                    <div className="text-center text-white">
                      <FaSpinner className="w-12 h-12 animate-spin mx-auto mb-4" />
                      <p>جاري تحميل الفيديو...</p>
                    </div>
                  ) : (
                    <video
                      key={selectedVideo._id}
                      src={selectedVideo.videoUrl}
                      controls
                      className="w-full h-full"
                      autoPlay
                      controlsList="nodownload"
                      onError={(e) => {
                        console.error('❌ Video playback error:', e);
                        alert('⚠️ تعذر تشغيل الفيديو');
                      }}
                    >
                      متصفحك لا يدعم تشغيل الفيديو
                    </video>
                  )
                ) : (
                  <div className="text-center text-gray-400">
                    <FaVideo className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>لا يوجد رابط فيديو</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>👨‍🏫 {selectedVideo.instructor}</span>
                <span>⏱️ {formatDuration(selectedVideo.duration)}</span>
                {selectedVideo.isEncrypted ? (
                  <span className="flex items-center gap-1 text-yellow-500">
                    <FaLock className="w-3 h-3" /> مشفر
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-500">
                    <FaUnlock className="w-3 h-3" /> مفتوح
                  </span>
                )}
              </div>
              {selectedVideo.isEncrypted && !isSubscribed && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                    <FaLock className="w-4 h-4" />
                    هذا الفيديو مشفر، يرجى الاشتراك لمشاهدته
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== مودال الدفع ===== */}
      {renderPaymentModal()}
    </div>
  );
};

export default MaterialDetail;