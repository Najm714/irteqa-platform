// frontend/portal-a/src/components/sections/MainSections.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ============================================================
// واجهة البيانات
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
// المكون الرئيسي
// ============================================================

const MainSections: React.FC = () => {
  const { token } = useAuth();

  const [dynamicSections, setDynamicSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  // ============================================================
  // جلب الأقسام الديناميكية من API
  // ============================================================

  const fetchDynamicSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/sections?isPublished=true`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            'X-Portal-Id': PORTAL_ID,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const sections = (data.data || [])
          .filter((section: Section) => {
            // فقط الأقسام الفرعية الديناميكية
            return section.isPublished && !!section.parentId;
          })
          .sort(
            (a: Section, b: Section) =>
              (a.order || 0) - (b.order || 0)
          );

        setDynamicSections(sections);
      } else {
        setError(
          data.message || 'حدث خطأ في تحميل أقسام الخدمات الأكاديمية'
        );
      }
    } catch (err) {
      console.error(
        '❌ Error fetching academic service sections:',
        err
      );

      setError('حدث خطأ في تحميل أقسام الخدمات الأكاديمية');
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, PORTAL_ID]);

  useEffect(() => {
    fetchDynamicSections();
  }, [fetchDynamicSections]);

  // ============================================================
  // الحصول على أيقونة القسم
  // ============================================================

  const getSectionIcon = (icon: string) => {
    const icons: Record<string, string> = {
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

  // ============================================================
  // الحصول على اسم القسم
  // ============================================================

  const getSectionName = (section: Section) => {
    return section.nameAr || section.name || 'قسم';
  };

  // ============================================================
  // الحصول على وصف القسم
  // ============================================================

  const getSectionDescription = (section: Section) => {
    return (
      section.descriptionAr ||
      section.description ||
      'قسم متخصص في تقديم الخدمات الأكاديمية'
    );
  };

  // ============================================================
  // حالة التحميل
  // ============================================================

  if (loading) {
    return (
      <section className="main-sections" id="sections">
        <div className="container-custom">
          <div className="section-header">
            <h2>
              أقسام <span>الخدمات الأكاديمية</span>
            </h2>

            <p>جاري تحميل أقسام الخدمات الأكاديمية...</p>
          </div>

          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // العرض الرئيسي
  // ============================================================

  return (
    <section className="main-sections" id="sections">
      <div className="container-custom">

        {/* ======================================================
            العنوان
        ====================================================== */}

        <div className="section-header">
          <h2>
            أقسام <span>الخدمات الأكاديمية</span>
          </h2>

          <p>
            استكشف أقسام الخدمات الأكاديمية واختر الخدمة المناسبة
            لاحتياجاتك
          </p>
        </div>

        {/* ======================================================
            حالة الخطأ
        ====================================================== */}

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
        ) : dynamicSections.length === 0 ? (

          /* ====================================================
             لا توجد أقسام
          ==================================================== */

          <div className="text-center py-12">
            <div className="text-5xl mb-4">📚</div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              لا توجد أقسام متاحة حاليًا
            </h3>

            <p className="text-gray-500 dark:text-gray-400">
              سيتم عرض أقسام الخدمات الأكاديمية هنا عند إضافتها.
            </p>
          </div>

        ) : (

          /* ====================================================
             الأقسام الفرعية الديناميكية فقط
          ==================================================== */

          <div className="sections-grid">
            {dynamicSections.map((section, index) => (
              <Link
                key={section._id}
                to={`/services?section=${section._id}`}
                className="section-card academic-section-card"
                data-aos="fade-up"
                data-aos-delay={100 + index * 50}
              >
                <div className="card-icon">
                  <span style={{ fontSize: '2rem' }}>
                    {getSectionIcon(section.icon)}
                  </span>
                </div>

                <h3>{getSectionName(section)}</h3>

                <p className="card-desc">
                  {getSectionDescription(section)}
                </p>

                <span className="card-btn">
                  استعراض الخدمات

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                  >
                    <path
                      fill="currentColor"
                      d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"
                    />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          CSS
      ======================================================== */}

      <style>{`
        .academic-section-card {
          display: block;
          text-decoration: none;
          color: inherit;
          transition: all 0.25s ease;
        }

        .academic-section-card:hover {
          transform: translateY(-4px);
        }

        .academic-section-card .card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .academic-section-card .card-desc {
          min-height: 48px;
        }

        .academic-section-card .card-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .academic-section-card .card-btn svg {
          width: 0.85rem;
          height: 0.85rem;
          transition: transform 0.2s ease;
        }

        .academic-section-card:hover .card-btn svg {
          transform: translateX(-3px);
        }
      `}</style>
    </section>
  );
};

export default MainSections;