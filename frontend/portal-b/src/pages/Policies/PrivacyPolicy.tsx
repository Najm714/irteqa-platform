// frontend/portal-a/src/pages/Policies/PrivacyPolicy.tsx
import React from 'react';
import { FaLock, FaUserSecret, FaDatabase, FaShieldAlt, FaEnvelope, FaCookie, FaUser } from 'react-icons/fa';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-green-600 flex items-center justify-center mx-auto mb-4">
              <FaLock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              🔒 سياسة الخصوصية
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">منصة ارتقاء - Irteqaa Platform</p>
            <div className="mt-4 inline-block px-4 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
              نسخة 1.0 - سارية من 2026
            </div>
          </div>

          {/* المقدمة */}
          <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              تلتزم منصة ارتقاء بحماية خصوصية مستخدميها. توضح هذه السياسة كيفية جمع واستخدام وحماية المعلومات الشخصية
              التي تقدمها عند استخدام المنصة. نوصي بقراءة هذه السياسة بعناية.
            </p>
          </div>

          {/* المحتوى */}
          <div className="space-y-6">
            <PrivacySection
              icon={<FaUser className="w-5 h-5 text-purple-600" />}
              title="المادة الأولى: المعلومات التي نجمعها"
              content={[
                'معلومات الحساب: الاسم، البريد الإلكتروني، رقم الجوال، الصورة الشخصية.',
                'معلومات الطلبات: البيانات المقدمة في نماذج الطلبات والخدمات.',
                'معلومات الملفات: الملفات التي ترفعها ضمن الطلبات أو الملف الشخصي.',
                'بيانات الاستخدام: سجل النشاط على المنصة، الصفحات التي تزورها، المدة.',
                'معلومات الدفع: بيانات الدفع المشفرة (لا نخزن تفاصيل البطاقات).',
              ]}
            />

            <PrivacySection
              icon={<FaDatabase className="w-5 h-5 text-blue-600" />}
              title="المادة الثانية: كيفية استخدام المعلومات"
              content={[
                'تقديم الخدمات المطلوبة ومعالجة الطلبات.',
                'تحسين تجربة المستخدم وتطوير المنصة.',
                'التواصل معك بشأن الطلبات والتحديثات والإشعارات.',
                'تحليل استخدام المنصة لفهم احتياجات المستخدمين.',
                'الامتثال للمتطلبات القانونية والتنظيمية.',
              ]}
            />

            <PrivacySection
              icon={<FaShieldAlt className="w-5 h-5 text-amber-600" />}
              title="المادة الثالثة: مشاركة المعلومات"
              content={[
                'لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة.',
                'قد نشارك المعلومات مع المختصين المعينين لتقديم الخدمات المطلوبة.',
                'قد نشارك المعلومات مع الجهات القانونية عند الضرورة.',
                'نشارك المعلومات مع مقدمي الخدمات التقنية (الاستضافة، التخزين السحابي).',
                'تخضع جميع الأطراف الثالثة لالتزامات保密ية مماثلة.',
              ]}
            />

            <PrivacySection
              icon={<FaUserSecret className="w-5 h-5 text-red-600" />}
              title="المادة الرابعة: حماية المعلومات"
              content={[
                'نستخدم تقنيات تشفير متقدمة لحماية بياناتك.',
                'نطبق إجراءات أمنية صارمة لمنع الوصول غير المصرح به.',
                'نقوم بمراجعة أمنية دورية للأنظمة والبيانات.',
                'نحدد الوصول إلى البيانات حسب الحاجة والصلاحيات.',
                'نحتفظ بسجلات العمليات لضمان الشفافية والمساءلة.',
              ]}
            />

            <PrivacySection
              icon={<FaCookie className="w-5 h-5 text-pink-600" />}
              title="المادة الخامسة: ملفات الارتباط (Cookies)"
              content={[
                'نستخدم ملفات الارتباط لتحسين تجربة المستخدم وتذكر التفضيلات.',
                'يمكنك تعطيل ملفات الارتباط من إعدادات المتصفح.',
                'نستخدم ملفات الارتباط لتحليل استخدام المنصة.',
                'لا نستخدم ملفات الارتباط لجمع معلومات شخصية دون موافقتك.',
              ]}
            />

            <PrivacySection
              icon={<FaEnvelope className="w-5 h-5 text-indigo-600" />}
              title="المادة السادسة: حقوق المستخدمين"
              content={[
                'حق الوصول إلى بياناتك الشخصية.',
                'حق تصحيح البيانات غير الدقيقة.',
                'حق حذف البيانات (مع مراعاة المتطلبات القانونية).',
                'حق الاعتراض على معالجة بياناتك.',
                'حق نقل البيانات إلى منصة أخرى.',
                'يمكنك ممارسة هذه الحقوق عبر التواصل معنا.',
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
            <div className="mt-4 flex justify-center gap-4 flex-wrap">
              <span className="text-xs text-gray-400">📧 contact@irteqaa.com</span>
              <span className="text-xs text-gray-400">📞 +966 5XXXX XXXX</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// مكون الأقسام
// ============================================================

interface PrivacySectionProps {
  icon: React.ReactNode;
  title: string;
  content: string[];
}

const PrivacySection: React.FC<PrivacySectionProps> = ({ icon, title, content }) => {
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

export default PrivacyPolicy;