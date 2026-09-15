// frontend/portal-a/src/pages/Policies/AcademicCharter.tsx
import React from 'react';
import { FaShieldAlt, FaCheckCircle, FaUserGraduate, FaBook, FaStar, FaClock, FaComments } from 'react-icons/fa';

const AcademicCharter: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              📜 ميثاق العمل الأكاديمي وضمان الجودة
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">منصة ارتقاء - Irteqaa Platform</p>
            <div className="mt-4 inline-block px-4 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">
              نسخة 1.0 - سارية من 2026
            </div>
          </div>

          {/* المقدمة */}
          <div className="mb-8 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              يحدد هذا الميثاق المعايير الأكاديمية والمهنية التي تلتزم بها منصة ارتقاء في تقديم الخدمات التعليمية والاستشارية، 
              ويضمن الجودة في جميع مراحل العمل الأكاديمي، من الاستشارة الأولى إلى التسليم النهائي.
            </p>
          </div>

          {/* الأقسام */}
          <div className="space-y-8">
            {/* القسم 1 */}
            <Section
              icon={<FaUserGraduate className="w-6 h-6 text-purple-600" />}
              title="المادة الأولى: المعايير الأكاديمية"
              items={[
                'تقديم محتوى أكاديمي دقيق وموثوق ومحدث',
                'الالتزام بالمراجع العلمية المعتمدة في جميع المخرجات',
                'ضمان خلو العمل من الأخطاء العلمية واللغوية',
                'توفير شرح وافي ومبسط للموضوعات المعقدة',
                'استخدام أساليب تعليمية متنوعة تناسب مختلف المستويات',
              ]}
            />

            {/* القسم 2 */}
            <Section
              icon={<FaCheckCircle className="w-6 h-6 text-green-600" />}
              title="المادة الثانية: معايير الجودة"
              items={[
                'مراجعة شاملة للمخرجات قبل التسليم من قبل مختصين مؤهلين',
                'تطبيق نظام مراجعة داخلي لضمان الجودة',
                'الحصول على تغذية راجعة من المستفيدين لتحسين الخدمات',
                'تحديث المحتوى بشكل دوري لضمان مواكبة التطورات',
                'توثيق جميع الإجراءات والمراجعات',
              ]}
            />

            {/* القسم 3 */}
            <Section
              icon={<FaClock className="w-6 h-6 text-blue-600" />}
              title="المادة الثالثة: التزامات المختصين الأكاديميين"
              items={[
                'تقديم المخرجات ضمن الإطار الزمني المتفق عليه',
                'الحفاظ على أعلى معايير النزاهة الأكاديمية',
                'الإشارة إلى المصادر والمراجع المستخدمة',
                'توثيق جميع التعديلات والمراجعات',
                'الاستجابة لاستفسارات العملاء في الوقت المناسب',
              ]}
            />

            {/* القسم 4 */}
            <Section
              icon={<FaStar className="w-6 h-6 text-amber-500" />}
              title="المادة الرابعة: حقوق المستفيدين من الخدمات الأكاديمية"
              items={[
                'الحصول على خدمة أكاديمية بجودة عالية وفق النطاق المتفق عليه',
                'طلب توضيحات إضافية عند الحاجة خلال فترة التنفيذ',
                'الاطلاع على مراحل العمل والتقدم المحرز',
                'طلب تعديلات في حدود النطاق المعتمد دون رسوم إضافية',
                'تقييم الخدمة المقدمة بعد الانتهاء',
              ]}
            />

            {/* القسم 5 */}
            <Section
              icon={<FaComments className="w-6 h-6 text-pink-600" />}
              title="المادة الخامسة: آلية ضمان الجودة"
              items={[
                'تقييم المخرجات من قبل لجنة الجودة الداخلية',
                'إجراء مراجعات دورية للخدمات والمحتوى',
                'جمع وتحليل ملاحظات العملاء لتحسين الخدمات',
                'تطوير خطط تحسين مستمرة بناءً على النتائج',
                'اعتماد معايير تقييم واضحة وقابلة للقياس',
              ]}
            />

            {/* القسم 6 */}
            <Section
              icon={<FaBook className="w-6 h-6 text-indigo-600" />}
              title="المادة السادسة: التعامل مع الشكاوى الأكاديمية"
              items={[
                'تقديم الشكوى عبر النظام خلال 30 يوماً من التسليم',
                'مراجعة الشكوى من قبل لجنة مختصة خلال 5 أيام عمل',
                'اتخاذ الإجراءات التصحيحية المناسبة عند ثبوت القصور',
                'إبلاغ صاحب الشكوى بالنتيجة والإجراءات المتخذة',
                'تسجيل جميع الشكاوى والإجراءات في سجل خاص',
              ]}
            />
          </div>

          {/* خاتمة */}
          <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
              هذا الميثاق جزء لا يتجزأ من اتفاقية استخدام منصة ارتقاء، ويسري على جميع الخدمات الأكاديمية المقدمة عبر المنصة.
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

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
}

const Section: React.FC<SectionProps> = ({ icon, title, items }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <ul className="space-y-2 pr-6">
        {items.map((item, index) => (
          <li key={index} className="text-gray-600 dark:text-gray-400 list-disc leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AcademicCharter;