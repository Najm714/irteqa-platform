// src/pages/RequestWorkspace/components/OverviewTab.tsx
import React from 'react';
import type { Request } from '../types';
import { formatDate } from '../utils/formatters';

interface OverviewTabProps {
  request: Request;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ request }) => {
  const scope = request.scope;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              📝 وصف الطلب
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
              {request.formData?.description ||
                request.description ||
                'لا يوجد وصف'}
            </p>
          </div>

          {scope && (scope.description || scope.price > 0) && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                📐 نطاق العمل
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-3">
                {scope.description && (
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {scope.description}
                  </p>
                )}

                {scope.deliverables?.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      المخرجات:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                      {scope.deliverables.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {scope.estimatedDuration && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        المدة:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white mr-2">
                        {scope.estimatedDuration}
                      </span>
                    </div>
                  )}
                  {scope.price > 0 && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        السعر:
                      </span>
                      <span className="font-semibold text-purple-600 mr-2">
                        {scope.price} ريال
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
            📊 معلومات سريعة
          </h4>

          <div className="space-y-2">
            <InfoRow
              label="📂 الملفات"
              value={String(request.files?.length || 0)}
            />
            <InfoRow
              label="💬 الرسائل"
              value={String(request.messages?.length || 0)}
            />
            <InfoRow
              label="📞 المكالمات"
              value={String(request.calls?.length || 0)}
            />
            <InfoRow
              label="💳 إثباتات الدفع"
              value={String(request.paymentProofs?.length || 0)}
            />
            <InfoRow label="📅 الإنشاء" value={formatDate(request.createdAt)} />
          </div>
        </aside>
      </div>
    </div>
  );
};

// ============================================================
// ✅ InfoRow
// ============================================================
const InfoRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="font-bold text-gray-900 dark:text-white text-sm">
      {value}
    </span>
  </div>
);