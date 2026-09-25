// src/pages/RequestWorkspace/components/PaymentTab.tsx
import React, { useState } from 'react';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBill,
  FaFile,
  FaSpinner,
  FaDownload,
  FaEye,
} from 'react-icons/fa';
import type { Request, PaymentProof } from '../types';
import {
  PAYMENT_STATUS_TEXT,
  PAYMENT_STATUS_COLOR,
} from '../utils/constants';
import { formatFileSize } from '../utils/formatters';

interface PaymentTabProps {
  request: Request;
  isCustomer: boolean;
  isAdmin: boolean;
  onSubmitPayment: (amount: number, method: string) => Promise<boolean>;
  onViewFile: (fileId: string) => void;
  onDownloadFile: (fileId: string, filename: string) => void;
}

export const PaymentTab: React.FC<PaymentTabProps> = ({
  request,
  isCustomer,
  isAdmin,
  onSubmitPayment,
  onViewFile,
  onDownloadFile,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: request.price?.toString() || '',
    method: 'bank_transfer',
  });

  const paymentBadgeClass =
    PAYMENT_STATUS_COLOR[request.paymentStatus] ||
    PAYMENT_STATUS_COLOR.not_required;

  const handleSubmit = async () => {
    const amount = parseFloat(paymentData.amount);
    if (!amount || amount <= 0) {
      alert('⚠️ يرجى إدخال مبلغ صحيح');
      return;
    }

    setProcessing(true);
    const success = await onSubmitPayment(amount, paymentData.method);
    if (success) setShowForm(false);
    setProcessing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        💰 الدفع
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Amount + Status */}
        <div>
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">المبلغ</span>
              <span className="font-bold text-2xl text-purple-600">
                {request.price || 0} ريال
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">العملة</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {request.currency || 'SAR'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">الحالة</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${paymentBadgeClass}`}
              >
                {PAYMENT_STATUS_TEXT[request.paymentStatus] ||
                  request.paymentStatus}
              </span>
            </div>
          </div>

          {/* Status Message */}
          {request.paymentStatus === 'verified' && (
            <StatusBox
              type="success"
              icon={<FaCheckCircle className="w-8 h-8" />}
              message="✅ تم دفع المبلغ بالكامل"
            />
          )}

          {request.paymentStatus === 'rejected' && (
            <StatusBox
              type="error"
              icon={<FaTimesCircle className="w-8 h-8" />}
              message="❌ تم رفض الدفع"
              subMessage={
                request.paymentProofs?.find((p) => p.rejectionReason)
                  ?.rejectionReason
              }
            />
          )}

          {/* Payment Form */}
          {isCustomer &&
            request.paymentStatus === 'pending' &&
            request.status === 'awaiting_payment' && (
              <div className="mt-4">
                {showForm ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        طريقة الدفع
                      </label>
                      <select
                        value={paymentData.method}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            method: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                      >
                        <option value="bank_transfer">🏦 تحويل بنكي</option>
                        <option value="credit_card">💳 بطاقة ائتمان</option>
                        <option value="mada">💳 مدى</option>
                        <option value="manual">📝 دفع يدوي</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        المبلغ
                      </label>
                      <input
                        type="number"
                        value={paymentData.amount}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            amount: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                        min="0"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaMoneyBill />
                        )}
                        {processing ? 'جاري المعالجة...' : 'تأكيد الدفع'}
                      </button>
                      <button
                        onClick={() => setShowForm(false)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <FaMoneyBill /> تقديم الدفع
                  </button>
                )}
              </div>
            )}
        </div>

        {/* Right: Payment Proofs */}
        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            💳 إثباتات الدفع
          </h4>
          {request.paymentProofs?.length > 0 ? (
            <div className="space-y-2">
              {request.paymentProofs.map((proof, index) => (
                <PaymentProofItem
                  key={index}
                  proof={proof}
                  onView={onViewFile}
                  onDownload={onDownloadFile}
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
  );
};

// ============================================================
// ✅ Status Box
// ============================================================
const StatusBox: React.FC<{
  type: 'success' | 'error';
  icon: React.ReactNode;
  message: string;
  subMessage?: string;
}> = ({ type, icon, message, subMessage }) => (
  <div
    className={`rounded-lg p-4 border text-center mt-4 ${
      type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
    }`}
  >
    <div className="flex justify-center mb-2">{icon}</div>
    <p>{message}</p>
    {subMessage && <p className="text-sm mt-1">سبب: {subMessage}</p>}
  </div>
);

// ============================================================
// ✅ Payment Proof Item
// ============================================================
const PaymentProofItem: React.FC<{
  proof: PaymentProof;
  onView: (fileId: string) => void;
  onDownload: (fileId: string, filename: string) => void;
}> = ({ proof, onView, onDownload }) => {
  const fileId = proof.fileId?._id;
  const filename = proof.fileId?.originalName || proof.filename;

  return (
    <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <FaFile className="text-gray-500 w-5 h-5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {filename}
          </p>
          <p className="text-xs">
            {proof.verified ? (
              <span className="text-green-500">✅ مؤكد</span>
            ) : proof.rejectionReason ? (
              <span className="text-red-500">❌ مرفوض</span>
            ) : (
              <span className="text-yellow-500">⏳ قيد المراجعة</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onDownload(fileId, filename)}
          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
          title="تحميل"
        >
          <FaDownload />
        </button>
        <button
          onClick={() => onView(fileId)}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 transition"
          title="معاينة"
        >
          <FaEye />
        </button>
      </div>
    </div>
  );
};