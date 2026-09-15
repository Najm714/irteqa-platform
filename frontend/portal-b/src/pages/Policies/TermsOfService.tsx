// frontend/portal-a/src/pages/Policies/TermsOfService.tsx
import React from 'react';
import { FaGavel, FaUserCheck, FaShieldAlt, FaFileContract, FaBan, FaInfoCircle } from 'react-icons/fa';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-red-600 flex items-center justify-center mx-auto mb-4">
              <FaGavel className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              📋 شروط الاستخدام
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">منصة ارتقاء - Irteqaa Platform</p>
            <div className="mt-4 inline-block px-4 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm">
              نسخة 1.0 - سارية من 2026
            </div>
          </div>

          {/* المقدمة */}
          <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              تحدد هذه الاتفاقية الشروط والأحكام التي تحكم استخدام منصة ارتقاء. باستخدامك للمنصة، فإنك توافق على
              الالتزام بهذه الشروط. يرجى قراءتها بعناية قبل استخدام المنصة.
            </p>
          </div>

          {/* المحتوى */}
          <div className="space-y-6">
            <TermsSection
              icon={<FaInfoCircle className="w-5 h-5 text-purple-600" />}
              title="المادة الأولى: تعريفات"
              content={[
                'المنصة: منصة ارتقاء الرقمية المتكاملة.',
                'البوابة: إحدى بوابات المنصة (بوابة الجامعات، بوابة الأعمال).',
                'المستخدم: أي شخص يستخدم المنصة.',
                'العميل: المستخدم الذي يطلب خدمة من المنصة.',
                'المختص: الخبير أو المستشار المعين لتنفيذ الخدمة.',
                'الطلب: طلب الخدمة المقدم من العميل.',
                'نطاق العمل: وصف مفصل للخدمة المطلوبة ومخرجاتها.',
              ]}
            />

            <TermsSection
              icon={<FaUserCheck className="w-5 h-5 text-green-600" />}
              title="المادة الثانية: قبول الشروط"
              content={[
                'باستخدام المنصة، فإنك توافق على هذه الشروط بشكل كامل.',
                'إذا كنت لا توافق على هذه الشروط، يجب عليك عدم استخدام المنصة.',
                'يحق للمنصة تحديث هذه الشروط في أي وقت، وسيتم إشعارك بالتغييرات.',
                'استمرار استخدامك للمنصة بعد التحديث يعني موافقتك على الشروط الجديدة.',
              ]}
            />

            <TermsSection
              icon={<FaShieldAlt className="w-5 h-5 text-amber-600" />}
              title="المادة الثالثة: الحسابات والمسؤولية"
              content={[
                'أنت مسؤول عن الحفاظ على سرية بيانات حسابك.',
                'أنت مسؤول عن جميع الأنشطة التي تتم عبر حسابك.',
                'يجب إبلاغ المنصة فوراً عن أي استخدام غير مصرح به لحسابك.',
                'يحق للمنصة تعليق أو إنهاء أي حساب يخالف هذه الشروط.',
                'يجب تقديم معلومات دقيقة وصحيحة عند إنشاء الحساب.',
              ]}
            />

            <TermsSection
              icon={<FaFileContract className="w-5 h-5 text-blue-600" />}
              title="المادة الرابعة: الخدمات والطلبات"
              content={[
                'يتم تقديم الخدمات وفق وصف الخدمة ونطاق العمل المتفق عليه.',
                'يحق للمنصة رفض أي طلب لا يتوافق مع سياساتها.',
                'يلتزم العميل بتقديم جميع المعلومات المطلوبة لتنفيذ الخدمة.',
                'يتم تحديد المدة والسعر وفق نطاق العمل المعتمد.',
                'تبدأ الخدمة بعد اعتماد نطاق العمل وتأكيد الدفع.',
              ]}
            />

            <TermsSection
              icon={<FaBan className="w-5 h-5 text-red-600" />}
              title="المادة الخامسة: السلوك المحظور"
              content={[
                'استخدام المنصة لأي غرض غير قانوني أو ضار.',
                'انتحال شخصية أخرى أو تقديم معلومات كاذبة.',
                'مشاركة محتوى مسيء أو غير لائق.',
                'محاولة اختراق المنصة أو تجاوز الإجراءات الأمنية.',
                'نسخ أو إعادة نشر محتوى المنصة دون إذن.',
                'استخدام المنصة للإزعاج أو المضايقة.',
              ]}
            />
          </div>

          {/* خاتمة */}
          <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
              هذه الشروط جزء لا يتجزأ من اتفاقية استخدام منصة ارتقاء.
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

interface TermsSectionProps {
  icon: React.ReactNode;
  title: string;
  content: string[];
}

const TermsSection: React.FC<TermsSectionProps> = ({ icon, title, content }) => {
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

export default TermsOfService;