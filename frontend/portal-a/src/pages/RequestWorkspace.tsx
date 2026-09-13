// frontend/portal-a/src/pages/RequestWorkspace.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaArrowLeft, FaFileAlt, FaUpload,
  FaCheckCircle, FaTimesCircle, FaInfoCircle,
  FaUser, FaEnvelope, FaPhone, FaCalendar,
  FaFile, FaFilePdf, FaFileWord, FaFileImage,
  FaTrash, FaPlus, FaDownload, FaEye,
  FaMoneyBill, FaCreditCard, FaWallet,
  FaClock, FaUserCheck, FaEdit, FaComments,
  FaPhoneAlt, FaVideo, FaShareAlt,
  FaClipboardList, FaTasks, FaCheckDouble,
  FaExclamationTriangle, FaShieldAlt,
  FaPaperPlane, FaReply, FaPrint, FaBookmark,
  FaList, FaClipboard, FaPhoneVolume, FaMicrophone, FaMicrophoneSlash,
} from 'react-icons/fa';

// ============================================================
// ✅ واجهات البيانات
// ============================================================

interface Request {
  _id: string;
  requestNumber: string;
  portalId: string;
  accountId: {
    _id: string;
    profile: { fullName: string };
    email: string;
    phone?: string;
  };
  serviceId: {
    _id: string;
    name: string;
    nameAr: string;
    icon?: string;
  };
  requestTypeId?: {
    _id: string;
    name: string;
    nameAr: string;
  };
  specialistId?: {
    _id: string;
    profile: { fullName: string };
    email: string;
    phone?: string;
  };
  title: string;
  description: string;
  status: 'new' | 'under_review' | 'assigned' | 'scope_definition' |
    'awaiting_approval' | 'awaiting_payment' | 'in_progress' |
    'under_review_2' | 'modification' | 'completed' | 'closed' | 'cancelled';
  paymentStatus: 'pending' | 'submitted' | 'verified' | 'rejected' | 'refunded' | 'not_required';
  scope?: {
    description: string;
    deliverables: string[];
    requirements: string[];
    estimatedDuration: string;
    price: number;
    currency: string;
    modificationsIncluded: number;
    exclusions: string[];
    approvedBy?: string;
    approvedAt?: Date;
  };
  price: number;
  currency: string;
  startDate?: Date;
  endDate?: Date;
  formData: any;
  formSchemaSnapshot: any;
  files: {
    fileId: {
      _id: string;
      originalName: string;
      size: number;
      mimeType: string;
    };
    category: 'request' | 'proof' | 'delivery' | 'modification' | 'final' | 'support';
    uploadedAt: Date;
    uploadedBy: string;
    description?: string;
  }[];
  paymentProofs: {
    fileId: {
      _id: string;
      originalName: string;
      size: number;
      mimeType: string;
    };
    filename: string;
    uploadedAt: Date;
    verified: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
    rejectionReason?: string;
  }[];
  messages: {
    _id?: string;
    senderId: { _id: string; profile: { fullName: string } };
    senderRole: string;
    message: string;
    attachments: { fileId: string; filename: string }[];
    readBy: { accountId: string; readAt: Date }[];
    createdAt: Date;
  }[];
  calls: {
    _id?: string;
    requestedBy: string;
    requestedRole: string;
    scheduledAt: Date;
    duration: number;
    purpose: string;
    notes: string;
    status: 'scheduled' | 'started' | 'completed' | 'cancelled' | 'missed';
    callUrl: string;
    recordingUrl: string;
    type?: 'audio' | 'video';
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
  }[];
  activityLog: {
    action: string;
    actorId: string;
    actorRole: string;
    oldValue: any;
    newValue: any;
    metadata: any;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// ============================================================
// ✅ واجهات حالة المكالمة
// ============================================================

interface CallState {
  isInCall: boolean;
  isCalling: boolean;
  isRinging: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  socket: Socket | null;
  isMuted: boolean;
  isVideoOn: boolean;
  callStatus: 'idle' | 'calling' | 'ringing' | 'in-progress' | 'ended';
}

interface IncomingCallData {
  show: boolean;
  callerId: string;
  callerName: string;
  callerSocketId: string;
  type: 'audio' | 'video';
  requestId: string;
  offer: any;
  isScheduled?: boolean;
  scheduledAt?: Date;
}

// ============================================================
// ✅ المكون الرئيسي
// ============================================================

const RequestWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // ===== مراجع الفيديو =====
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // ===== الحالة الأساسية =====
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'files' | 'scope' | 'payment' | 'calls' | 'activity'>('overview');

  // ===== حالة الملفات =====
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState<'request' | 'proof' | 'delivery' | 'modification' | 'final' | 'support'>('request');

  // ===== حالة الرسائل =====
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ===== حالة النطاق =====
  const [scopeData, setScopeData] = useState({
    description: '',
    deliverables: '',
    requirements: '',
    estimatedDuration: '',
    price: '',
    modificationsIncluded: '',
    exclusions: '',
  });
  const [showScopeForm, setShowScopeForm] = useState(false);

  // ===== حالة الدفع =====
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'credit_card',
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // ===== حالة المكالمات المجدولة =====
  const [showCallForm, setShowCallForm] = useState(false);
  const [callData, setCallData] = useState({
    purpose: '',
    scheduledAt: '',
    duration: 30,
    notes: '',
    type: 'video' as 'audio' | 'video',
  });
  const [callProcessing, setCallProcessing] = useState(false);

  // ===== حالة المكالمة المباشرة =====
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isCalling: false,
    isRinging: false,
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    socket: null,
    isMuted: false,
    isVideoOn: true,
    callStatus: 'idle',
  });

  // ===== حالة الإشعار =====
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);

  // ============================================================
  // ✅ الثوابت
  // ============================================================

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  // ============================================================
  // ✅ تحديد الأدوار والصلاحيات
  // ============================================================

  const isCustomer = request?.accountId?._id === user?.id;
  const isSpecialist = request?.specialistId?._id === user?.id;
  const isAdmin = user?.role === 'portal_admin' || user?.role === 'super_admin';
  const canEdit = isCustomer || isSpecialist || isAdmin;

  const allowedCategories = {
    customer: ['request', 'proof'],
    specialist: ['request', 'proof', 'delivery', 'modification'],
    admin: ['request', 'proof', 'delivery', 'modification', 'final'],
  };

  const getVisibleTabs = () => {
    const tabs = [
      { id: 'overview', label: '📋 نظرة عامة' },
      { id: 'messages', label: '💬 الرسائل' },
      { id: 'files', label: '📁 الملفات' },
      { id: 'scope', label: '📐 النطاق' },
    ];

    if (isCustomer || isAdmin) {
      tabs.push({ id: 'payment', label: '💰 الدفع' });
    }

    tabs.push({ id: 'calls', label: '📞 المكالمات' });
    tabs.push({ id: 'activity', label: '📋 سجل النشاط' });

    return tabs;
  };

  const getAvailableCategories = () => {
    if (isAdmin) return allowedCategories.admin;
    if (isSpecialist) return allowedCategories.specialist;
    return allowedCategories.customer;
  };

  // ============================================================
  // ✅ جلب بيانات الطلب
  // ============================================================

  const fetchRequest = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/requests/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      if (response.status === 404) {
        setError('الطلب غير موجود');
        return;
      }

      if (response.status === 403) {
        setError('ليس لديك صلاحية الوصول لهذا الطلب');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setRequest(data.data);
        if (data.data.scope) {
          setScopeData({
            description: data.data.scope.description || '',
            deliverables: data.data.scope.deliverables?.join('\n') || '',
            requirements: data.data.scope.requirements?.join('\n') || '',
            estimatedDuration: data.data.scope.estimatedDuration || '',
            price: data.data.scope.price?.toString() || '',
            modificationsIncluded: data.data.scope.modificationsIncluded?.toString() || '',
            exclusions: data.data.scope.exclusions?.join('\n') || '',
          });
        }
        setPaymentData(prev => ({
          ...prev,
          amount: data.data.price?.toString() || '',
        }));
      } else {
        setError(data.message || 'حدث خطأ في تحميل الطلب');
      }
    } catch (err: any) {
      console.error('❌ Fetch error:', err);
      setError(err.message || 'حدث خطأ في تحميل الطلب');
    } finally {
      setLoading(false);
    }
  }, [id, token, API_URL, PORTAL_ID]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchRequest();
  }, [fetchRequest]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [request?.messages]);

  // ============================================================
  // ✅ دوال رفع الملفات
  // ============================================================

  const uploadFile = async (file: File, category: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('portalId', PORTAL_ID);

    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'فشل رفع الملف');
    }
    return data.data.file._id;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files);
      const validFiles = fileList.filter(f => f.size <= 10 * 1024 * 1024);
      if (validFiles.length !== fileList.length) {
        alert('⚠️ بعض الملفات تتجاوز 10MB، تم تخطيها');
      }
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      alert('⚠️ يرجى اختيار ملفات للرفع');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedFileIds: string[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileId = await uploadFile(file, uploadCategory);
        uploadedFileIds.push(fileId);
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      const response = await fetch(`${API_URL}/requests/${id}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({
          fileIds: uploadedFileIds,
          category: uploadCategory,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequest();
        setSelectedFiles([]);
        alert(`✅ تم رفع ${uploadedFileIds.length} ملف بنجاح!`);
      } else {
        alert(data.message || 'حدث خطأ في رفع الملفات');
      }
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      alert(err.message || 'حدث خطأ في رفع الملفات');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // ✅ دوال معاينة وتحميل الملفات
  // ============================================================

  const handleViewFile = (fileId: string) => {
    if (!fileId) {
      alert('⚠️ لا يوجد معرف للملف');
      return;
    }
    const token = localStorage.getItem('token');
    window.open(`${API_URL}/files/${fileId}/view?token=${token}`, '_blank');
  };

  const handleDownloadFile = async (fileId: string, filename: string) => {
    if (!fileId) {
      alert('⚠️ لا يوجد معرف للملف');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/files/${fileId}/download-direct`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
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
    } catch (err: any) {
      console.error('❌ Download error:', err);
      alert(err.message || 'حدث خطأ في تحميل الملف');
    }
  };

  // ============================================================
  // ✅ دوال الرسائل
  // ============================================================

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert('⚠️ يرجى كتابة رسالة');
      return;
    }

    setSendingMessage(true);

    try {
      const response = await fetch(`${API_URL}/requests/${id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({
          message: messageText.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessageText('');
        await fetchRequest();
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        alert(data.message || 'حدث خطأ في إرسال الرسالة');
      }
    } catch (err) {
      alert('حدث خطأ في إرسال الرسالة');
    } finally {
      setSendingMessage(false);
    }
  };

  // ============================================================
  // ✅ دوال النطاق
  // ============================================================

  const handleDefineScope = async () => {
    if (!scopeData.description || !scopeData.price) {
      alert('⚠️ يرجى إدخال وصف النطاق والسعر');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/requests/${id}/scope`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({
          description: scopeData.description,
          deliverables: scopeData.deliverables.split('\n').filter(Boolean),
          requirements: scopeData.requirements.split('\n').filter(Boolean),
          estimatedDuration: scopeData.estimatedDuration,
          price: parseFloat(scopeData.price),
          modificationsIncluded: parseInt(scopeData.modificationsIncluded) || 0,
          exclusions: scopeData.exclusions.split('\n').filter(Boolean),
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequest();
        setShowScopeForm(false);
        alert('✅ تم تحديد النطاق بنجاح!');
      } else {
        alert(data.message || 'حدث خطأ في تحديد النطاق');
      }
    } catch (err) {
      alert('حدث خطأ في تحديد النطاق');
    }
  };

  const handleApproveScope = async () => {
    if (!confirm('هل أنت متأكد من اعتماد هذا النطاق؟')) return;

    try {
      const response = await fetch(`${API_URL}/requests/${id}/scope/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequest();
        alert('✅ تم اعتماد النطاق بنجاح!');
      } else {
        alert(data.message || 'حدث خطأ في اعتماد النطاق');
      }
    } catch (err) {
      alert('حدث خطأ في اعتماد النطاق');
    }
  };

  // ============================================================
  // ✅ دوال الدفع
  // ============================================================

  const handleSubmitPayment = async () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      alert('⚠️ يرجى إدخال مبلغ صحيح');
      return;
    }

    setPaymentProcessing(true);

    try {
      const response = await fetch(`${API_URL}/requests/${id}/payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({
          amount: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequest();
        setShowPaymentForm(false);
        alert(data.message || '✅ تم تقديم الدفع بنجاح!');
      } else {
        alert(data.message || 'حدث خطأ في تقديم الدفع');
      }
    } catch (err) {
      alert('حدث خطأ في تقديم الدفع');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!confirm('هل أنت متأكد من تأكيد هذا الدفع؟')) return;

    try {
      const response = await fetch(`${API_URL}/requests/${id}/payment/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ verified: true }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequest();
        alert('✅ تم تأكيد الدفع بنجاح!');
      } else {
        alert(data.message || 'حدث خطأ في تأكيد الدفع');
      }
    } catch (err) {
      alert('حدث خطأ في تأكيد الدفع');
    }
  };

  const handleRejectPayment = async () => {
    const reason = prompt('يرجى إدخال سبب رفض الدفع:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('⚠️ سبب الرفض مطلوب');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/requests/${id}/payment/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequest();
        alert('✅ تم رفض الدفع بنجاح!');
      } else {
        alert(data.message || 'حدث خطأ في رفض الدفع');
      }
    } catch (err) {
      alert('حدث خطأ في رفض الدفع');
    }
  };

  // ============================================================
  // ✅ دوال المكالمات المباشرة (WebRTC)
  // ============================================================

  // ===== تشغيل وإيقاف صوت التنبيه =====
  const playRingtone = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      gainNode.gain.value = 0.3;

      oscillator.start();

      let count = 0;
      const interval = setInterval(() => {
        gainNode.gain.value = gainNode.gain.value === 0.3 ? 0 : 0.3;
        count++;
        if (count > 10) {
          clearInterval(interval);
        }
      }, 500);

      const ringtoneData = { oscillator, gainNode, interval, audioContext };
      (window as any).ringtoneData = ringtoneData;
      return ringtoneData;
    } catch (error) {
      console.error('❌ Failed to play ringtone:', error);
      return null;
    }
  };

  const stopRingtone = () => {
    try {
      const ringtoneData = (window as any).ringtoneData;
      if (ringtoneData) {
        if (ringtoneData.interval) clearInterval(ringtoneData.interval);
        if (ringtoneData.oscillator) ringtoneData.oscillator.stop();
        if (ringtoneData.audioContext) ringtoneData.audioContext.close();
        (window as any).ringtoneData = null;
      }
    } catch (error) {
      console.error('❌ Failed to stop ringtone:', error);
    }
  };

  // ===== تهيئة Socket.IO =====
  const initSocket = useCallback(() => {
    if (!token) return null;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      socket.emit('join-request', id);
      console.log(`📌 Joined request room: request-${id}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIncomingCall(null);
    });

    // ===== استقبال المكالمة الواردة =====
    socket.on('incoming-call', (data) => {
      console.log('📞📞📞 INCOMING CALL RECEIVED:', data);
      console.log('  - Caller:', data.callerName);
      console.log('  - Type:', data.type || 'video');

      const ringtone = playRingtone();

      setIncomingCall({
        show: true,
        callerId: data.callerId,
        callerName: data.callerName,
        callerSocketId: data.callerSocketId,
        type: data.type || 'video',
        requestId: data.requestId,
        offer: data.offer,
        isScheduled: data.isScheduled || false,
        scheduledAt: data.scheduledAt,
      });

      setCallState(prev => ({
        ...prev,
        isRinging: true,
        callStatus: 'ringing',
      }));

      if (ringtone) {
        (window as any).ringtone = ringtone;
      }
    });

    // ===== تم قبول المكالمة =====
    socket.on('call-accepted', async (data) => {
      console.log('📞 Call accepted by:', data.calleeName);
      setCallState(prev => ({ ...prev, isRinging: false, callStatus: 'in-progress' }));
      setIncomingCall(null);
      stopRingtone();

      if (callState.peerConnection) {
        await callState.peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    });

    // ===== تم رفض المكالمة =====
    socket.on('call-rejected', (data) => {
      console.log('📞 Call rejected by:', data.userName);
      setCallState(prev => ({
        ...prev,
        isCalling: false,
        isRinging: false,
        callStatus: 'idle',
      }));
      setIncomingCall(null);
      stopRingtone();
      alert(`❌ ${data.userName} رفض المكالمة`);
    });

    // ===== إنهاء المكالمة من الطرف الآخر =====
    socket.on('call-ended', (data) => {
      console.log('📞 Call ended by:', data.userName);
      setIncomingCall(null);
      stopRingtone();
      alert(`📞 ${data.userName} أنهى المكالمة`);
      endCall();
    });

    // ===== بدء المكالمة =====
    socket.on('call-started', (data) => {
      console.log('📞 Call started by:', data.startedByName);
      console.log('  - Type:', data.type);
    });

    // ===== مرشحات ICE =====
    socket.on('ice-candidate', async (data) => {
      if (callState.peerConnection) {
        try {
          await callState.peerConnection.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (error) {
          console.error('❌ Error adding ICE candidate:', error);
        }
      }
    });

    socket.on('user-connected', (data) => {
      console.log(`👤 User connected: ${data.userName}`);
    });

    return socket;
  }, [token, id]);

  // ===== WebRTC: إنشاء اتصال =====
  const createPeerConnection = useCallback(async () => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);

    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => {
        pc.addTrack(track, callState.localStream!);
      });
    }

    pc.ontrack = (event) => {
      console.log('📺 Remote track received');
      setCallState(prev => ({
        ...prev,
        remoteStream: event.streams[0],
      }));

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        callState.socket?.emit('ice-candidate', {
          requestId: id,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🔗 ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        endCall();
      }
    };

    return pc;
  }, [callState.localStream, callState.socket, id]);

  // ===== بدء مكالمة =====
  const startCall = async (targetUserId: string, callType: 'audio' | 'video' = 'video') => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === 'video' ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        } : false,
      };

      console.log(`📹 Starting ${callType} call`);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      setCallState(prev => ({
        ...prev,
        localStream: stream,
        isCalling: true,
        callStatus: 'calling',
      }));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        if (callType === 'audio') {
          localVideoRef.current.style.display = 'none';
        } else {
          localVideoRef.current.style.display = 'block';
        }
      }

      const pc = await createPeerConnection();
      setCallState(prev => ({ ...prev, peerConnection: pc }));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      callState.socket?.emit('call-user', {
        requestId: id,
        targetUserId,
        offer: pc.localDescription,
        type: callType,
      });

      setCallState(prev => ({ ...prev, callStatus: 'ringing' }));
    } catch (error: any) {
      console.error('❌ Failed to start call:', error);
      let errorMessage = 'تعذر الوصول إلى الميكروفون/الكاميرا.';
      if (callType === 'audio') {
        errorMessage = 'تعذر الوصول إلى الميكروفون. يرجى التحقق من الأذونات.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'تم رفض الوصول إلى الميكروفون/الكاميرا. يرجى منح الأذونات.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'لم يتم العثور على ميكروفون/كاميرا. يرجى توصيل الأجهزة.';
      }
      alert(errorMessage);
      setCallState(prev => ({ ...prev, isCalling: false, callStatus: 'idle' }));
    }
  };

  // ===== قبول مكالمة =====
  const acceptCall = async (data: any) => {
    try {
      stopRingtone();

      const callType = data.type || 'video';
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === 'video' ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        } : false,
      };

      console.log(`📹 Accepting ${callType} call`);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      setCallState(prev => ({
        ...prev,
        localStream: stream,
        isInCall: true,
        callStatus: 'in-progress',
      }));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        if (callType === 'audio') {
          localVideoRef.current.style.display = 'none';
        } else {
          localVideoRef.current.style.display = 'block';
        }
      }

      const pc = await createPeerConnection();
      setCallState(prev => ({ ...prev, peerConnection: pc }));

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      callState.socket?.emit('accept-call', {
        requestId: id,
        answer: pc.localDescription,
      });

      setCallState(prev => ({
        ...prev,
        isRinging: false,
        isInCall: true,
        callStatus: 'in-progress',
      }));

      setIncomingCall(null);
    } catch (error: any) {
      console.error('❌ Failed to accept call:', error);
      let errorMessage = 'تعذر الوصول إلى الميكروفون/الكاميرا.';
      if (data.type === 'audio') {
        errorMessage = 'تعذر الوصول إلى الميكروفون. يرجى التحقق من الأذونات.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'تم رفض الوصول إلى الميكروفون/الكاميرا. يرجى منح الأذونات.';
      }
      alert(errorMessage);
      endCall();
    }
  };

  // ===== إنهاء المكالمة =====
  const endCall = () => {
    callState.socket?.emit('end-call', { requestId: id });
    stopRingtone();

    if (callState.peerConnection) {
      callState.peerConnection.close();
    }

    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }

    if (callState.remoteStream) {
      callState.remoteStream.getTracks().forEach(track => track.stop());
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      localVideoRef.current.style.display = 'block';
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setCallState({
      isInCall: false,
      isCalling: false,
      isRinging: false,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      socket: callState.socket,
      isMuted: false,
      isVideoOn: true,
      callStatus: 'idle',
    });
    setIncomingCall(null);
  };

  // ===== كتم/رفع كتم الصوت =====
  const toggleMute = () => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
      }
    }
  };

  // ===== إيقاف/تشغيل الفيديو =====
  const toggleVideo = () => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoOn: !prev.isVideoOn }));
      }
    }
  };

  // ============================================================
  // ✅ دوال المكالمات المجدولة
  // ============================================================

  const handleAddCall = async () => {
    if (!callData.purpose || !callData.scheduledAt || !callData.type) {
      alert('⚠️ يرجى إدخال الغرض والوقت ونوع المكالمة');
      return;
    }

    setCallProcessing(true);

    try {
      console.log('📞 Scheduling new call...');
      console.log('  - Purpose:', callData.purpose);
      console.log('  - Scheduled At:', callData.scheduledAt);
      console.log('  - Type:', callData.type);

      const response = await fetch(`${API_URL}/requests/${id}/calls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({
          purpose: callData.purpose.trim(),
          scheduledAt: new Date(callData.scheduledAt).toISOString(),
          duration: callData.duration || 30,
          notes: callData.notes?.trim() || '',
          type: callData.type,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequest();
        setShowCallForm(false);
        setCallData({
          purpose: '',
          scheduledAt: '',
          duration: 30,
          notes: '',
          type: 'video',
        });
        alert('✅ تم جدولة المكالمة بنجاح!');
      } else {
        alert(data.message || 'حدث خطأ في جدولة المكالمة');
      }
    } catch (err: any) {
      console.error('❌ Error scheduling call:', err);
      alert(err.message || 'حدث خطأ في جدولة المكالمة');
    } finally {
      setCallProcessing(false);
    }
  };

  const handleStartScheduledCall = async (callId: string | undefined) => {
    if (!callId) {
      alert('⚠️ لا يوجد معرف للمكالمة');
      return;
    }

    if (!confirm('هل أنت متأكد من بدء هذه المكالمة في الوقت المحدد؟')) {
      return;
    }

    try {
      console.log('📞 Starting scheduled call:', callId);

      const response = await fetch(`${API_URL}/requests/${id}/calls/${callId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequest();
        alert('✅ تم بدء المكالمة بنجاح!');

        const call = req?.calls?.find(c => c._id === callId);
        if (call) {
          const targetId = isSpecialist ? req.accountId?._id : req.specialistId?._id;
          if (targetId) {
            startCall(targetId, call.type || 'video');
          }
        }
      } else {
        alert(data.message || 'حدث خطأ في بدء المكالمة');
      }
    } catch (err: any) {
      console.error('❌ Error starting call:', err);
      alert(err.message || 'حدث خطأ في بدء المكالمة');
    }
  };

  const handleUpdateCallStatus = async (callId: string | undefined, status: string) => {
    if (!callId) {
      alert('⚠️ لا يوجد معرف للمكالمة');
      return;
    }

    const validStatuses = ['scheduled', 'started', 'completed', 'cancelled', 'missed'];
    if (!validStatuses.includes(status)) {
      alert(`⚠️ حالة غير صالحة. الحالات المسموحة: ${validStatuses.join(', ')}`);
      return;
    }

    const statusText = getCallStatusText(status);
    if (!confirm(`هل أنت متأكد من تغيير حالة المكالمة إلى "${statusText}"؟`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/requests/${id}/calls/${callId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequest();
        alert(`✅ تم تحديث حالة المكالمة إلى "${statusText}" بنجاح!`);
      } else {
        alert(data.message || 'حدث خطأ في تحديث حالة المكالمة');
      }
    } catch (err: any) {
      console.error('❌ Error updating call:', err);
      alert(err.message || 'حدث خطأ في تحديث حالة المكالمة');
    }
  };

  const handleCancelCall = async (callId: string | undefined) => {
    if (!callId) {
      alert('⚠️ لا يوجد معرف للمكالمة');
      return;
    }

    if (!confirm('هل أنت متأكد من إلغاء هذه المكالمة؟')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/requests/${id}/calls/${callId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequest();
        alert('✅ تم إلغاء المكالمة بنجاح!');
      } else {
        alert(data.message || 'حدث خطأ في إلغاء المكالمة');
      }
    } catch (err: any) {
      console.error('❌ Error cancelling call:', err);
      alert(err.message || 'حدث خطأ في إلغاء المكالمة');
    }
  };

  const handleCompleteCall = async (callId: string | undefined) => {
    if (!callId) {
      alert('⚠️ لا يوجد معرف للمكالمة');
      return;
    }

    if (!confirm('هل أنت متأكد من إنهاء هذه المكالمة؟')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/requests/${id}/calls/${callId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequest();
        alert('✅ تم إنهاء المكالمة بنجاح!');
        endCall();
      } else {
        alert(data.message || 'حدث خطأ في إنهاء المكالمة');
      }
    } catch (err: any) {
      console.error('❌ Error completing call:', err);
      alert(err.message || 'حدث خطأ في إنهاء المكالمة');
    }
  };

  // ============================================================
  // ✅ دوال الحالة
  // ============================================================

  const handleUpdateStatus = async (status: string) => {
    if (!confirm(`هل أنت متأكد من تغيير الحالة إلى ${getStatusText(status)}؟`)) return;

    try {
      const response = await fetch(`${API_URL}/requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequest();
        alert('✅ تم تحديث الحالة بنجاح!');
      } else {
        alert(data.message || 'حدث خطأ في تحديث الحالة');
      }
    } catch (err) {
      alert('حدث خطأ في تحديث الحالة');
    }
  };

  // ============================================================
  // ✅ دوال مساعدة
  // ============================================================

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'new': 'جديد',
      'under_review': 'قيد المراجعة',
      'assigned': 'تم الإسناد',
      'scope_definition': 'تحديد النطاق',
      'awaiting_approval': 'بانتظار الموافقة',
      'awaiting_payment': 'بانتظار الدفع',
      'in_progress': 'قيد التنفيذ',
      'under_review_2': 'مراجعة التسليم',
      'modification': 'تعديل',
      'completed': 'مكتمل',
      'closed': 'مغلق',
      'cancelled': 'ملغي',
    };
    return texts[status] || status;
  };

  const getCallStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'scheduled': 'مجدولة',
      'started': 'بدأت',
      'completed': 'مكتملة',
      'cancelled': 'ملغية',
      'missed': 'فائتة',
    };
    return texts[status] || status;
  };

  const getCallStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'started': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'missed': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getCallStatusIcon = (status: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'scheduled': <FaClock className="w-3 h-3" />,
      'started': <FaPhoneAlt className="w-3 h-3" />,
      'completed': <FaCheckCircle className="w-3 h-3" />,
      'cancelled': <FaTimesCircle className="w-3 h-3" />,
      'missed': <FaTimesCircle className="w-3 h-3" />,
    };
    return icons[status] || <FaClock className="w-3 h-3" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-500',
      'under_review': 'bg-yellow-500',
      'assigned': 'bg-purple-500',
      'scope_definition': 'bg-indigo-500',
      'awaiting_approval': 'bg-orange-500',
      'awaiting_payment': 'bg-pink-500',
      'in_progress': 'bg-blue-500',
      'under_review_2': 'bg-yellow-500',
      'modification': 'bg-red-500',
      'completed': 'bg-green-500',
      'closed': 'bg-gray-500',
      'cancelled': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FaFile className="text-gray-500 w-5 h-5" />;
    if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500 w-5 h-5" />;
    if (mimeType.includes('word')) return <FaFileWord className="text-blue-500 w-5 h-5" />;
    if (mimeType.includes('image')) return <FaFileImage className="text-purple-500 w-5 h-5" />;
    if (mimeType.includes('excel')) return <FaFile className="text-green-500 w-5 h-5" />;
    return <FaFile className="text-gray-500 w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatDateTime = (date: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ساعة`;
    return `${hours} ساعة و ${mins} دقيقة`;
  };

  const getUserName = (account: any) => {
    if (!account) return 'مستخدم';
    if (typeof account === 'object') {
      if (account.profile?.fullName) return account.profile.fullName;
      if (account.fullName) return account.fullName;
      if (account.email) return account.email;
    }
    return 'مستخدم';
  };

  const getUserRole = (role: string) => {
    const roles: Record<string, string> = {
      'customer': 'عميل',
      'specialist': 'مختص',
      'portal_admin': 'مدير',
      'super_admin': 'مشرف',
    };
    return roles[role] || role;
  };

  const getAvailableStatuses = (currentStatus: string) => {
    const flow: Record<string, string[]> = {
      'new': ['under_review', 'cancelled'],
      'under_review': ['assigned', 'cancelled'],
      'assigned': ['scope_definition', 'cancelled'],
      'scope_definition': ['awaiting_approval', 'cancelled'],
      'awaiting_approval': ['awaiting_payment', 'modification', 'cancelled'],
      'awaiting_payment': ['in_progress', 'cancelled'],
      'in_progress': ['under_review_2', 'completed', 'cancelled'],
      'under_review_2': ['modification', 'completed', 'cancelled'],
      'modification': ['in_progress', 'completed', 'cancelled'],
      'completed': ['closed'],
      'closed': [],
      'cancelled': [],
    };
    return flow[currentStatus] || [];
  };

  const getActionText = (action: string) => {
    const actions: Record<string, string> = {
      'request_created': 'أنشأ الطلب',
      'request_updated': 'حدث الطلب',
      'status_changed': 'غير الحالة',
      'specialist_assigned': 'أسند المختص',
      'scope_defined': 'حدد النطاق',
      'scope_approved': 'وافق على النطاق',
      'payment_submitted': 'قدم الدفع',
      'payment_verified': 'أكد الدفع',
      'payment_rejected': 'رفض الدفع',
      'work_delivered': 'سلم العمل',
      'modification_requested': 'طلب تعديل',
      'request_completed': 'أكمل الطلب',
      'request_closed': 'أغلق الطلب',
      'deleted': 'حذف الطلب',
      'file_uploaded': 'رفع ملف',
      'message_sent': 'أرسل رسالة',
      'call_scheduled': 'جدول مكالمة',
      'call_started': 'بدأ المكالمة',
      'call_completed': 'أكمل مكالمة',
      'call_updated': 'حدث المكالمة',
      'call_cancelled': 'ألغى المكالمة',
    };
    return actions[action] || action;
  };

  // ============================================================
  // ✅ تهيئة Socket عند تحميل المكون
  // ============================================================

  useEffect(() => {
    const socket = initSocket();
    setCallState(prev => ({ ...prev, socket }));

    return () => {
      if (socket) {
        socket.disconnect();
      }
      endCall();
      stopRingtone();
    };
  }, [initSocket]);

  // ============================================================
  // ✅ عرض حالة التحميل
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الطلب...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <FaExclamationTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">عذراً!</h2>
          <p className="text-gray-600 dark:text-gray-400">{error || 'الطلب غير موجود'}</p>
          <Link
            to={isAdmin ? "/admin-requests" : isSpecialist ? "/specialist-requests" : "/my-requests"}
            className="mt-6 inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            العودة إلى الطلبات
          </Link>
        </div>
      </div>
    );
  }

  const req = request;
  const visibleTabs = getVisibleTabs();
  const availableCategories = getAvailableCategories();

  // ============================================================
  // ✅ التصيير الرئيسي
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom max-w-6xl">
        {/* ===== Header ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                to={isAdmin ? "/admin-requests" : isSpecialist ? "/specialist-requests" : "/my-requests"}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FaArrowLeft className="w-5 h-5 text-gray-500" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {req.formData?.title || req.title || 'طلب'}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    #{req.requestNumber || req._id.slice(-8)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(req.status)}`}>
                    {getStatusText(req.status)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    req.paymentStatus === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    req.paymentStatus === 'submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    req.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    req.paymentStatus === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {req.paymentStatus === 'verified' ? '✅ مدفوع' :
                     req.paymentStatus === 'submitted' ? '📤 تم الإرسال' :
                     req.paymentStatus === 'pending' ? '⏳ قيد الانتظار' :
                     req.paymentStatus === 'rejected' ? '❌ مرفوض' : 'غير مطلوب'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {getAvailableStatuses(req.status).length > 0 && canEdit && (
                <div className="relative group">
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2">
                    <FaEdit className="w-4 h-4" />
                    تغيير الحالة
                  </button>
                  <div className="absolute left-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[200px] hidden group-hover:block z-20">
                    {getAvailableStatuses(req.status).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(status)}
                        className="w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
                      >
                        {getStatusText(status)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isSpecialist && req.status === 'new' && (
                <button
                  onClick={() => handleUpdateStatus('assigned')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <FaUserCheck className="w-4 h-4" />
                  قبول الطلب
                </button>
              )}

              {isAdmin && req.paymentStatus === 'submitted' && (
                <button
                  onClick={handleVerifyPayment}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <FaCheckCircle className="w-4 h-4" />
                  تأكيد الدفع
                </button>
              )}

              {isAdmin && req.paymentStatus === 'submitted' && (
                <button
                  onClick={handleRejectPayment}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <FaTimesCircle className="w-4 h-4" />
                  رفض الدفع
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">العميل</p>
              <p className="font-medium text-gray-900 dark:text-white">{getUserName(req.accountId)}</p>
              <p className="text-xs text-gray-400">{req.accountId?.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">الخدمة</p>
              <p className="font-medium text-gray-900 dark:text-white">{req.serviceId?.nameAr || req.serviceId?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">المختص</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {req.specialistId ? getUserName(req.specialistId) : 'لم يتم إسناده بعد'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ الإنشاء</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(req.createdAt).toLocaleDateString('ar-SA')}
              </p>
            </div>
          </div>
        </div>

        {/* ===== Tabs ===== */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ============================================================
            تبويب نظرة عامة
            ============================================================ */}
        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">📝 وصف الطلب</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {req.formData?.description || req.description || 'لا يوجد وصف'}
                  </p>
                </div>

                {req.scope && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">📐 نطاق العمل</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-3">
                      <p className="text-gray-600 dark:text-gray-400">{req.scope.description}</p>
                      {req.scope.deliverables && req.scope.deliverables.length > 0 && (
                        <div>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">المخرجات:</p>
                          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                            {req.scope.deliverables.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">المدة:</span>
                          <span className="font-semibold text-gray-900 dark:text-white mr-2">{req.scope.estimatedDuration || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">السعر:</span>
                          <span className="font-semibold text-purple-600 mr-2">{req.scope.price} ريال</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">📊 معلومات سريعة</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-500 dark:text-gray-400">📂 الملفات</span>
                    <span className="font-bold text-gray-900 dark:text-white">{req.files?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-500 dark:text-gray-400">💬 الرسائل</span>
                    <span className="font-bold text-gray-900 dark:text-white">{req.messages?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-500 dark:text-gray-400">💰 الدفع</span>
                    <span className={`font-bold ${req.paymentStatus === 'verified' ? 'text-green-600' : req.paymentStatus === 'submitted' ? 'text-blue-600' : req.paymentStatus === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {req.paymentStatus === 'verified' ? 'مدفوع' :
                       req.paymentStatus === 'submitted' ? 'تم الإرسال' :
                       req.paymentStatus === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-500 dark:text-gray-400">💳 إثباتات الدفع</span>
                    <span className="font-bold text-gray-900 dark:text-white">{req.paymentProofs?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-500 dark:text-gray-400">📞 المكالمات</span>
                    <span className="font-bold text-gray-900 dark:text-white">{req.calls?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            تبويب الرسائل
            ============================================================ */}
        {activeTab === 'messages' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">💬 الرسائل</h3>

            <div className="space-y-4 max-h-96 overflow-y-auto mb-4 p-2">
              {req.messages && req.messages.length > 0 ? (
                req.messages.map((msg, index) => {
                  const isOwn = msg.senderId?._id === user?.id;
                  return (
                    <div key={index} className={`flex ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <div className={`max-w-[75%] ${isOwn ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-700'} rounded-lg p-3`}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {getUserName(msg.senderId)}
                          </span>
                          <span className="text-xs text-gray-400">{getUserRole(msg.senderRole)}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.createdAt).toLocaleTimeString('ar-SA')}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 break-words">{msg.message}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {msg.attachments.map((att, i) => (
                              <span key={i} className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">📎 {att.filename}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FaComments className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>لا توجد رسائل</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                placeholder="اكتب رسالة..."
                disabled={sendingMessage}
              />
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageText.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {sendingMessage ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                إرسال
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            تبويب الملفات
            ============================================================ */}
        {activeTab === 'files' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📁 الملفات</h3>

            {canEdit && (
              <div className="mb-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                <div className="flex flex-wrap gap-2 mb-3">
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'request' && '📄 مرفقات الطلب'}
                        {cat === 'proof' && '💳 إثبات الدفع'}
                        {cat === 'delivery' && '📦 تسليم العمل'}
                        {cat === 'modification' && '✏️ تعديلات'}
                        {cat === 'final' && '🏁 نهائي'}
                        {cat === 'support' && '🆘 دعم'}
                      </option>
                    ))}
                  </select>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                  >
                    <FaPlus className="inline ml-1" /> اختيار ملفات
                  </button>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.name}</p>
                            <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(index)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleUploadFiles}
                      disabled={uploading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                      {uploading ? `جاري الرفع ${Math.round(uploadProgress)}%` : 'رفع الملفات'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {req.files && req.files.filter(f => f.category === 'request').length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">📄 مرفقات الطلب</h4>
                  <div className="space-y-2">
                    {req.files.filter(f => f.category === 'request').map((file, index) => (
                      <FileItem
                        key={index}
                        file={file}
                        onDownload={handleDownloadFile}
                        onView={handleViewFile}
                        API_URL={API_URL}
                      />
                    ))}
                  </div>
                </div>
              )}

              {req.paymentProofs && req.paymentProofs.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">💳 إثباتات الدفع</h4>
                  <div className="space-y-2">
                    {req.paymentProofs.map((proof, index) => (
                      <PaymentProofItem
                        key={index}
                        proof={proof}
                        onDownload={handleDownloadFile}
                        onView={handleViewFile}
                        API_URL={API_URL}
                      />
                    ))}
                  </div>
                </div>
              )}

              {req.files && req.files.filter(f => f.category === 'delivery').length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">📦 ملفات التسليم</h4>
                  <div className="space-y-2">
                    {req.files.filter(f => f.category === 'delivery').map((file, index) => (
                      <FileItem
                        key={index}
                        file={file}
                        onDownload={handleDownloadFile}
                        onView={handleViewFile}
                        API_URL={API_URL}
                      />
                    ))}
                  </div>
                </div>
              )}

              {req.files && req.files.filter(f => f.category === 'modification').length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">✏️ ملفات التعديلات</h4>
                  <div className="space-y-2">
                    {req.files.filter(f => f.category === 'modification').map((file, index) => (
                      <FileItem
                        key={index}
                        file={file}
                        onDownload={handleDownloadFile}
                        onView={handleViewFile}
                        API_URL={API_URL}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(!req.files || req.files.length === 0) && (!req.paymentProofs || req.paymentProofs.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FaFile className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>لا توجد ملفات</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            تبويب النطاق
            ============================================================ */}
        {activeTab === 'scope' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📐 نطاق العمل</h3>

            {req.scope ? (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                  <p className="text-gray-600 dark:text-gray-400">{req.scope.description}</p>
                </div>
                {req.scope.deliverables && req.scope.deliverables.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">المخرجات</h4>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                      {req.scope.deliverables.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <span className="text-gray-500 dark:text-gray-400">المدة</span>
                    <p className="font-semibold text-gray-900 dark:text-white">{req.scope.estimatedDuration || '-'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <span className="text-gray-500 dark:text-gray-400">السعر</span>
                    <p className="font-semibold text-purple-600">{req.scope.price} ريال</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <span className="text-gray-500 dark:text-gray-400">التعديلات المشمولة</span>
                    <p className="font-semibold text-gray-900 dark:text-white">{req.scope.modificationsIncluded || 0}</p>
                  </div>
                </div>
                {req.scope.approvedAt ? (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <p className="text-green-700 dark:text-green-400">✅ تم اعتماد النطاق في {new Date(req.scope.approvedAt).toLocaleDateString('ar-SA')}</p>
                  </div>
                ) : (
                  <div className="flex gap-3 flex-wrap">
                    {isCustomer && req.status === 'awaiting_approval' && (
                      <button
                        onClick={handleApproveScope}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                      >
                        <FaCheckCircle className="w-4 h-4" />
                        اعتماد النطاق
                      </button>
                    )}
                    {(isSpecialist || isAdmin) && (
                      <button
                        onClick={() => setShowScopeForm(!showScopeForm)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        {req.scope ? <FaEdit className="w-4 h-4" /> : <FaPlus className="w-4 h-4" />}
                        {req.scope ? 'تعديل النطاق' : 'تحديد النطاق'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {(isSpecialist || isAdmin) ? (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">لم يتم تحديد نطاق العمل بعد</p>
                    {showScopeForm ? (
                      <ScopeForm
                        scopeData={scopeData}
                        setScopeData={setScopeData}
                        onSave={handleDefineScope}
                        onCancel={() => setShowScopeForm(false)}
                      />
                    ) : (
                      <button
                        onClick={() => setShowScopeForm(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                      >
                        <FaPlus className="w-4 h-4" />
                        تحديد النطاق
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>في انتظار تحديد نطاق العمل من قبل المختص</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            تبويب الدفع
            ============================================================ */}
        {activeTab === 'payment' && (isCustomer || isAdmin) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">💰 الدفع</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">المبلغ</span>
                    <span className="font-bold text-2xl text-purple-600">{req.price || 0} ريال</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">العملة</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{req.currency || 'SAR'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">الحالة</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      req.paymentStatus === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      req.paymentStatus === 'submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      req.paymentStatus === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      req.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {req.paymentStatus === 'verified' ? '✅ مدفوع' :
                       req.paymentStatus === 'submitted' ? '📤 تم الإرسال' :
                       req.paymentStatus === 'rejected' ? '❌ مرفوض' :
                       req.paymentStatus === 'pending' ? '⏳ قيد الانتظار' : 'غير مطلوب'}
                    </span>
                  </div>
                </div>

                {req.paymentStatus === 'verified' && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 text-center mt-4">
                    <FaCheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 dark:text-green-400">✅ تم دفع المبلغ بالكامل</p>
                  </div>
                )}

                {req.paymentStatus === 'rejected' && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800 text-center mt-4">
                    <FaTimesCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-700 dark:text-red-400">❌ تم رفض الدفع</p>
                    {req.paymentProofs && req.paymentProofs.some(p => p.rejectionReason) && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        سبب الرفض: {req.paymentProofs.find(p => p.rejectionReason)?.rejectionReason}
                      </p>
                    )}
                  </div>
                )}

                {isCustomer && req.paymentStatus === 'pending' && req.status === 'awaiting_payment' && (
                  <PaymentForm
                    showPaymentForm={showPaymentForm}
                    setShowPaymentForm={setShowPaymentForm}
                    paymentData={paymentData}
                    setPaymentData={setPaymentData}
                    onSubmit={handleSubmitPayment}
                    paymentProcessing={paymentProcessing}
                  />
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">💳 إثباتات الدفع</h4>
                {req.paymentProofs && req.paymentProofs.length > 0 ? (
                  <div className="space-y-2">
                    {req.paymentProofs.map((proof, index) => (
                      <PaymentProofItem
                        key={index}
                        proof={proof}
                        onDownload={handleDownloadFile}
                        onView={handleViewFile}
                        API_URL={API_URL}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaFile className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>لا توجد إثباتات دفع</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            ✅ ✅ تبويب المكالمات (Calls) - الكامل
            ============================================================ */}
        {activeTab === 'calls' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaPhoneAlt className="text-purple-600" />
              📞 المكالمات
              {req.calls && req.calls.length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({req.calls.length} مكالمة)
                </span>
              )}
            </h3>

            {/* ✅ المكالمة المباشرة - للمختص فقط */}
            {isSpecialist && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <FaPhoneAlt className="text-green-600" />
                  مكالمة مباشرة (للمختص فقط)
                </h4>

                <div className="flex flex-wrap gap-3">
                  {callState.callStatus === 'idle' && (
                    <button
                      onClick={() => {
                        const targetId = req.accountId?._id;
                        if (targetId) {
                          startCall(targetId, 'video');
                        } else {
                          alert('⚠️ لا يوجد طرف آخر للاتصال به');
                        }
                      }}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <FaPhoneAlt className="w-4 h-4" />
                      بدء مكالمة مباشرة
                    </button>
                  )}

                  {callState.callStatus === 'calling' && (
                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                      <FaSpinner className="w-5 h-5 animate-spin" />
                      <span>جاري الاتصال...</span>
                    </div>
                  )}

                  {callState.callStatus === 'ringing' && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <FaSpinner className="w-5 h-5 animate-spin" />
                      <span>يرن...</span>
                    </div>
                  )}

                  {callState.callStatus === 'in-progress' && (
                    <>
                      <button
                        onClick={endCall}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition flex items-center gap-2"
                      >
                        <FaTimesCircle className="w-4 h-4" />
                        إنهاء المكالمة
                      </button>
                      <button
                        onClick={toggleMute}
                        className={`px-4 py-3 rounded-xl font-bold transition flex items-center gap-2 ${
                          callState.isMuted 
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {callState.isMuted ? <FaMicrophoneSlash className="w-4 h-4" /> : <FaMicrophone className="w-4 h-4" />}
                        {callState.isMuted ? 'كتم' : 'صوت'}
                      </button>
                      <button
                        onClick={toggleVideo}
                        className={`px-4 py-3 rounded-xl font-bold transition flex items-center gap-2 ${
                          !callState.isVideoOn 
                            ? 'bg-red-600 text-white hover:bg-red-700' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {callState.isVideoOn ? <FaVideo className="w-4 h-4" /> : <FaVideo className="w-4 h-4" />}
                        {callState.isVideoOn ? 'فيديو' : 'إيقاف الفيديو'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ✅ عرض الفيديو للمكالمة النشطة */}
            {callState.callStatus === 'in-progress' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                    أنت {callState.isMuted && '🔇'}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                    {isSpecialist 
                      ? req.accountId?.profile?.fullName || 'العميل'
                      : req.specialistId?.profile?.fullName || 'المختص'}
                  </p>
                </div>
              </div>
            )}

            {/* ===== خط فاصل ===== */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

            {/* ✅ المكالمات المجدولة */}
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <FaCalendar className="text-purple-600" />
              المكالمات المجدولة
            </h4>

            {/* ✅ نموذج جدولة مكالمة جديدة (للعميل فقط) */}
            {isCustomer && (
              <div className="mb-6">
                {showCallForm ? (
                  <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        الغرض من المكالمة *
                      </label>
                      <input
                        type="text"
                        value={callData.purpose}
                        onChange={(e) => setCallData({ ...callData, purpose: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        placeholder="الغرض من المكالمة..."
                        disabled={callProcessing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        نوع المكالمة *
                      </label>
                      <select
                        value={callData.type || 'video'}
                        onChange={(e) => setCallData({ ...callData, type: e.target.value as 'audio' | 'video' })}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        disabled={callProcessing}
                      >
                        <option value="video">📹 مكالمة فيديو</option>
                        <option value="audio">🎤 مكالمة صوتية</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        التاريخ والوقت *
                      </label>
                      <input
                        type="datetime-local"
                        value={callData.scheduledAt}
                        onChange={(e) => setCallData({ ...callData, scheduledAt: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        disabled={callProcessing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        المدة (دقائق)
                      </label>
                      <input
                        type="number"
                        value={callData.duration}
                        onChange={(e) => setCallData({ ...callData, duration: parseInt(e.target.value) || 30 })}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        min="5"
                        max="120"
                        disabled={callProcessing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ملاحظات إضافية
                      </label>
                      <textarea
                        value={callData.notes}
                        onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        placeholder="أي معلومات إضافية..."
                        disabled={callProcessing}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAddCall}
                        disabled={callProcessing || !callData.purpose || !callData.scheduledAt || !callData.type}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {callProcessing ? (
                          <FaSpinner className="animate-spin w-4 h-4" />
                        ) : (
                          <FaCalendar className="w-4 h-4" />
                        )}
                        {callProcessing ? 'جاري الجدولة...' : 'جدولة المكالمة'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCallForm(false);
                          setCallData({
                            purpose: '',
                            scheduledAt: '',
                            duration: 30,
                            notes: '',
                            type: 'video',
                          });
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        disabled={callProcessing}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCallForm(true)}
                    className="px-4 py-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition flex items-center gap-2"
                  >
                    <FaPlus className="w-4 h-4" />
                    جدولة مكالمة جديدة
                  </button>
                )}
              </div>
            )}

            {isSpecialist && !req.calls?.length && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-lg mb-4">
                <p>📅 لا توجد مكالمات مجدولة حالياً</p>
                <p className="text-sm mt-1">في انتظار جدولة مكالمة من قبل العميل</p>
              </div>
            )}

            {/* ✅ قائمة المكالمات المجدولة */}
            {req.calls && req.calls.length > 0 ? (
              <div className="space-y-4">
                {req.calls.map((call) => {
                  const isCallAudio = call.type === 'audio';
                  
                  return (
                    <div 
                      key={call._id || Math.random().toString()} 
                      className={`border rounded-lg p-4 hover:shadow-md transition ${
                        call.status === 'completed' 
                          ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                          : call.status === 'cancelled' || call.status === 'missed'
                          ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                          : call.status === 'started'
                          ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {call.purpose}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isCallAudio 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}>
                              {isCallAudio ? '🎤 صوتي' : '📹 فيديو'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${getCallStatusColor(call.status)}`}>
                              {getCallStatusIcon(call.status)}
                              {getCallStatusText(call.status)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <FaCalendar className="w-4 h-4" />
                              <span>{formatDateTime(call.scheduledAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaClock className="w-4 h-4" />
                              <span>{formatDuration(call.duration)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaUser className="w-4 h-4" />
                              <span>طلب بواسطة: {getUserRole(call.requestedRole)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isCallAudio ? <FaPhone className="w-4 h-4" /> : <FaVideo className="w-4 h-4" />}
                              <span>{isCallAudio ? 'مكالمة صوتية' : 'مكالمة فيديو'}</span>
                            </div>
                          </div>

                          {call.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              📝 {call.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {/* 🟢 المختص: بدء المكالمة المجدولة */}
                          {isSpecialist && call.status === 'scheduled' && (
                            <button
                              onClick={() => handleStartScheduledCall(call._id)}
                              className={`px-3 py-1 rounded-lg text-sm transition flex items-center gap-1 ${
                                isCallAudio
                                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400'
                              }`}
                            >
                              {isCallAudio ? <FaPhone className="w-3 h-3" /> : <FaVideo className="w-3 h-3" />}
                              بدء المكالمة
                            </button>
                          )}

                          {/* 🟡 العميل: إلغاء المكالمة */}
                          {isCustomer && call.status === 'scheduled' && (
                            <button
                              onClick={() => handleCancelCall(call._id)}
                              className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm transition flex items-center gap-1"
                            >
                              <FaTimesCircle className="w-3 h-3" />
                              إلغاء
                            </button>
                          )}

                          {/* 🔴 المختص: إنهاء المكالمة */}
                          {isSpecialist && call.status === 'started' && (
                            <button
                              onClick={() => handleCompleteCall(call._id)}
                              className="px-3 py-1 bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm transition flex items-center gap-1"
                            >
                              <FaCheckCircle className="w-3 h-3" />
                              إنهاء المكالمة
                            </button>
                          )}

                          {/* 🟢 العميل: الرد على المكالمة (إذا كانت قيد التقدم) */}
                          {isCustomer && call.status === 'started' && (
                            <button
                              onClick={() => {
                                const targetId = req.specialistId?._id;
                                if (targetId) {
                                  startCall(targetId, call.type || 'video');
                                }
                              }}
                              className="px-3 py-1 bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm transition flex items-center gap-1"
                            >
                              <FaPhoneAlt className="w-3 h-3" />
                              الرد على المكالمة
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaPhoneAlt className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>لا توجد مكالمات مجدولة</p>
                {isCustomer && (
                  <p className="text-sm mt-2">
                    يمكنك جدولة مكالمة جديدة من خلال الضغط على "جدولة مكالمة جديدة"
                  </p>
                )}
                {isSpecialist && (
                  <p className="text-sm mt-2">
                    في انتظار جدولة مكالمة من قبل العميل
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            تبويب سجل النشاط
            ============================================================ */}
        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaClock className="text-purple-600" />
              📋 سجل النشاط
            </h3>

            {req.activityLog && req.activityLog.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {req.activityLog.slice().reverse().map((log, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                      {log.action === 'request_created' ? <FaPlus className="w-4 h-4" /> :
                       log.action === 'status_changed' ? <FaEdit className="w-4 h-4" /> :
                       log.action === 'specialist_assigned' ? <FaUserCheck className="w-4 h-4" /> :
                       log.action === 'scope_defined' ? <FaClipboardList className="w-4 h-4" /> :
                       log.action === 'scope_approved' ? <FaCheckCircle className="w-4 h-4" /> :
                       log.action === 'payment_submitted' ? <FaMoneyBill className="w-4 h-4" /> :
                       log.action === 'payment_verified' ? <FaCheckCircle className="w-4 h-4" /> :
                       log.action === 'payment_rejected' ? <FaTimesCircle className="w-4 h-4" /> :
                       log.action === 'work_delivered' ? <FaTasks className="w-4 h-4" /> :
                       log.action === 'request_completed' ? <FaCheckDouble className="w-4 h-4" /> :
                       log.action === 'file_uploaded' ? <FaFile className="w-4 h-4" /> :
                       log.action === 'message_sent' ? <FaComments className="w-4 h-4" /> :
                       log.action === 'call_scheduled' ? <FaPhoneAlt className="w-4 h-4" /> :
                       log.action === 'call_started' ? <FaPhoneAlt className="w-4 h-4" /> :
                       log.action === 'call_completed' ? <FaCheckCircle className="w-4 h-4" /> :
                       log.action === 'call_updated' ? <FaEdit className="w-4 h-4" /> :
                       <FaInfoCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {log.actorId ? getUserName({ _id: log.actorId }) : 'مستخدم'}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400"> {getActionText(log.action)}</span>
                          {log.actorRole && (
                            <span className="text-xs text-gray-400 mr-2">({getUserRole(log.actorRole)})</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleString('ar-SA')}
                        </span>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {Object.entries(log.metadata).map(([key, value]) => (
                            <span key={key} className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaClock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>لا يوجد سجل نشاط</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
          ✅ ✅ إشعار المكالمة الواردة
          ============================================================ */}
      {incomingCall?.show && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center border-2 border-green-500 dark:border-green-400 animate-pulse-border">
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4 animate-ring">
              <FaPhoneAlt className="w-12 h-12 text-green-600 dark:text-green-400 animate-bounce" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              📞 مكالمة واردة
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              من: <span className="font-semibold text-purple-600 dark:text-purple-400">
                {incomingCall.callerName}
              </span>
            </p>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {incomingCall.isScheduled ? '📅 مكالمة مجدولة' : '📞 مكالمة مباشرة'}
            </p>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {incomingCall.type === 'audio' ? '🎤 مكالمة صوتية' : '📹 مكالمة فيديو'}
            </p>
            
            {incomingCall.scheduledAt && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                الوقت المحدد: {new Date(incomingCall.scheduledAt).toLocaleString('ar-SA')}
              </p>
            )}

            <div className="flex gap-4 justify-center mt-4">
              <button
                onClick={() => {
                  if (incomingCall) {
                    acceptCall(incomingCall);
                  }
                }}
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center gap-2 shadow-lg shadow-green-500/30"
              >
                <FaCheckCircle className="w-5 h-5" />
                قبول المكالمة
              </button>
              <button
                onClick={() => {
                  callState.socket?.emit('reject-call', {
                    requestId: id,
                  });
                  stopRingtone();
                  setIncomingCall(null);
                  setCallState(prev => ({
                    ...prev,
                    isRinging: false,
                    callStatus: 'idle',
                  }));
                }}
                className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition flex items-center gap-2 shadow-lg shadow-red-500/30"
              >
                <FaTimesCircle className="w-5 h-5" />
                رفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ✅ المكونات الفرعية
// ============================================================

// --- عنصر ملف ---
interface FileItemProps {
  file: any;
  onDownload: (fileId: string, filename: string) => void;
  onView: (fileId: string) => void;
  API_URL: string;
}

const FileItem: React.FC<FileItemProps> = ({ file, onDownload, onView, API_URL }) => {
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FaFile className="text-gray-500 w-5 h-5" />;
    if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500 w-5 h-5" />;
    if (mimeType.includes('word')) return <FaFileWord className="text-blue-500 w-5 h-5" />;
    if (mimeType.includes('image')) return <FaFileImage className="text-purple-500 w-5 h-5" />;
    return <FaFile className="text-gray-500 w-5 h-5" />;
  };

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
      <div className="flex items-center gap-3">
        {getFileIcon(file.fileId?.mimeType)}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
            {file.fileId?.originalName}
          </p>
          <p className="text-xs text-gray-400">
            {file.fileId?.size ? formatFileSize(file.fileId.size) : ''}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onDownload(file.fileId?._id, file.fileId?.originalName)}
          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
          title="تحميل"
        >
          <FaDownload />
        </button>
        <button
          onClick={() => onView(file.fileId?._id)}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 transition"
          title="معاينة"
        >
          <FaEye />
        </button>
      </div>
    </div>
  );
};

// --- عنصر إثبات دفع ---
interface PaymentProofItemProps {
  proof: any;
  onDownload: (fileId: string, filename: string) => void;
  onView: (fileId: string) => void;
  API_URL: string;
}

const PaymentProofItem: React.FC<PaymentProofItemProps> = ({ proof, onDownload, onView, API_URL }) => {
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FaFile className="text-gray-500 w-5 h-5" />;
    if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500 w-5 h-5" />;
    if (mimeType.includes('word')) return <FaFileWord className="text-blue-500 w-5 h-5" />;
    if (mimeType.includes('image')) return <FaFileImage className="text-purple-500 w-5 h-5" />;
    return <FaFile className="text-gray-500 w-5 h-5" />;
  };

  return (
    <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center gap-3">
        {getFileIcon(proof.fileId?.mimeType)}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
            {proof.fileId?.originalName}
          </p>
          <p className="text-xs text-gray-400">
            {proof.verified ? (
              <span className="text-green-500">✅ مؤكد</span>
            ) : proof.rejectionReason ? (
              <span className="text-red-500">❌ مرفوض: {proof.rejectionReason}</span>
            ) : (
              <span className="text-yellow-500">⏳ قيد المراجعة</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onDownload(proof.fileId?._id, proof.fileId?.originalName)}
          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
          title="تحميل"
        >
          <FaDownload />
        </button>
        <button
          onClick={() => onView(proof.fileId?._id)}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 transition"
          title="معاينة"
        >
          <FaEye />
        </button>
      </div>
    </div>
  );
};

// --- نموذج الدفع ---
interface PaymentFormProps {
  showPaymentForm: boolean;
  setShowPaymentForm: (show: boolean) => void;
  paymentData: any;
  setPaymentData: (data: any) => void;
  onSubmit: () => void;
  paymentProcessing: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  showPaymentForm,
  setShowPaymentForm,
  paymentData,
  setPaymentData,
  onSubmit,
  paymentProcessing,
}) => {
  if (!showPaymentForm) {
    return (
      <button
        onClick={() => setShowPaymentForm(true)}
        className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
      >
        <FaMoneyBill className="w-4 h-4" />
        تقديم الدفع
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">طريقة الدفع</label>
        <select
          value={paymentData.paymentMethod}
          onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
        >
          <option value="credit_card">💳 بطاقة ائتمان</option>
          <option value="mada">💳 مدى</option>
          <option value="bank_transfer">🏦 تحويل بنكي</option>
          <option value="manual">📝 دفع يدوي</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
        <input
          type="number"
          value={paymentData.amount}
          onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          placeholder="المبلغ"
          min="0"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={onSubmit}
          disabled={paymentProcessing}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {paymentProcessing ? <FaSpinner className="animate-spin" /> : <FaMoneyBill className="w-4 h-4" />}
          {paymentProcessing ? 'جاري المعالجة...' : 'تأكيد الدفع'}
        </button>
        <button
          onClick={() => setShowPaymentForm(false)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
};

// --- نموذج النطاق ---
interface ScopeFormProps {
  scopeData: any;
  setScopeData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ScopeForm: React.FC<ScopeFormProps> = ({
  scopeData,
  setScopeData,
  onSave,
  onCancel,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وصف النطاق *</label>
        <textarea
          value={scopeData.description}
          onChange={(e) => setScopeData({ ...scopeData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          placeholder="وصف تفصيلي لنطاق العمل..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المخرجات (كل سطر)</label>
        <textarea
          value={scopeData.deliverables}
          onChange={(e) => setScopeData({ ...scopeData, deliverables: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          placeholder="المخرجات المتوقعة..."
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدة المتوقعة</label>
          <input
            type="text"
            value={scopeData.estimatedDuration}
            onChange={(e) => setScopeData({ ...scopeData, estimatedDuration: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            placeholder="مثال: 5 أيام"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر *</label>
          <input
            type="number"
            value={scopeData.price}
            onChange={(e) => setScopeData({ ...scopeData, price: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            placeholder="0"
            min="0"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التعديلات المشمولة</label>
        <input
          type="number"
          value={scopeData.modificationsIncluded}
          onChange={(e) => setScopeData({ ...scopeData, modificationsIncluded: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          min="0"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاستثناءات (كل سطر)</label>
        <textarea
          value={scopeData.exclusions}
          onChange={(e) => setScopeData({ ...scopeData, exclusions: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          placeholder="ما لا يشملها العمل..."
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
        >
          <FaCheckCircle className="w-4 h-4" />
          حفظ النطاق
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
};

// ============================================================
// ✅ دوال مساعدة محلية
// ============================================================

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

export default RequestWorkspace;