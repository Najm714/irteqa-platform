// src/pages/RequestWorkspace/components/IncomingCallModal.tsx
import React from 'react';
import { FaPhoneAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import type { IncomingCallData } from '../types';
import { CALL_TYPE_TEXT } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';

interface IncomingCallModalProps {
  incomingCall: IncomingCallData;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  incomingCall,
  onAccept,
  onReject,
}) => {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center border-2 border-green-500 dark:border-green-400">
        <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <FaPhoneAlt className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📞 مكالمة واردة
        </h3>

        <p className="text-gray-600 dark:text-gray-400 mb-1">
          من:{' '}
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {incomingCall.callerName}
          </span>
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {incomingCall.isScheduled ? '📅 مكالمة مجدولة' : '📞 مكالمة مباشرة'}
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {CALL_TYPE_TEXT[incomingCall.type] || 'مكالمة'}
        </p>

        {incomingCall.scheduledAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {formatDateTime(incomingCall.scheduledAt)}
          </p>
        )}

        <div className="flex gap-4 justify-center mt-4">
          <button
            onClick={onAccept}
            className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center gap-2 shadow-lg shadow-green-500/30"
          >
            <FaCheckCircle className="w-5 h-5" />
            قبول
          </button>

          <button
            onClick={onReject}
            className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition flex items-center gap-2 shadow-lg shadow-red-500/30"
          >
            <FaTimesCircle className="w-5 h-5" />
            رفض
          </button>
        </div>
      </div>
    </div>
  );
};