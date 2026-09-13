// frontend/portal-a/src/pages/Services.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSearch, FaSpinner, FaArrowLeft, FaStar,
  FaEye, FaFlask,
  FaUsers, FaGraduationCap,
} from 'react-icons/fa';

// ============================================================
// واجهات البيانات
// ============================================================

interface Service {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  icon: string;
  slug: string;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  sectionId: {
    _id: string;
    name: string;
    nameAr: string;
  };
  pricing: {
    type: string;
    defaultPrice: number;
  };
  createdAt: string;
}

interface Section {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  icon: string;
  slug: string;
  parentId?: string | null;
  children?: Section[];
}

// ============================================================
// المكون الرئيسي
// ============================================================

const Services: React.FC = () => {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionId = searchParams.get('section');

  const [services, setServices] = useState<Service[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [filterFeatured, setFilterFeatured] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  // ===== جلب الأقسام =====
  const fetchSections = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/sections?isPublished=true`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setSections(data.data || []);
        
        if (sectionId) {
          const section = data.data.find((s: Section) => s._id === sectionId);
          if (section) {
            setSelectedSection(section);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
    }
  }, [token, API_URL, sectionId]);

  // ===== جلب الخدمات =====
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `${API_URL}/services?isPublished=true`;
      if (sectionId) {
        url += `&sectionId=${sectionId}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setServices(data.data || []);
      } else {
        setError(data.message || 'حدث خطأ في تحميل الخدمات');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('حدث خطأ في تحميل الخدمات');
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, sectionId]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchSections();
    fetchServices();
  }, [fetchSections, fetchServices, sectionId]);

  // ===== تصفية الخدمات =====
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      (service.nameAr || service.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.descriptionAr || service.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFeatured = filterFeatured ? service.isFeatured : true;
    
    return matchesSearch && matchesFeatured;
  });

  // ===== أيقونة الخدمة =====
  const getServiceIcon = (icon: string) => {
    const icons: { [key: string]: string } = {
      'fa-cog': '⚙️', 'fa-book': '📚', 'fa-graduation-cap': '🎓',
      'fa-briefcase': '💼', 'fa-search': '🔍', 'fa-pen': '✏️',
      'fa-chart': '📊', 'fa-code': '💻', 'fa-heart': '❤️',
      'fa-star': '⭐', 'fa-flask': '🧪', 'fa-file-alt': '📄',
      'fa-language': '🌐', 'fa-spell-check': '✅', 'fa-users': '👥',
    };
    return icons[icon] || '📁';
  };

  // ===== اسم الخدمة =====
  const getServiceName = (service: Service) => {
    return service.nameAr || service.name || 'خدمة';
  };

  // ===== وصف الخدمة =====
  const getServiceDescription = (service: Service) => {
    return service.descriptionAr || service.description || 'خدمة متخصصة';
  };

  // ===== اسم القسم =====
  const getSectionName = (section: Section) => {
    return section.nameAr || section.name || 'قسم';
  };

  // ===== تنسيق السعر =====
  const formatPrice = (price: number) => {
    if (price === 0) return 'مجاني';
    return `${price} ريال`;
  };

  // ===== تغيير القسم =====
  const handleSectionChange = (sectionId: string | null) => {
    if (sectionId) {
      setSearchParams({ section: sectionId });
    } else {
      setSearchParams({});
    }
    setSelectedSection(sections.find(s => s._id === sectionId) || null);
  };

  // ===== العودة =====
  const goBack = () => {
    setSearchParams({});
    setSelectedSection(null);
  };

  // ===== عرض حالة التحميل =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الخدمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ===== Header ===== */}
      <section className="relative bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#1a0a2e] text-white py-12 md:py-16 overflow-hidden">
        <div className="container-custom relative z-10 text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 text-sm">
              <FaFlask /> {services.length} خدمة
            </span>
            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 text-sm">
              <FaUsers /> خبراء معتمدون
            </span>
            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 text-sm">
              <FaGraduationCap /> أكاديمي
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
            {selectedSection 
              ? getSectionName(selectedSection)
              : 'الخدمات الأكاديمية'
            }
          </h1>
          <p className="text-base md:text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
            {selectedSection
              ? `استعرض الخدمات المتاحة في قسم ${getSectionName(selectedSection)}`
              : 'خدمات أكاديمية متخصصة في مجالات متنوعة بأيدي خبراء أكاديميين وممارسين محترفين'
            }
          </p>

          {selectedSection && (
            <button
              onClick={goBack}
              className="mt-4 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full text-sm transition"
            >
              <FaArrowLeft /> العودة إلى جميع الخدمات
            </button>
          )}
        </div>
      </section>

      {/* ===== Filter ===== */}
      <section className="py-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container-custom">
          {/* الأقسام */}
          {!selectedSection && sections.filter(s => !s.parentId).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleSectionChange(null)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  !sectionId
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                جميع الأقسام
              </button>
              {sections
                .filter(s => !s.parentId)
                .map((section) => (
                  <button
                    key={section._id}
                    onClick={() => handleSectionChange(section._id)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      sectionId === section._id
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {getSectionName(section)}
                  </button>
                ))}
            </div>
          )}

          {/* البحث والتصفية */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute right-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث عن خدمة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={filterFeatured}
                  onChange={(e) => setFilterFeatured(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <FaStar className="text-amber-500" />
                المميزة فقط
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredServices.length} خدمة
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Services Grid ===== */}
      <section className="py-8 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          {error ? (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-400 text-center">
              <p>{error}</p>
              <button
                onClick={fetchServices}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-6xl mb-4 opacity-30">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {searchTerm || filterFeatured ? 'لا توجد خدمات تطابق البحث' : 'لا توجد خدمات في هذا القسم'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || filterFeatured ? 'جرب تغيير كلمات البحث' : 'سيتم إضافة الخدمات قريباً'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredServices.map((service, index) => (
                <div
                  key={service._id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:-translate-y-1 cursor-pointer group"
                  data-aos="fade-up"
                  data-aos-delay={index * 50}
                  onClick={() => window.location.href = `/service/${service._id}`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {getServiceIcon(service.icon)}
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2">
                      {getServiceName(service)}
                    </h3>
                    {service.isFeatured && (
                      <FaStar className="text-amber-500 mx-auto mt-1" />
                    )}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {formatPrice(service.pricing?.defaultPrice || 0)}
                    </div>
                    <div className="mt-3">
                      <span className="text-purple-600 dark:text-purple-400 text-sm font-semibold flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        عرض التفاصيل <FaEye className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Services;