// frontend/portal-a/src/components/layout/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaTwitter, 
  FaLinkedin, 
  FaYoutube, 
  FaFacebook, 
  FaInstagram, 
  FaWhatsapp, 
  FaTelegram,
  FaGithub,
} from 'react-icons/fa';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer bg-gray-900 dark:bg-gray-950 text-gray-400 py-8 mt-auto">
      <div className="container-custom max-w-7xl mx-auto px-4">
        {/* روابط التواصل الاجتماعي */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <a 
            href="#" 
            data-tooltip="تويتر" 
            className="w-11 h-11 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            aria-label="تويتر"
          >
            <FaTwitter size={20} />
          </a>
          <a 
            href="#" 
            data-tooltip="لينكد إن" 
            className="w-11 h-11 rounded-full bg-gray-800 hover:bg-[#0A66C2] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            aria-label="لينكد إن"
          >
            <FaLinkedin size={20} />
          </a>
          <a 
            href="#" 
            data-tooltip="يوتيوب" 
            className="w-11 h-11 rounded-full bg-gray-800 hover:bg-[#FF0000] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            aria-label="يوتيوب"
          >
            <FaYoutube size={20} />
          </a>
          <a 
            href="#" 
            data-tooltip="فيسبوك" 
            className="w-11 h-11 rounded-full bg-gray-800 hover:bg-[#1877F2] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            aria-label="فيسبوك"
          >
            <FaFacebook size={20} />
          </a>
          <a 
            href="#" 
            data-tooltip="انستغرام" 
            className="w-11 h-11 rounded-full bg-gray-800 hover:bg-gradient-to-r from-[#fdf497] via-[#fd5949] to-[#d6249f] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            aria-label="انستغرام"
          >
            <FaInstagram size={20} />
          </a>
          <a 
            href="#" 
            data-tooltip="واتساب" 
            className="w-11 h-11 rounded-full bg-gray-800 hover:bg-[#25D366] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            aria-label="واتساب"
          >
            <FaWhatsapp size={20} />
          </a>
          <a 
            href="#" 
            data-tooltip="تيليجرام" 
            className="w-11 h-11 rounded-full bg-gray-800 hover:bg-[#0088CC] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            aria-label="تيليجرام"
          >
            <FaTelegram size={20} />
          </a>
          <a 
            href="https://github.com/irteqaa" 
            data-tooltip="جيثب" 
            className="w-11 h-11 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            aria-label="جيثب"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub size={20} />
          </a>
        </div>

        {/* اسم المنصة */}
        <div className="text-center mb-4">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            ارتقاء
          </span>
          <span className="text-gray-400 mr-2">للخدمات الأكاديمية</span>
        </div>

        {/* روابط السياسات */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6">
          <Link 
            to="/policies/academic-charter" 
            className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200 hover:underline"
          >
            📜 ميثاق العمل الأكاديمي
          </Link>
          <Link 
            to="/policies/intellectual-property" 
            className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200 hover:underline"
          >
            📜 الملكية الفكرية
          </Link>
          <Link 
            to="/policies/privacy" 
            className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200 hover:underline"
          >
            🔒 سياسة الخصوصية
          </Link>
          <Link 
            to="/policies/terms" 
            className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200 hover:underline"
          >
            📋 شروط الاستخدام
          </Link>
          <Link 
            to="/policies/payment-refund" 
            className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200 hover:underline"
          >
            💰 الدفع والاسترجاع
          </Link>
          <Link 
            to="/policies/cookies" 
            className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200 hover:underline"
          >
            🍪 ملفات الارتباط
          </Link>
        </div>

        {/* حقوق النشر */}
        <div className="text-center pt-4 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} منصة ارتقاء. جميع الحقوق محفوظة.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            منصة واحدة متعددة البوابات
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;