// frontend/portal-a/src/pages/Policies/IntellectualProperty.tsx
import React from 'react';
import { FaCopyright, FaFileAlt, FaVideo, FaBook, FaCode, FaShieldAlt, FaUser, FaBuilding } from 'react-icons/fa';

const IntellectualProperty: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <FaCopyright className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              📜 سياسة الملكية الفكرية وحقوق النشر
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">منصة ارتقاء - Irteqaa Platform</p>
            <div className="mt-4 inline-block px-4 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
              نسخة 1.0 - سارية من 2026
            </div>
          </div>

          {/* المقدمة */}
          <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              تحترم منصة ارتقاء حقوق الملكية الفكرية وتلتزم بحماية الإبداعات الفكرية لجميع الأطراف.
              تحدد هذه السياسة حقوق الملكية الفكرية للمحتوى المنشور على المنصة، والخدمات المقدمة، والمواد التعليمية.
            </p>
          </div>

          {/* المحتوى */}
          <div className="space-y-6">
            <PolicySection
              icon={<FaFileAlt className="w-5 h-5 text-purple-600" />}
              title="المادة الأولى: تعريف المحتوى"
              content={[
                'المحتوى: يشمل جميع المواد المنشورة على المنصة بما في ذلك النصوص، الصور، الفيديوهات، الملفات الصوتية، الرسومات، التصاميم، والبرمجيات.',
                'المحتوى المجاني: المواد التي توفرها المنصة للجميع دون اشتراك.',
                'المحتوى المدفوع: المواد التي تتطلب اشتراكاً أو دفعة للوصول إليها.',
                'المخرجات الأكاديمية: الأعمال التي ينتجها المختصون نيابة عن العملاء.',
              ]}
            />

            <PolicySection
              icon={<FaUser className="w-5 h-5 text-green-600" />}
              title="المادة الثانية: ملكية المحتوى المنشور"
              content={[
                'جميع حقوق الملكية الفكرية للمنصة وهوية ارتقاء والاسم التجاري محفوظة للمنصة.',
                'المحتوى التعليمي والمواد التي تنتجها المنصة مملوكة للمنصة، ويحق للمستخدم استخدامها للأغراض الشخصية فقط.',
                'الملفات والمخرجات التي ينتجها المختص للعميل تكون مملوكة للعميل بعد تسليمها نهائياً.',
                'يحتفظ المختص بحق الإشارة إلى العمل ضمن محفظته الشخصية مع الحفاظ على سرية البيانات.',
              ]}
            />

            <PolicySection
              icon={<FaBuilding className="w-5 h-5 text-amber-600" />}
              title="المادة الثالثة: استخدام المحتوى"
              content={[
                'لا يجوز نسخ أو توزيع أو تعديل أو إعادة نشر أي محتوى من المنصة دون إذن خطي مسبق.',
                'يسمح باستخدام المحتوى للأغراض الشخصية والتعليمية غير التجارية.',
                'يحظر استخدام المحتوى في أي نشاط تجاري أو تسويقي دون ترخيص من المنصة.',
                'يجب الإشارة إلى مصدر المحتوى عند الاقتباس أو الإشارة إليه.',
              ]}
            />

            <PolicySection
              icon={<FaCode className="w-5 h-5 text-red-600" />}
              title="المادة الرابعة: حقوق البرمجيات والتقنيات"
              content={[
                'الكود البرمجي للمنصة وجميع التقنيات المستخدمة هي ملكية خاصة للمنصة.',
                'يحظر تفكيك أو فك تشفير أو محاولة استخراج الكود المصدري للمنصة.',
                'جميع الحقوق محفوظة للمنصة فيما يتعلق بتصميم الواجهات وتجربة المستخدم.',
              ]}
            />

            <PolicySection
              icon={<FaVideo className="w-5 h-5 text-pink-600" />}
              title="المادة الخامسة: حقوق الفيديوهات والمحتوى المرئي"
              content={[
                'الفيديوهات التعليمية المنتجة بواسطة المنصة مملوكة للمنصة.',
                'الفيديوهات المقدمة من قبل المختصين ضمن الخدمات تكون مملوكة للعميل بعد التسليم.',
                'النماذج العلمية والتوضيحية التي تنشرها المنصة مملوكة للمنصة وليست أعمالاً لعملاء سابقين.',
              ]}
            />

            <PolicySection
              icon={<FaShieldAlt className="w-5 h-5 text-indigo-600" />}
              title="المادة السادسة: حماية الحقوق"
              content={[
                'تتخذ المنصة إجراءات تقنية وقانونية لحماية حقوق الملكية الفكرية.',
                'يتم التعامل مع أي انتهاك لحقوق الملكية الفكرية بجدية وفق الإجراءات القانونية.',
                'يحق للمنصة حذف أي محتوى ينتهك حقوق الملكية الفكرية للآخرين.',
                'يمكن تقديم بلاغ عن انتهاك حقوق الملكية الفكرية عبر قنوات الدعم.',
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

interface PolicySectionProps {
  icon: React.ReactNode;
  title: string;
  content: string[];
}

const PolicySection: React.FC<PolicySectionProps> = ({ icon, title, content }) => {
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

export default IntellectualProperty;