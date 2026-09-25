// src/pages/RequestWorkspace/components/RequestHeader.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit } from 'react-icons/fa';
import type { Request } from '../types';
import {
  STATUS_TEXT,
  STATUS_COLOR,
  PAYMENT_STATUS_TEXT,
  PAYMENT_STATUS_COLOR,
  STATUS_TRANSITIONS,
} from '../utils/constants';
import { getUserName } from '../utils/formatters';

interface RequestHeaderProps {
  request: Request;
  isAdmin: boolean;
  isSpecialist: boolean;
  isCustomer: boolean;
  canEdit: boolean;
  onUpdateStatus: (status: string) => void;
  onVerifyPayment?: () => void;
  onRejectPayment?: () => void;
}

export const RequestHeader: React.FC<RequestHeaderProps> = ({
  request,
  isAdmin,
  isSpecialist,
  isCustomer,
  canEdit,
  onUpdateStatus,
  onVerifyPayment,
  onRejectPayment,
}) => {
  const statusColor = STATUS_COLOR[request.status] || 'bg-gray-500';
  const paymentBadgeClass =
    PAYMENT_STATUS_COLOR[request.paymentStatus] ||
    PAYMENT_STATUS_COLOR.not_required;

  const availableTransitions = STATUS_TRANSITIONS[request.status] || [];
  const backLink = isAdmin
    ? '/admin-requests'
    : isSpecialist
    ? '/specialist-requests'
    : '/my-requests';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      {/* Top Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to={backLink}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0"
          >
            <FaArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {request.formData?.title || request.title || 'طلب'}
            </h1>

            <div className="flex items-center gap-3 flex-wrap mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                #{request.requestNumber || request._id.slice(-8)}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${statusColor}`}
              >
                {STATUS_TEXT[request.status] || request.status}
              </span>

              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${paymentBadgeClass}`}
              >
                {PAYMENT_STATUS_TEXT[request.paymentStatus] ||
                  request.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && availableTransitions.length > 0 && (
            <div className="relative group">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2">
                <FaEdit className="w-4 h-4" />
                تغيير الحالة
              </button>

              <div className="absolute left-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[200px] hidden group-hover:block z-20">
                {availableTransitions.map((status) => (
                  <button
                    key={status}
                    onClick={() => onUpdateStatus(status)}
                    className="w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
                  >
                    {STATUS_TEXT[status] || status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSpecialist && request.status === 'new' && (
            <button
              onClick={() => onUpdateStatus('assigned')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              قبول الطلب
            </button>
          )}

          {isAdmin && request.paymentStatus === 'submitted' && (
            <>
              <button
                onClick={onVerifyPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                تأكيد الدفع
              </button>
              <button
                onClick={onRejectPayment}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                رفض الدفع
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">العميل</p>
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {getUserName(request.accountId)}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {request.accountId?.email}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">الخدمة</p>
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {request.serviceId?.nameAr || request.serviceId?.name}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">المختص</p>
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {request.specialistId
              ? getUserName(request.specialistId)
              : 'لم يتم إسناده بعد'}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            تاريخ الإنشاء
          </p>
          <p className="font-medium text-gray-900 dark:text-white">
            {new Date(request.createdAt).toLocaleDateString('ar-SA')}
          </p>
        </div>
      </div>
    </div>
  );
};