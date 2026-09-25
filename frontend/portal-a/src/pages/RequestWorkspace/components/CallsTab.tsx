// src/pages/RequestWorkspace/components/CallsTab.tsx
import React, { useState } from 'react';
import {
  FaPhoneAlt,
  FaVideo,
  FaPhone,
  FaClock,
  FaCalendar,
  FaSpinner,
  FaCheckCircle,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPlus,
} from 'react-icons/fa';
import type { Request, RequestCall, CallState, CallType } from '../types';
import {
  CALL_STATUS_TEXT,
  CALL_STATUS_COLOR,
  CALL_TYPE_TEXT,
} from '../utils/constants';
import { formatDateTime, formatDuration } from '../utils/formatters';

// ============================================================
// ✅ Types
// ============================================================
interface CallFormData {
  purpose: string;
  scheduledAt: string;
  duration: number;
  notes: string;
  type: CallType;
}

interface CallsTabProps {
  request: Request;
  userRole: string;
  isCustomer: boolean;
  isSpecialist: boolean;
  isAdmin: boolean;
  callState: CallState;
  onScheduleCall: (data: CallFormData) => Promise<boolean>;
  onStartCall: (targetUserId: string, type: CallType) => void;
  onStartScheduledCall: (
    callId: string,
    targetUserId: string,
    type: CallType
  ) => Promise<void>;
  onCancelCall: (callId: string) => Promise<boolean>;
  onCompleteCall: (callId: string) => Promise<void>;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

// ============================================================
// ✅ المكوّن الرئيسي
// ============================================================
export const CallsTab: React.FC<CallsTabProps> = ({
  request,
  isCustomer,
  isSpecialist,
  isAdmin,
  callState,
  onScheduleCall,
  onStartCall,
  onStartScheduledCall,
  onCancelCall,
  onCompleteCall,
  onEndCall,
  onToggleMute,
}) => {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [callForm, setCallForm] = useState<CallFormData>({
    purpose: '',
    scheduledAt: '',
    duration: 30,
    notes: '',
    type: 'video',
  });

  // ============================================================
  // ✅ Handlers
  // ============================================================
  const handleSchedule = async () => {
    if (!callForm.purpose || !callForm.scheduledAt) {
      alert('⚠️ الغرض والوقت مطلوبان');
      return;
    }

    setProcessing(true);
    const success = await onScheduleCall(callForm);
    if (success) {
      setShowScheduleForm(false);
      setCallForm({
        purpose: '',
        scheduledAt: '',
        duration: 30,
        notes: '',
        type: 'video',
      });
    }
    setProcessing(false);
  };

  // ============================================================
  // ✅ Derived Values
  // ============================================================
  const targetUserId = isSpecialist
    ? request.accountId?._id
    : request.specialistId?._id;

  // ============================================================
  // ✅ Render
  // ============================================================
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FaPhoneAlt className="text-purple-600" />
        📞 المكالمات
        {request.calls && request.calls.length > 0 && (
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({request.calls.length} مكالمة)
          </span>
        )}
      </h3>

      {/* Direct Call Section */}
      {(isSpecialist || isAdmin) &&
        callState.callStatus === 'idle' &&
        targetUserId && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FaPhoneAlt className="text-green-600" /> مكالمة مباشرة
            </h4>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onStartCall(targetUserId, 'video')}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center gap-2"
              >
                <FaVideo /> بدء مكالمة فيديو
              </button>
              <button
                onClick={() => onStartCall(targetUserId, 'audio')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FaPhone /> بدء مكالمة صوتية
              </button>
            </div>
          </div>
        )}

      {/* Active Call Status */}
      {callState.callStatus !== 'idle' && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {callState.callStatus === 'calling' && (
                <>
                  <FaSpinner className="animate-spin text-yellow-500" />
                  <span>جاري الاتصال...</span>
                </>
              )}
              {callState.callStatus === 'ringing' && (
                <>
                  <FaSpinner className="animate-spin text-blue-500" />
                  <span>يرن...</span>
                </>
              )}
              {callState.callStatus === 'in-progress' && (
                <>
                  <FaCheckCircle className="text-green-500" />
                  <span>قيد المكالمة</span>
                </>
              )}
            </div>

            {callState.callStatus === 'in-progress' && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={onEndCall}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  إنهاء المكالمة
                </button>
                <button
                  onClick={onToggleMute}
                  className={`px-4 py-2 rounded-lg transition ${
                    callState.isMuted
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {callState.isMuted ? (
                    <FaMicrophoneSlash />
                  ) : (
                    <FaMicrophone />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule New Call */}
      {isCustomer && (
        <div className="mb-6">
          {showScheduleForm ? (
            <ScheduleForm
              formData={callForm}
              setFormData={setCallForm}
              onSave={handleSchedule}
              onCancel={() => setShowScheduleForm(false)}
              processing={processing}
            />
          ) : (
            <button
              onClick={() => setShowScheduleForm(true)}
              className="px-4 py-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition flex items-center gap-2"
            >
              <FaPlus /> جدولة مكالمة جديدة
            </button>
          )}
        </div>
      )}

      {/* Calls List Header */}
      <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        <FaCalendar className="text-purple-600" />
        المكالمات المجدولة
      </h4>

      {/* Calls List */}
      {request.calls && request.calls.length > 0 ? (
        <div className="space-y-4">
          {request.calls.map((call, index) => (
            <CallItem
              key={call._id || index}
              call={call}
              isCustomer={isCustomer}
              isSpecialist={isSpecialist}
              targetUserId={targetUserId}
              onStartScheduledCall={onStartScheduledCall}
              onCancelCall={onCancelCall}
              onCompleteCall={onCompleteCall}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FaPhoneAlt className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>لا توجد مكالمات مجدولة</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ✅ Schedule Form
// ============================================================
const ScheduleForm: React.FC<{
  formData: CallFormData;
  setFormData: (data: CallFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  processing: boolean;
}> = ({ formData, setFormData, onSave, onCancel, processing }) => (
  <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        الغرض *
      </label>
      <input
        type="text"
        value={formData.purpose}
        onChange={(e) =>
          setFormData({ ...formData, purpose: e.target.value })
        }
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none"
        disabled={processing}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        النوع *
      </label>
      <select
        value={formData.type}
        onChange={(e) =>
          setFormData({ ...formData, type: e.target.value as CallType })
        }
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none"
        disabled={processing}
      >
        <option value="video">📹 فيديو</option>
        <option value="audio">🎤 صوتي</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        التاريخ والوقت *
      </label>
      <input
        type="datetime-local"
        value={formData.scheduledAt}
        onChange={(e) =>
          setFormData({ ...formData, scheduledAt: e.target.value })
        }
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none"
        disabled={processing}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        المدة (دقائق)
      </label>
      <input
        type="number"
        value={formData.duration}
        onChange={(e) =>
          setFormData({
            ...formData,
            duration: parseInt(e.target.value) || 30,
          })
        }
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none"
        min="5"
        max="120"
        disabled={processing}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        ملاحظات
      </label>
      <textarea
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={2}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none"
        disabled={processing}
      />
    </div>

    <div className="flex gap-3">
      <button
        onClick={onSave}
        disabled={processing}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
      >
        {processing ? (
          <FaSpinner className="animate-spin" />
        ) : (
          <FaCalendar />
        )}
        {processing ? 'جاري الجدولة...' : 'جدولة'}
      </button>
      <button
        onClick={onCancel}
        disabled={processing}
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition"
      >
        إلغاء
      </button>
    </div>
  </div>
);

// ============================================================
// ✅ Call Item
// ============================================================
const CallItem: React.FC<{
  call: RequestCall;
  isCustomer: boolean;
  isSpecialist: boolean;
  targetUserId?: string;
  onStartScheduledCall: (
    callId: string,
    targetUserId: string,
    type: CallType
  ) => Promise<void>;
  onCancelCall: (callId: string) => Promise<boolean>;
  onCompleteCall: (callId: string) => Promise<void>;
}> = ({
  call,
  isCustomer,
  isSpecialist,
  targetUserId,
  onStartScheduledCall,
  onCancelCall,
  onCompleteCall,
}) => {
  const callType: CallType = call.type || 'video';
  const callId = call._id;
  if (!callId) return null;

  const cardClass =
    call.status === 'completed'
      ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
      : call.status === 'cancelled' || call.status === 'missed'
      ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
      : call.status === 'started'
      ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10'
      : 'border-gray-200 dark:border-gray-700';

  const typeClass =
    callType === 'audio'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';

  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition ${cardClass}`}
    >
      <div className="flex flex-wrap justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {call.purpose}
            </h4>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeClass}`}
            >
              {CALL_TYPE_TEXT[callType] || 'مكالمة'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                CALL_STATUS_COLOR[call.status] || ''
              }`}
            >
              {CALL_STATUS_TEXT[call.status] || call.status}
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
          </div>

          {call.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              📝 {call.notes}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {isSpecialist && call.status === 'scheduled' && targetUserId && (
            <button
              onClick={() =>
                onStartScheduledCall(callId, targetUserId, callType)
              }
              className="px-3 py-1 bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg text-sm transition"
            >
              بدء المكالمة
            </button>
          )}

          {isCustomer && call.status === 'scheduled' && (
            <button
              onClick={() => onCancelCall(callId)}
              className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm transition"
            >
              إلغاء
            </button>
          )}

          {isSpecialist && call.status === 'started' && (
            <button
              onClick={() => onCompleteCall(callId)}
              className="px-3 py-1 bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm transition"
            >
              إنهاء
            </button>
          )}
        </div>
      </div>
    </div>
  );
};