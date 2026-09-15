// frontend/portal-a/src/pages/Policies/CookiePolicy.tsx
import React from 'react';
import { FaCookie, FaInfoCircle, FaUserCheck, FaShieldAlt, FaCog, FaDatabase } from 'react-icons/fa';

const CookiePolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-yellow-600 flex items-center justify-center mx-auto mb-4">
              <FaCookie className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              🍪 سياسة ملفات الارتباط
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">منصة ارتقاء - Irteqaa Platform</p>
            <div className="mt-4 inline-block px-4 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm">
              نسخة 1.0 - سارية من 2026
            </div>
          </div>

          {/* المقدمة */}
          <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              توضح هذه السياسة كيفية استخدام منصة ارتقاء لملفات الارتباط (Cookies) والتقنيات المماثلة.
              نستخدم ملفات الارتباط لتحسين تجربتك على المنصة وتقديم خدمات مخصصة.
            </p>
          </div>

          {/* المحتوى */}
          <div className="space-y-6">
            <CookieSection
              icon={<FaInfoCircle className="w-5 h-5 text-purple-600" />}
              title="ما هي ملفات الارتباط؟"
              content={[
                'ملفات الارتباط هي ملفات نصية صغيرة يتم تخزينها على جهازك عند زيارة موقع إلكتروني.',
                'تساعد هذه الملفات في تذكر تفضيلاتك وتحسين تجربة التصفح.',
                'تُستخدم لتوفير ميزات مثل تذكر تسجيل الدخول والإعدادات المفضلة.',
              ]}
            />

            <CookieSection
              icon={<FaCog className="w-5 h-5 text-blue-600" />}
              title="أنواع ملفات الارتباط التي نستخدمها"
              content={[
                'أساسية: ضرورية لتشغيل المنصة (مثل تسجيل الدخول).',
                'وظيفية: تذكر تفضيلاتك وإعداداتك.',
                'تحليلية: تساعدنا في فهم كيفية استخدام المنصة وتحسينها.',
                'تسويقية: تستخدم لعرض محتوى مناسب لك (اختيارية).',
              ]}
            />

            <CookieSection
              icon={<FaDatabase className="w-5 h-5 text-amber-600" />}
              title="كيف نستخدم ملفات الارتباط؟"
              content={[
                'تذكر معلومات تسجيل الدخول لتسهيل الوصول.',
                'تخزين تفضيلات العرض والإعدادات.',
                'تحليل أداء المنصة وتحسين التجربة.',
                'تقديم محتوى مخصص بناءً على اهتماماتك.',
                'قياس فعالية الحملات التسويقية.',
              ]}
            />

            <CookieSection
              icon={<FaUserCheck className="w-5 h-5 text-green-600" />}
              title="التحكم في ملفات الارتباط"
              content={[
                'يمكنك التحكم في ملفات الارتباط من خلال إعدادات المتصفح الخاص بك.',
                'يمكنك حذف جميع ملفات الارتباط الموجودة على جهازك.',
                'يمكنك منع ملفات الارتباط من جهات خارجية.',
                'قد يؤثر تعطيل بعض ملفات الارتباط على أداء المنصة.',
                'يمكنك تغيير إعدادات ملفات الارتباط في أي وقت.',
              ]}
            />

            <CookieSection
              icon={<FaShieldAlt className="w-5 h-5 text-red-600" />}
              title="ملفات الارتباط من جهات خارجية"
              content={[
                'نستخدم خدمات جهات خارجية موثوقة قد تضع ملفات ارتباط.',
                'نضمن أن هذه الجهات تلتزم بمعايير الخصوصية.',
                'لا نتحكم في ملفات الارتباط من جهات خارجية.',
                'نوصي بمراجعة سياسات الخصوصية لهذه الجهات.',
              ]}
            />
          </div>

          {/* خاتمة */}
          <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
              باستمرارك في استخدام المنصة، فإنك توافق على استخدام ملفات الارتباط وفق هذه السياسة.
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

interface CookieSectionProps {
  icon: React.ReactNode;
  title: string;
  content: string[];
}

const CookieSection: React.FC<CookieSectionProps> = ({ icon, title, content }) => {
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

export default CookiePolicy;