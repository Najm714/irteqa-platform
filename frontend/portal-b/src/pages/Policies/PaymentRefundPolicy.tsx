// frontend/portal-a/src/pages/Policies/PaymentRefundPolicy.tsx
import React from 'react';
import { FaMoneyBill, FaCreditCard, FaUndo, FaCheckCircle, FaTimesCircle, FaClock, FaShieldAlt } from 'react-icons/fa';

const PaymentRefundPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-green-600 flex items-center justify-center mx-auto mb-4">
              <FaMoneyBill className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              💰 سياسة الدفع والاسترجاع
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">منصة ارتقاء - Irteqaa Platform</p>
            <div className="mt-4 inline-block px-4 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
              نسخة 1.0 - سارية من 2026
            </div>
          </div>

          {/* المقدمة */}
          <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              تحدد هذه السياسة آليات الدفع والاسترجاع في منصة ارتقاء. تهدف هذه السياسة إلى ضمان الشفافية
              والعدالة في جميع المعاملات المالية بين العميل والمنصة والمختصين.
            </p>
          </div>

          {/* المحتوى */}
          <div className="space-y-6">
            <PaymentSection
              icon={<FaCreditCard className="w-5 h-5 text-purple-600" />}
              title="المادة الأولى: طرق الدفع"
              content={[
                'بطاقة ائتمان (Visa, MasterCard, American Express).',
                'بطاقة مدى.',
                'تحويل بنكي.',
                'دفع يدوي (مع إثبات الدفع).',
                'جميع المدفوعات تتم بعملة الريال السعودي (SAR).',
              ]}
            />

            <PaymentSection
              icon={<FaClock className="w-5 h-5 text-blue-600" />}
              title="المادة الثانية: توقيت الدفع"
              content={[
                'يتم الدفع بعد اعتماد نطاق العمل من قبل العميل.',
                'يبدأ تنفيذ الخدمة بعد تأكيد استلام الدفع.',
                'في حالة الدفع اليدوي، تبدأ الخدمة بعد التحقق من إثبات الدفع.',
                'يتم إشعار العميل بتأكيد الدفع عبر البريد الإلكتروني والإشعارات.',
              ]}
            />

            <PaymentSection
              icon={<FaUndo className="w-5 h-5 text-amber-600" />}
              title="المادة الثالثة: حالات الاسترجاع"
              content={[
                'لم يبدأ تنفيذ الخدمة: استرجاع كامل المبلغ.',
                'بدأ التنفيذ جزئياً: استرجاع المبلغ ناقص قيمة الجزء المنفذ.',
                'تم تنفيذ جزء من الخدمة: استرجاع المبلغ ناقص قيمة الجزء المنفذ.',
                'لم يتم تقديم المخرج المتفق عليه: استرجاع كامل المبلغ.',
                'قصور قابل للتعديل: لا استرجاع، يتم التعديل ضمن الخدمة.',
                'قصور جوهري غير قابل للمعالجة: استرجاع كامل المبلغ.',
                'العميل غيّر متطلباته: استرجاع حسب الاتفاق الجديد.',
              ]}
            />

            <PaymentSection
              icon={<FaCheckCircle className="w-5 h-5 text-green-600" />}
              title="المادة الرابعة: إجراءات الاسترجاع"
              content={[
                'تقديم طلب الاسترجاع عبر النظام أو البريد الإلكتروني.',
                'مراجعة الطلب ونطاق العمل والمرحلة المنفذة.',
                'اتخاذ القرار وفق هذه السياسة.',
                'إشعار العميل بالقرار خلال 5 أيام عمل.',
                'تنفيذ الاسترجاع خلال 14 يوماً من الموافقة.',
                'تسجيل العملية في سجل المدفوعات.',
              ]}
            />

            <PaymentSection
              icon={<FaTimesCircle className="w-5 h-5 text-red-600" />}
              title="المادة الخامسة: حالات عدم الاسترجاع"
              content={[
                'تم تسليم المخرج النهائي واعتماده من العميل.',
                'طلب التعديل بعد تسليم المخرج النهائي.',
                'تغيير متطلبات العميل بعد بدء التنفيذ.',
                'إلغاء الطلب من قبل العميل بعد بدء التنفيذ.',
                'عدم الالتزام بشروط الخدمة من قبل العميل.',
              ]}
            />

            <PaymentSection
              icon={<FaShieldAlt className="w-5 h-5 text-indigo-600" />}
              title="المادة السادسة: حماية المعاملات المالية"
              content={[
                'جميع المعاملات المالية مشفرة ومحمية.',
                'لا نقوم بتخزين تفاصيل البطاقات المصرفية.',
                'نلتزم بمعايير PCI DSS لأمان المدفوعات.',
                'نحتفظ بسجلات جميع المعاملات المالية.',
                'نقوم بمراجعة دورية لنظام الدفع والأمان.',
              ]}
            />
          </div>

          {/* خاتمة */}
          <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
              هذه السياسة جزء لا يتجزأ من اتفاقية استخدام منصة ارتقاء.
              <br />
              آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// مكون الأقسام
// ============================================================

interface PaymentSectionProps {
  icon: React.ReactNode;
  title: string;
  content: string[];
}

const PaymentSection: React.FC<PaymentSectionProps> = ({ icon, title, content }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <ul className="space-y-2 pr-6">
        {content.map((item, index) => (
          <li key={index} className="text-gray-600 dark:text-gray-400 list-disc leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PaymentRefundPolicy;