// src/pages/RequestWorkspace/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

import type { TabId, TabConfig, Toast, CallType } from './types';
import { ALL_TABS } from './utils/constants';

import { useRequestData } from './hooks/useRequestData';
import { useSocket } from './hooks/useSocket';
import { useWebRTC } from './hooks/useWebRTC';
import { useRequestActions } from './hooks/useRequestActions';

import { RequestHeader } from './components/RequestHeader';
import { RequestTabs } from './components/RequestTabs';
import { OverviewTab } from './components/OverviewTab';
import { MessagesTab } from './components/MessagesTab';
import { FilesTab } from './components/FilesTab';
import { ScopeTab } from './components/ScopeTab';
import { PaymentTab } from './components/PaymentTab';
import { CallsTab } from './components/CallsTab';
import { ActivityTab } from './components/ActivityTab';
import { IncomingCallModal } from './components/IncomingCallModal';
import { ToastContainer } from './components/ToastContainer';

import './RequestWorkspace.css';

// ============================================================
// ✅ Main Component
// ============================================================
const RequestWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ============================================================
  // ✅ Shared Socket Ref — يُنشأ هنا ويُمرَّر للـ hooks
  // ============================================================
  const sharedSocketRef = useRef<Socket | null>(null);

  // ============================================================
  // ✅ Data Hook
  // ============================================================
  const {
    request,
    loading,
    error,
    refresh,
    API_URL,
    PORTAL_ID,
    token,
  } = useRequestData(id);

  // ============================================================
  // ✅ Toast helpers
  // ============================================================
  const showToast = useCallback(
    (type: Toast['type'], message: string) => {
      const toastId = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id: toastId, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 4000);
    },
    []
  );

  const closeToast = useCallback((toastId: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  // ============================================================
  // ✅ Role checks
  // ============================================================
  const isCustomer = request?.accountId?._id === user?.id;
  const isSpecialist = request?.specialistId?._id === user?.id;
  const isAdmin =
    user?.role === 'portal_admin' || user?.role === 'super_admin';
  const canEdit = isCustomer || isSpecialist || isAdmin;
  const userRole = user?.role || 'customer';

  // ============================================================
  // ✅ WebRTC Hook — يستقبل sharedSocketRef
  // ============================================================
  const {
    callState,
    incomingCall,
    setIncomingCall,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo,
    playRingtone,
    stopRingtone,
    cleanupPeerConnection,
    handleCallAccepted,
    handleCallTarget,
    handleIceCandidate,
  } = useWebRTC(id, sharedSocketRef);

  // ============================================================
  // ✅ Socket Hook — يملأ sharedSocketRef
  // ============================================================
  const { isConnected, emit } = useSocket({
    requestId: id,
    token,
    socketRef: sharedSocketRef,
    onIncomingCall: (data) => {
      console.log('📞 Setting incoming call:', data);
      playRingtone();
      setIncomingCall({
        ...data,
        show: true,   // ✅ إضافة show يدوياً
      });
    },
    onCallAccepted: handleCallAccepted,
    onCallRejected: (data) => {
      stopRingtone();
      cleanupPeerConnection();
      alert(`❌ ${data.userName || 'الطرف الآخر'} رفض المكالمة`);
    },
    onCallEnded: (data) => {
      stopRingtone();
      cleanupPeerConnection();
      if (data.userName) {
        alert(`📞 ${data.userName} أنهى المكالمة`);
      }
    },
    onIceCandidate: handleIceCandidate,
    onCallTarget: handleCallTarget,
    onCallStarted: () => {},
    onCallScheduled: () => refresh(),
    onCallCancelled: () => refresh(),
  });

  // ============================================================
  // ✅ Actions Hook
  // ============================================================
  const {
    uploadRequestFiles,
    sendMessage,
    defineScope,
    approveScope,
    submitPayment,
    verifyPayment,
    rejectPayment,
    updateStatus,
    scheduleCall,
    startScheduledCall,
    cancelCall,
    completeCall,
    viewFile,
    downloadFile,
  } = useRequestActions({
    requestId: id,
    API_URL,
    PORTAL_ID,
    token,
    showToast,
    onRefresh: refresh,
  });

  // ============================================================
  // ✅ Effects
  // ============================================================
  useEffect(() => {
    AOS.init({ duration: 600, once: true });
  }, []);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRingtone();
      cleanupPeerConnection();
    };
  }, [stopRingtone, cleanupPeerConnection]);

  // ============================================================
  // ✅ Handlers
  // ============================================================
  const handleUpdateStatus = async (status: string) => {
    if (!confirm(`تغيير الحالة إلى "${status}"؟`)) return;
    await updateStatus(status);
  };

  const handleVerifyPayment = async () => {
    if (!confirm('تأكيد الدفع؟')) return;
    await verifyPayment();
  };

  const handleRejectPayment = async () => {
    const reason = prompt('سبب الرفض:');
    if (!reason?.trim()) return;
    await rejectPayment(reason.trim());
  };

  const handleStartScheduledCall = async (
    callId: string,
    targetUserId: string,
    type: CallType
  ) => {
    const success = await startScheduledCall(callId);
    if (success) {
      await startCall(targetUserId, type);
    }
  };

  const handleCompleteCall = async (callId: string) => {
    await completeCall(callId);
    endCall();
  };

  const handleRejectIncomingCall = () => {
    if (id) {
      emit('reject-call', { requestId: id });
    }
    stopRingtone();
    setIncomingCall(null);
  };

  // ============================================================
  // ✅ Loading
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            جاري تحميل الطلب...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ Error
  // ============================================================
  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <FaExclamationTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            عذراً!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'الطلب غير موجود'}
          </p>
          <Link
            to={
              isAdmin
                ? '/admin-requests'
                : isSpecialist
                ? '/specialist-requests'
                : '/my-requests'
            }
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            العودة إلى الطلبات
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ Visible Tabs
  // ============================================================
  const visibleTabs: TabConfig[] = ALL_TABS.filter((tab) => {
    if (tab.id === 'payment') {
      return isCustomer || isAdmin;
    }
    return true;
  });

  // ============================================================
  // ✅ Render
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ToastContainer toasts={toasts} onClose={closeToast} />

      <div className="container-custom max-w-6xl">
        {/* ✅ Header */}
        <RequestHeader
          request={request}
          isAdmin={isAdmin}
          isSpecialist={isSpecialist}
          isCustomer={isCustomer}
          canEdit={canEdit}
          onUpdateStatus={handleUpdateStatus}
          onVerifyPayment={handleVerifyPayment}
          onRejectPayment={handleRejectPayment}
        />

        {/* ✅ Tabs */}
        <RequestTabs
          tabs={visibleTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* ✅ Tab Content */}
        {activeTab === 'overview' && <OverviewTab request={request} />}

        {activeTab === 'messages' && (
          <MessagesTab
            request={request}
            currentUserId={user?.id}
            onSendMessage={(msg) => sendMessage(msg, [])}
          />
        )}

        {activeTab === 'files' && (
          <FilesTab
            request={request}
            userRole={userRole}
            canEdit={canEdit}
            onUploadFiles={uploadRequestFiles}
            onViewFile={viewFile}
            onDownloadFile={downloadFile}
          />
        )}

        {activeTab === 'scope' && (
          <ScopeTab
            request={request}
            isCustomer={isCustomer}
            isSpecialist={isSpecialist}
            isAdmin={isAdmin}
            onDefineScope={defineScope}
            onApproveScope={approveScope}
          />
        )}

        {activeTab === 'payment' && (isCustomer || isAdmin) && (
          <PaymentTab
            request={request}
            isCustomer={isCustomer}
            isAdmin={isAdmin}
            onSubmitPayment={submitPayment}
            onViewFile={viewFile}
            onDownloadFile={downloadFile}
          />
        )}

        {activeTab === 'calls' && (
          <CallsTab
            request={request}
            userRole={userRole}
            isCustomer={isCustomer}
            isSpecialist={isSpecialist}
            isAdmin={isAdmin}
            callState={callState}
            onScheduleCall={scheduleCall}
            onStartCall={startCall}
            onStartScheduledCall={handleStartScheduledCall}
            onCancelCall={cancelCall}
            onCompleteCall={handleCompleteCall}
            onEndCall={endCall}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
          />
        )}

        {activeTab === 'activity' && <ActivityTab request={request} />}
      </div>
      
{/* ✅ Call UI — Overlay أثناء المكالمة */}
{callState.callStatus === 'in-progress' && (
  <div className="fixed inset-0 z-[998] bg-gradient-to-br from-gray-900 via-gray-800 to-black">
    {/* ============================================ */}
    {/* مكالمة فيديو */}
    {/* ============================================ */}
    {callState.callType === 'video' && (
      <>
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Local Video PiP */}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute bottom-24 right-4 w-32 h-24 md:w-48 md:h-36 object-cover rounded-xl border-2 border-white shadow-2xl bg-black"
        />
      </>
    )}

    {/* ============================================ */}
    {/* مكالمة صوتية */}
    {/* ============================================ */}
    {callState.callType === 'audio' && (
      <div className="w-full h-full flex flex-col items-center justify-center">
        {/* Avatar Circle */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/30 relative">
          <span className="text-6xl md:text-8xl">🎤</span>

          {/* Pulsing rings */}
          <span className="absolute inset-0 rounded-full border-4 border-purple-400/50 animate-ping" />
        </div>

        {/* Name & Status */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {isSpecialist
            ? request?.accountId?.profile?.fullName || 'العميل'
            : request?.specialistId?.profile?.fullName || 'المختص'}
        </h2>

        <p className="text-white/60 text-lg mb-8">
          {callState.isMuted ? '🔇 الصوت مكتوم' : '🔊 المكالمة جارية'}
        </p>

        {/* Audio indicators */}
        <div className="flex gap-2 mb-8">
          <span
            className="w-3 h-3 rounded-full bg-green-500 animate-pulse"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-3 h-3 rounded-full bg-green-500 animate-pulse"
            style={{ animationDelay: '200ms' }}
          />
          <span
            className="w-3 h-3 rounded-full bg-green-500 animate-pulse"
            style={{ animationDelay: '400ms' }}
          />
        </div>

        {/* Hidden videos — لتشغيل المسار الصوتي */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="hidden"
        />
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="hidden"
        />
      </div>
    )}

    {/* ============================================ */}
    {/* Controls (مشتركة) */}
    {/* ============================================ */}
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-black/60 backdrop-blur-md rounded-full px-5 py-3 border border-white/10 shadow-xl">
      <button
        onClick={toggleMute}
        className={`p-3 md:p-4 rounded-full transition-all ${
          callState.isMuted
            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
            : 'bg-white/20 hover:bg-white/30 text-white'
        }`}
        title={callState.isMuted ? 'إلغاء الكتم' : 'كتم'}
      >
        {callState.isMuted ? '🔇' : '🎤'}
      </button>

      <button
        onClick={endCall}
        className="p-3 md:p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-600/30"
        title="إنهاء المكالمة"
      >
        📞
      </button>

      {callState.callType === 'video' && (
        <button
          onClick={toggleVideo}
          className={`p-3 md:p-4 rounded-full transition-all ${
            !callState.isVideoOn
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-white/20 hover:bg-white/30 text-white'
          }`}
          title={callState.isVideoOn ? 'إيقاف الفيديو' : 'تشغيل الفيديو'}
        >
          {callState.isVideoOn ? '📹' : '📷'}
        </button>
      )}
    </div>

    {/* ============================================ */}
    {/* Info Overlay */}
    {/* ============================================ */}
    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 text-white text-sm border border-white/10">
      <span className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        {callState.callType === 'audio' ? '🎤 مكالمة صوتية' : '📹 مكالمة فيديو'}
      </span>
    </div>
  </div>
)}
      {/* ✅ Incoming Call Modal — بدون show */}
      {incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          onAccept={() => acceptCall(incomingCall)}
          onReject={handleRejectIncomingCall}
        />
      )}
    </div>
  );
};

export default RequestWorkspace;