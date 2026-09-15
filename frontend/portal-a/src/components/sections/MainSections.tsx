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
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  // ===== جلب الأقسام الديناميكية من API =====
  const fetchDynamicSections = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/sections?isPublished=true`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
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
    return (
      section.descriptionAr ||
      section.description ||
      'قسم متخصص في تقديم الخدمات'
    );
  };

  // ===== تصنيف الأقسام الديناميكية =====
  const getDynamicSectionsByCategory = (category: string) => {
    return dynamicSections.filter((s) => {
      if (!s.parentId) return false;

      const parentSection = dynamicSections.find(
        (p) => p._id === s.parentId
      );

      if (!parentSection) return false;

      const parentName = (
        parentSection.nameAr ||
        parentSection.name ||
        ''
      ).toLowerCase();

      switch (category) {
        case 'explanations':
          return (
            parentName.includes('شرح') ||
            parentName.includes('تعليم') ||
            parentName.includes('جامعة')
          );

        case 'business':
          return (
            parentName.includes('عمل') ||
            parentName.includes('اقتصاد') ||
            parentName.includes('مال')
          );

        case 'research':
          return (
            parentName.includes('بحث') ||
            parentName.includes('ترجم') ||
            parentName.includes('تصميم')
          );

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
          <div className="section-header">
            <span className="section-eyebrow">
              الخدمات الأكاديمية
            </span>

            <h2>
              الأقسام <span>الرئيسية</span>
            </h2>

            <p>جاري تحميل الأقسام...</p>
          </div>

          <div className="sections-grid sections-loading-grid">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="section-skeleton"
              >
                <div className="skeleton-icon"></div>
                <div className="skeleton-title"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ===== عرض الأقسام =====
  return (
    <section className="main-sections" id="sections">
      <div className="container-custom">

        {/* ====================================================
            عنوان القسم
        ==================================================== */}

        <div className="section-header enhanced-section-header">

          <span className="section-eyebrow">
            <span className="eyebrow-dot"></span>
            منصة ارتقاء الأكاديمية
          </span>

          <h2>
            الأقسام <span>الرئيسية</span>
          </h2>

          <p>
            اختر القسم المناسب لاحتياجاتك واستكشف الخدمات المتخصصة
            المقدمة من منصة ارتقاء
          </p>

          <div className="section-header-line"></div>
        </div>

        {error ? (
          <div className="section-error-card">
            <div className="error-icon">!</div>

            <p>{error}</p>

            <button
              onClick={fetchDynamicSections}
              className="retry-button"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="sections-grid">

            {/* ==================================================
                الأقسام الرئيسية الثابتة
            ================================================== */}

            {MAIN_SECTIONS.map((mainSection, index) => {
              const subSections =
                getDynamicSectionsByCategory(mainSection.category);

              return (
                <div
                  key={mainSection.id}
                  className="section-card main-section-card"
                  data-aos-delay={100 + index * 100}
                >

                  {/* شريط علوي زخرفي */}
                  <div className="card-top-line"></div>

                  {/* الرابط الرئيسي */}
                  <Link
                    to={mainSection.link}
                    className="main-section-link"
                  >

                    <div className="main-card-header">

                      <div className="card-icon main-card-icon">
                        <span>{mainSection.icon}</span>
                      </div>

                      <div className="main-card-badge">
                        أكاديمي
                      </div>

                    </div>

                    <div className="main-card-content">

                      <h3>{mainSection.title}</h3>

                      <p className="card-desc">
                        {mainSection.description}
                      </p>

                      <div className="card-stats">

                        <span className="stat-item">
                          <span className="stat-icon">📖</span>
                          {mainSection.stats}
                        </span>

                        {subSections.length > 0 && (
                          <span className="stat-item stat-primary">
                            <span className="stat-icon">▦</span>
                            {subSections.length} أقسام الخدمات الأكاديمية
                          </span>
                        )}

                      </div>

                    </div>

                    <div className="main-card-action">
                      <span>استعراض القسم</span>

                      <span className="action-arrow">
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
                    </div>

                  </Link>

                  {/* ==================================================
                      الأقسام الفرعية
                  ================================================== */}

                  {subSections.length > 0 && (
                    <div className="sub-sections">

                      <div className="sub-section-heading">
                        <div className="sub-heading-title">
                          <span className="sub-heading-icon">
                            ✦
                          </span>

                          <span>
                            أقسام الخدمات الأكاديمية
                          </span>
                        </div>

                        <span className="sub-heading-count">
                          {subSections.length}
                        </span>
                      </div>

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

                            <span className="sub-section-arrow">
                              ←
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

        {/* ====================================================
            الأقسام الإضافية
        ==================================================== */}

        {dynamicSections.filter((s) => !s.parentId).length > 0 && (
          <div className="extra-sections">

            <div className="extra-section-heading">
              <div>
                <span className="section-eyebrow">
                  الخدمات المتخصصة
                </span>

                <h3>
                  أقسام الخدمات الأكاديمية
                </h3>
              </div>

              <span className="extra-section-total">
                {
                  dynamicSections.filter((s) => !s.parentId).length
                }{' '}
                أقسام
              </span>
            </div>

            <div className="extra-sections-grid">
              {dynamicSections
                .filter((s) => !s.parentId)
                .map((section) => (
                  <Link
                    key={section._id}
                    to={`/services?section=${section._id}`}
                    className="extra-section-card"
                  >

                    <div className="extra-card-icon">
                      {getSectionIcon(section.icon)}
                    </div>

                    <div className="extra-card-content">
                      <h4>
                        {getSectionName(section)}
                      </h4>

                      <p>
                        {getSectionDescription(section)}
                      </p>
                    </div>

                    <span className="extra-card-arrow">
                      ←
                    </span>

                  </Link>
                ))}
            </div>

          </div>
        )}

      </div>

      {/* ========================================================
          التصميم
      ======================================================== */}

      <style>{`
        .main-sections {
          position: relative;
          padding: 5rem 0;
          overflow: hidden;
        }

        .main-sections::before {
          content: '';
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.035);
          top: -180px;
          right: -180px;
          pointer-events: none;
        }

        .main-sections::after {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(236, 72, 153, 0.025);
          bottom: -150px;
          left: -100px;
          pointer-events: none;
        }

        .enhanced-section-header {
          position: relative;
          z-index: 1;
          margin-bottom: 3rem;
        }

        .section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: #7c3aed;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          margin-bottom: 0.7rem;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }

        .section-header-line {
          width: 55px;
          height: 3px;
          border-radius: 99px;
          background: linear-gradient(
            90deg,
            #7c3aed,
            #ec4899
          );
          margin: 1.25rem auto 0;
        }

        .sections-grid {
          position: relative;
          z-index: 1;
        }

        .main-section-card {
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 1.5rem;
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid #e5e7eb;
          box-shadow:
            0 10px 35px rgba(17, 24, 39, 0.06),
            0 2px 8px rgba(17, 24, 39, 0.03);
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease,
            border-color 0.3s ease;
        }

        .main-section-card:hover {
          transform: translateY(-6px);
          border-color: rgba(139, 92, 246, 0.3);
          box-shadow:
            0 20px 50px rgba(124, 58, 237, 0.11),
            0 5px 15px rgba(17, 24, 39, 0.05);
        }

        .dark .main-section-card {
          background: rgba(17, 24, 39, 0.96);
          border-color: #374151;
          box-shadow:
            0 15px 40px rgba(0, 0, 0, 0.2);
        }

        .card-top-line {
          height: 4px;
          width: 100%;
          background: linear-gradient(
            90deg,
            #7c3aed,
            #a855f7,
            #ec4899
          );
        }

        .main-section-link {
          display: block;
          text-decoration: none;
          color: inherit;
          padding: 1.75rem 1.75rem 1.5rem;
        }

        .main-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .main-card-icon {
          width: 68px;
          height: 68px;
          border-radius: 1.25rem;
          background:
            linear-gradient(
              135deg,
              rgba(124, 58, 237, 0.12),
              rgba(236, 72, 153, 0.09)
            );
          border: 1px solid rgba(124, 58, 237, 0.12);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
          transition: transform 0.3s ease;
        }

        .main-section-card:hover .main-card-icon {
          transform: scale(1.06) rotate(-2deg);
        }

        .main-card-icon span {
          font-size: 2.1rem;
        }

        .main-card-badge {
          padding: 0.4rem 0.75rem;
          border-radius: 9999px;
          background: #f5f3ff;
          color: #7c3aed;
          border: 1px solid #ede9fe;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .dark .main-card-badge {
          background: rgba(124, 58, 237, 0.13);
          color: #c4b5fd;
          border-color: rgba(124, 58, 237, 0.2);
        }

        .main-card-content {
          margin-top: 1.4rem;
        }

        .main-card-content h3 {
          margin: 0;
          color: #111827;
          font-size: 1.45rem;
          line-height: 1.5;
          font-weight: 800;
        }

        .dark .main-card-content h3 {
          color: #f9fafb;
        }

        .card-desc {
          margin-top: 0.65rem;
          color: #6b7280;
          line-height: 1.8;
          font-size: 0.92rem;
        }

        .dark .card-desc {
          color: #9ca3af;
        }

        .card-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 1.1rem;
        }

        .stat-item {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.7rem;
          border-radius: 0.7rem;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          color: #6b7280;
          font-size: 0.74rem;
          font-weight: 600;
        }

        .dark .stat-item {
          background: #1f2937;
          border-color: #374151;
          color: #9ca3af;
        }

        .stat-icon {
          font-size: 0.82rem;
        }

        .stat-primary {
          color: #7c3aed;
          background: #faf5ff;
          border-color: #ede9fe;
        }

        .dark .stat-primary {
          color: #c4b5fd;
          background: rgba(124, 58, 237, 0.1);
          border-color: rgba(124, 58, 237, 0.18);
        }

        .main-card-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 1.4rem;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
          color: #7c3aed;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .dark .main-card-action {
          border-top-color: #374151;
          color: #a78bfa;
        }

        .action-arrow {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f3ff;
          transition:
            transform 0.25s ease,
            background 0.25s ease;
        }

        .dark .action-arrow {
          background: rgba(124, 58, 237, 0.12);
        }

        .action-arrow svg {
          width: 0.7rem;
          height: 0.7rem;
        }

        .main-section-card:hover .action-arrow {
          transform: translateX(-4px);
          background: #ede9fe;
        }

        .sub-sections {
          margin: 0 1.75rem 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid #f3f4f6;
        }

        .dark .sub-sections {
          border-top-color: #374151;
        }

        .sub-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.8rem;
        }

        .sub-heading-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #374151;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .dark .sub-heading-title {
          color: #d1d5db;
        }

        .sub-heading-icon {
          color: #8b5cf6;
        }

        .sub-heading-count {
          min-width: 26px;
          height: 26px;
          padding: 0 0.45rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: #f5f3ff;
          color: #7c3aed;
          font-size: 0.72rem;
          font-weight: 800;
        }

        .dark .sub-heading-count {
          background: rgba(124, 58, 237, 0.13);
          color: #c4b5fd;
        }

        .sub-sections-divider {
          display: none;
        }

        .sub-sections-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.55rem;
        }

        .sub-section-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
          padding: 0.65rem 0.7rem;
          border-radius: 0.8rem;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          color: #374151;
          text-decoration: none;
          transition:
            all 0.2s ease;
        }

        .dark .sub-section-item {
          background: #1f2937;
          border-color: #374151;
          color: #d1d5db;
        }

        .sub-section-item:hover {
          background: #faf5ff;
          border-color: #ddd6fe;
          color: #7c3aed;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(124, 58, 237, 0.07);
        }

        .dark .sub-section-item:hover {
          background: rgba(124, 58, 237, 0.1);
          border-color: rgba(124, 58, 237, 0.3);
          color: #c4b5fd;
        }

        .sub-section-icon {
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.55rem;
          background: white;
          font-size: 0.9rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .dark .sub-section-icon {
          background: #111827;
        }

        .sub-section-name {
          flex: 1;
          min-width: 0;
          font-size: 0.76rem;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sub-section-arrow {
          color: #9ca3af;
          font-size: 0.8rem;
          transition: transform 0.2s ease;
        }

        .sub-section-item:hover .sub-section-arrow {
          transform: translateX(-3px);
          color: #8b5cf6;
        }

        .extra-sections {
          position: relative;
          z-index: 1;
          margin-top: 3rem;
          padding: 2rem;
          border-radius: 1.5rem;
          background: linear-gradient(
            135deg,
            #fafafa,
            #ffffff
          );
          border: 1px solid #e5e7eb;
        }

        .dark .extra-sections {
          background: linear-gradient(
            135deg,
            #111827,
            #1f2937
          );
          border-color: #374151;
        }

        .extra-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .extra-section-heading .section-eyebrow {
          margin-bottom: 0.2rem;
        }

        .extra-section-heading h3 {
          margin: 0;
          color: #111827;
          font-size: 1.2rem;
          font-weight: 800;
        }

        .dark .extra-section-heading h3 {
          color: #f9fafb;
        }

        .extra-section-total {
          padding: 0.45rem 0.8rem;
          border-radius: 9999px;
          background: #f5f3ff;
          color: #7c3aed;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .dark .extra-section-total {
          background: rgba(124, 58, 237, 0.12);
          color: #c4b5fd;
        }

        .extra-sections-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.8rem;
        }

        .extra-section-card {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          min-width: 0;
          padding: 1rem;
          border-radius: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          text-decoration: none;
          color: inherit;
          transition: all 0.25s ease;
        }

        .dark .extra-section-card {
          background: #1f2937;
          border-color: #374151;
        }

        .extra-section-card:hover {
          transform: translateY(-3px);
          border-color: #c4b5fd;
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.08);
        }

        .extra-card-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.8rem;
          background: #f5f3ff;
          font-size: 1.25rem;
        }

        .dark .extra-card-icon {
          background: rgba(124, 58, 237, 0.12);
        }

        .extra-card-content {
          flex: 1;
          min-width: 0;
        }

        .extra-card-content h4 {
          margin: 0;
          color: #111827;
          font-size: 0.88rem;
          font-weight: 750;
        }

        .dark .extra-card-content h4 {
          color: #f3f4f6;
        }

        .extra-card-content p {
          margin: 0.25rem 0 0;
          color: #9ca3af;
          font-size: 0.72rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .extra-card-arrow {
          color: #9ca3af;
          transition: transform 0.2s ease;
        }

        .extra-section-card:hover .extra-card-arrow {
          transform: translateX(-4px);
          color: #8b5cf6;
        }

        /* ======================================================
           Loading Skeleton
        ====================================================== */

        .sections-loading-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }

        .section-skeleton {
          min-height: 250px;
          padding: 1.5rem;
          border-radius: 1.5rem;
          background: #ffffff;
          border: 1px solid #e5e7eb;
        }

        .dark .section-skeleton {
          background: #111827;
          border-color: #374151;
        }

        .skeleton-icon,
        .skeleton-title,
        .skeleton-line {
          border-radius: 0.6rem;
          background: linear-gradient(
            90deg,
            #f3f4f6,
            #e5e7eb,
            #f3f4f6
          );
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }

        .dark .skeleton-icon,
        .dark .skeleton-title,
        .dark .skeleton-line {
          background: linear-gradient(
            90deg,
            #1f2937,
            #374151,
            #1f2937
          );
          background-size: 200% 100%;
        }

        .skeleton-icon {
          width: 62px;
          height: 62px;
          border-radius: 1rem;
        }

        .skeleton-title {
          width: 65%;
          height: 22px;
          margin-top: 1.4rem;
        }

        .skeleton-line {
          width: 90%;
          height: 12px;
          margin-top: 0.8rem;
        }

        .skeleton-line.short {
          width: 55%;
        }

        @keyframes skeleton-loading {
          0% {
            background-position: 200% 0;
          }

          100% {
            background-position: -200% 0;
          }
        }

        /* ======================================================
           Error
        ====================================================== */

        .section-error-card {
          position: relative;
          z-index: 1;
          max-width: 550px;
          margin: 0 auto;
          padding: 2rem;
          text-align: center;
          border-radius: 1.25rem;
          background: #fff;
          border: 1px solid #fee2e2;
          box-shadow: 0 10px 30px rgba(127, 29, 29, 0.05);
        }

        .dark .section-error-card {
          background: #1f2937;
          border-color: #7f1d1d;
        }

        .error-icon {
          width: 42px;
          height: 42px;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #fef2f2;
          color: #dc2626;
          font-size: 1.2rem;
          font-weight: 800;
        }

        .dark .error-icon {
          background: rgba(220, 38, 38, 0.12);
          color: #f87171;
        }

        .section-error-card p {
          color: #ef4444;
          margin: 0;
        }

        .retry-button {
          margin-top: 1rem;
          padding: 0.6rem 1.3rem;
          border: 0;
          border-radius: 0.75rem;
          background: linear-gradient(
            135deg,
            #7c3aed,
            #9333ea
          );
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .retry-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.2);
        }

        /* ======================================================
           Responsive
        ====================================================== */

        @media (max-width: 1024px) {
          .extra-sections-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sub-sections-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .main-sections {
            padding: 3.5rem 0;
          }

          .main-section-link {
            padding: 1.3rem;
          }

          .sub-sections {
            margin: 0 1.3rem 1.3rem;
          }

          .main-card-content h3 {
            font-size: 1.2rem;
          }

          .extra-sections {
            padding: 1.3rem;
            margin-top: 2rem;
          }

          .extra-sections-grid {
            grid-template-columns: 1fr;
          }

          .extra-section-heading {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .main-card-header {
            align-items: flex-start;
          }

          .main-card-badge {
            font-size: 0.65rem;
          }

          .main-card-icon {
            width: 58px;
            height: 58px;
          }

          .main-card-icon span {
            font-size: 1.8rem;
          }

          .card-stats {
            flex-direction: column;
            align-items: stretch;
          }

          .stat-item {
            width: fit-content;
          }

          .sub-section-item {
            padding: 0.6rem;
          }
        }
      `}</style>
    </section>
  );
};

export default MainSections;