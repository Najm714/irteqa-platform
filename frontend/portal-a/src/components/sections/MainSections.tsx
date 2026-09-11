// frontend/portal-a/src/components/sections/MainSections.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ============================================================
// واجهات البيانات
// ============================================================

interface Section {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  icon: string;
  slug: string;
  order: number;
  isPublished: boolean;
  parentId?: string | null;
  children?: Section[];
}

// ============================================================
// الأقسام الرئيسية الثابتة
// ============================================================

const MAIN_SECTIONS = [
  {
    id: 'main-explanations',
    title: 'الشروحات والملخصات',
    description: 'شروحات خصوصية وملخصات منظمة للمقررات الجامعية',
    icon: '📚',
    stats: 'مقررات جامعية',
    link: '/explanations',
    category: 'explanations',
  },
  {
    id: 'main-business',
    title: 'الأعمال والاقتصاد',
    description: 'خدمات متخصصة في الإدارة، التسويق، المالية والمحاسبة',
    icon: '💼',
    stats: 'خدمات متخصصة',
    link: '/business',
    category: 'business',
  },
  {
    id: 'main-research',
    title: 'البحث والترجمة والتصميم',
    description: 'ترجمة، تحليل إحصائي، تدقيق لغوي واستشارات بحثية',
    icon: '🔬',
    stats: 'خدمات أكاديمية',
    link: '/services',
    category: 'research',
  },
];

// ============================================================
// المكون الرئيسي
// ============================================================

const MainSections: React.FC = () => {
  const { token } = useAuth();
  const [dynamicSections, setDynamicSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  // ===== جلب الأقسام الديناميكية من API =====
  const fetchDynamicSections = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/sections?isPublished=true`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        const sortedSections = (data.data || [])
          .filter((s: Section) => s.isPublished)
          .sort((a: Section, b: Section) => a.order - b.order);
        
        setDynamicSections(sortedSections);
      } else {
        setError(data.message || 'حدث خطأ في تحميل الأقسام');
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
      setError('حدث خطأ في تحميل الأقسام');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicSections();
  }, []);

  // ===== الحصول على أيقونة القسم =====
  const getSectionIcon = (icon: string) => {
    const icons: { [key: string]: string } = {
      'fa-folder': '📁',
      'fa-folder-open': '📂',
      'fa-book': '📚',
      'fa-graduation-cap': '🎓',
      'fa-briefcase': '💼',
      'fa-heart': '❤️',
      'fa-star': '⭐',
      'fa-cog': '⚙️',
      'fa-university': '🏛️',
      'fa-school': '🏫',
      'fa-tag': '🏷️',
      'fa-flask': '🧪',
      'fa-file-alt': '📄',
      'fa-language': '🌐',
    };
    return icons[icon] || '📁';
  };

  // ===== الحصول على اسم القسم =====
  const getSectionName = (section: Section) => {
    return section.nameAr || section.name || 'قسم';
  };

  // ===== الحصول على وصف القسم =====
  const getSectionDescription = (section: Section) => {
    return section.descriptionAr || section.description || 'قسم متخصص في تقديم الخدمات';
  };

  // ===== تصنيف الأقسام الديناميكية =====
  const getDynamicSectionsByCategory = (category: string) => {
    return dynamicSections.filter(s => {
      if (!s.parentId) return false;
      
      const parentSection = dynamicSections.find(p => p._id === s.parentId);
      if (!parentSection) return false;
      
      const parentName = (parentSection.nameAr || parentSection.name || '').toLowerCase();
      
      switch (category) {
        case 'explanations':
          return parentName.includes('شرح') || parentName.includes('تعليم') || parentName.includes('جامعة');
        case 'business':
          return parentName.includes('عمل') || parentName.includes('اقتصاد') || parentName.includes('مال');
        case 'research':
          return parentName.includes('بحث') || parentName.includes('ترجم') || parentName.includes('تصميم');
        default:
          return false;
      }
    });
  };

  // ===== عرض حالة التحميل =====
  if (loading) {
    return (
      <section className="main-sections" id="sections">
        <div className="container-custom">
          <div className="section-header" data-aos="fade-up">
            <h2>الأقسام <span>الرئيسية</span></h2>
            <p>جاري تحميل الأقسام...</p>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    );
  }

  // ===== عرض الأقسام =====
  return (
    <section className="main-sections" id="sections">
      <div className="container-custom">
        <div className="section-header" data-aos="fade-up">
          <h2>الأقسام <span>الرئيسية</span></h2>
          <p>اختر القسم المناسب لاحتياجاتك واستكشف الخدمات المتخصصة</p>
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={fetchDynamicSections}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="sections-grid">
            {/* ✅ الأقسام الرئيسية الثابتة */}
            {MAIN_SECTIONS.map((mainSection, index) => {
              const subSections = getDynamicSectionsByCategory(mainSection.category);
              
              return (
                <div
                  key={mainSection.id}
                  className="section-card main-section-card"
                  data-aos="fade-up"
                  data-aos-delay={100 + index * 100}
                >
                  <Link to={mainSection.link} className="main-section-link">
                    <div className="card-icon">
                      <span style={{ fontSize: '2rem' }}>{mainSection.icon}</span>
                    </div>
                    <h3>{mainSection.title}</h3>
                    <p className="card-desc">{mainSection.description}</p>
                    <div className="card-stats">
                      <span>{mainSection.stats}</span>
                      {subSections.length > 0 && (
                        <span className="text-purple-600 dark:text-purple-400">
                          + {subSections.length} أقسام فرعية
                        </span>
                      )}
                    </div>
                    <span className="card-btn">
                      استعراض
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                        <path fill="currentColor" d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/>
                      </svg>
                    </span>
                  </Link>

                  {/* ✅ الأقسام الفرعية */}
                  {subSections.length > 0 && (
                    <div className="sub-sections">
                      <div className="sub-sections-divider"></div>
                      <div className="sub-sections-grid">
                        {subSections.map((subSection) => (
                          <Link
                            key={subSection._id}
                            to={`/services?section=${subSection._id}`}
                            className="sub-section-item"
                          >
                            <span className="sub-section-icon">
                              {getSectionIcon(subSection.icon)}
                            </span>
                            <span className="sub-section-name">
                              {getSectionName(subSection)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ✅ الأقسام الإضافية (التي ليس لها تصنيف) */}
        {dynamicSections.filter(s => !s.parentId).length > 0 && (
          <div className="extra-sections mt-12">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">
              أقسام إضافية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dynamicSections
                .filter(s => !s.parentId)
                .map((section) => (
                  <Link
                    key={section._id}
                    to={`/services?section=${section._id}`}
                    className="extra-section-card"
                    data-aos="fade-up"
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '1.5rem' }}>
                        {getSectionIcon(section.icon)}
                      </span>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {getSectionName(section)}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {getSectionDescription(section)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== ستايل CSS ===== */}
      <style>{`
        .main-section-card {
          display: flex;
          flex-direction: column;
        }
        
        .main-section-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        
        .sub-sections {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        
        .dark .sub-sections {
          border-top-color: rgba(255,255,255,0.05);
        }
        
        .sub-sections-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .sub-section-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.75rem;
          background: #f3f4f6;
          border-radius: 9999px;
          font-size: 0.75rem;
          color: #374151;
          text-decoration: none;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        
        .dark .sub-section-item {
          background: #1f2937;
          color: #d1d5db;
        }
        
        .sub-section-item:hover {
          background: #e5e7eb;
          border-color: #8b5cf6;
          color: #7c3aed;
          transform: translateY(-1px);
        }
        
        .dark .sub-section-item:hover {
          background: #374151;
          color: #a78bfa;
        }
        
        .sub-section-icon {
          font-size: 0.85rem;
        }
        
        .sub-section-name {
          font-weight: 500;
        }
        
        .extra-sections {
          padding-top: 2rem;
          border-top: 2px solid #e5e7eb;
        }
        
        .dark .extra-sections {
          border-top-color: #374151;
        }
        
        .extra-section-card {
          display: block;
          padding: 0.75rem 1rem;
          background: #f9fafb;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }
        
        .dark .extra-section-card {
          background: #1f2937;
          border-color: #374151;
        }
        
        .extra-section-card:hover {
          border-color: #8b5cf6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
        }
        
        .card-stats {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      `}</style>
    </section>
  );
};

export default MainSections;