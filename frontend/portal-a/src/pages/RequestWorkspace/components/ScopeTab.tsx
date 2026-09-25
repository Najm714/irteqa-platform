// src/pages/RequestWorkspace/components/ScopeTab.tsx
import React, { useState } from 'react';
import { FaCheckCircle, FaPlus, FaEdit, FaClipboardList } from 'react-icons/fa';
import type { Request } from '../types';

interface ScopeTabProps {
  request: Request;
  isCustomer: boolean;
  isSpecialist: boolean;
  isAdmin: boolean;
  onDefineScope: (scopeData: ScopeFormData) => Promise<boolean>;
  onApproveScope: () => Promise<boolean>;
}

interface ScopeFormData {
  description: string;
  deliverables: string;
  requirements: string;
  estimatedDuration: string;
  price: string;
  modificationsIncluded: string;
  exclusions: string;
}

export const ScopeTab: React.FC<ScopeTabProps> = ({
  request,
  isCustomer,
  isSpecialist,
  isAdmin,
  onDefineScope,
  onApproveScope,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ScopeFormData>({
    description: request.scope?.description || '',
    deliverables: request.scope?.deliverables?.join('\n') || '',
    requirements: request.scope?.requirements?.join('\n') || '',
    estimatedDuration: request.scope?.estimatedDuration || '',
    price: request.scope?.price?.toString() || '',
    modificationsIncluded:
      request.scope?.modificationsIncluded?.toString() || '',
    exclusions: request.scope?.exclusions?.join('\n') || '',
  });

  const handleSave = async () => {
    if (!formData.description || !formData.price) {
      alert('⚠️ الوصف والسعر مطلوبان');
      return;
    }

    setSaving(true);
    const success = await onDefineScope(formData);
    if (success) {
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleApprove = async () => {
    if (!confirm('هل أنت متأكد من اعتماد النطاق؟')) return;

    setSaving(true);
    await onApproveScope();
    setSaving(false);
  };

  const scope = request.scope;

  // ============================================================
  // ✅ No scope defined yet
  // ============================================================
  if (!scope || !scope.description) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          📐 نطاق العمل
        </h3>

        {(isSpecialist || isAdmin) && showForm ? (
          <ScopeForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
            saving={saving}
          />
        ) : (isSpecialist || isAdmin) ? (
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              لم يتم تحديد نطاق العمل بعد
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <FaPlus /> تحديد النطاق
            </button>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>في انتظار تحديد نطاق العمل من قبل المختص</p>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // ✅ Scope defined — display
  // ============================================================
  const isApproved = !!scope.approvedAt;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        📐 نطاق العمل
      </h3>

      {showForm && (isSpecialist || isAdmin) ? (
        <ScopeForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {scope.description}
            </p>
          </div>

          {scope.deliverables?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                المخرجات
              </h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                {scope.deliverables.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {scope.estimatedDuration && (
              <InfoBox label="المدة" value={scope.estimatedDuration} />
            )}
            {scope.price > 0 && (
              <InfoBox
                label="السعر"
                value={`${scope.price} ريال`}
                valueClass="text-purple-600"
              />
            )}
            <InfoBox
              label="التعديلات المشمولة"
              value={String(scope.modificationsIncluded || 0)}
            />
          </div>

          {isApproved ? (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <p className="text-green-700 dark:text-green-400">
                ✅ تم اعتماد النطاق في{' '}
                {new Date(scope.approvedAt!).toLocaleDateString('ar-SA')}
              </p>
            </div>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {isCustomer && request.status === 'awaiting_approval' && (
                <button
                  onClick={handleApprove}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <FaCheckCircle /> اعتماد النطاق
                </button>
              )}

              {(isSpecialist || isAdmin) && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <FaEdit /> تعديل النطاق
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// ✅ Scope Form
// ============================================================
const ScopeForm: React.FC<{
  formData: ScopeFormData;
  setFormData: (data: ScopeFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}> = ({ formData, setFormData, onSave, onCancel, saving }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        وصف النطاق *
      </label>
      <textarea
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        rows={3}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        المخرجات (كل سطر)
      </label>
      <textarea
        value={formData.deliverables}
        onChange={(e) =>
          setFormData({ ...formData, deliverables: e.target.value })
        }
        rows={3}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          المدة المتوقعة
        </label>
        <input
          type="text"
          value={formData.estimatedDuration}
          onChange={(e) =>
            setFormData({ ...formData, estimatedDuration: e.target.value })
          }
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
          placeholder="مثال: 5 أيام"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          السعر *
        </label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
          min="0"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        التعديلات المشمولة
      </label>
      <input
        type="number"
        value={formData.modificationsIncluded}
        onChange={(e) =>
          setFormData({
            ...formData,
            modificationsIncluded: e.target.value,
          })
        }
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
        min="0"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        الاستثناءات (كل سطر)
      </label>
      <textarea
        value={formData.exclusions}
        onChange={(e) =>
          setFormData({ ...formData, exclusions: e.target.value })
        }
        rows={2}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
      />
    </div>

    <div className="flex gap-3">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
      >
        <FaCheckCircle /> {saving ? 'جاري الحفظ...' : 'حفظ النطاق'}
      </button>
      <button
        onClick={onCancel}
        disabled={saving}
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      >
        إلغاء
      </button>
    </div>
  </div>
);

// ============================================================
// ✅ Info Box
// ============================================================
const InfoBox: React.FC<{
  label: string;
  value: string;
  valueClass?: string;
}> = ({ label, value, valueClass = '' }) => (
  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
    <span className="text-gray-500 dark:text-gray-400 text-sm">{label}</span>
    <p className={`font-semibold text-gray-900 dark:text-white ${valueClass}`}>
      {value}
    </p>
  </div>
);