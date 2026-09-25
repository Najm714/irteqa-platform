// src/pages/RequestWorkspace/components/ToastContainer.tsx
import React from 'react';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimes,
} from 'react-icons/fa';
import type { Toast } from '../types';

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 z-[1000] space-y-2" dir="rtl">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

// ============================================================
// ✅ Toast
// ============================================================
const Toast: React.FC<{
  toast: Toast;
  onClose: (id: number) => void;
}> = ({ toast, onClose }) => {
  const config = {
    success: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-200',
      border: 'border-green-200 dark:border-green-800',
      icon: <FaCheckCircle className="w-5 h-5 flex-shrink-0" />,
    },
    error: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-200',
      border: 'border-red-200 dark:border-red-800',
      icon: <FaTimesCircle className="w-5 h-5 flex-shrink-0" />,
    },
    info: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-200',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <FaInfoCircle className="w-5 h-5 flex-shrink-0" />,
    },
    warning: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-200',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: <FaExclamationTriangle className="w-5 h-5 flex-shrink-0" />,
    },
  }[toast.type];

  return (
    <div
      className={`${config.bg} ${config.text} ${config.border} px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] border animate-slide-in`}
    >
      {config.icon}
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="opacity-60 hover:opacity-100 transition flex-shrink-0"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    </div>
  );
};