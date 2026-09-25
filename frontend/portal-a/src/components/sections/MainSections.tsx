// frontend/portal-a/src/components/sections/MainSections.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MainSections.css';

// ============================================================
// ✅ Helpers
// ============================================================
const resolvePortalId = (): string => {
  const envId = import.meta.env.VITE_PORTAL_ID;
  if (envId) return envId;
  const pathMatch = window.location.pathname.match(/\/portal\/([^/]+)/);
  if (pathMatch?.[1]) return pathMatch[1];
  const host = window.location.hostname;
  if (host !== 'localhost' && host.includes('.')) {
    const sub = host.split('.')[0];
    if (sub && sub !== 'www') return sub;
  }
  return '';
};

// ============================================================
// ✅ Types
// ============================================================
interface Section {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  icon: string;
  slug: string;
  category?: string;
  order: number;
  isPublished: boolean;
  parentId?: string | null;
  children?: Section[];
}

interface MainSectionConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  stats: string;
  link: string;
  category: string;
  matchSlugs?: string[];
  matchParentIds?: string[];
}

// ============================================================
// ✅ الأقسام الرئيسية الثابتة
// ============================================================
const MAIN_SECTIONS: MainSectionConfig[] = [
  {
    id: 'main-explanations',
    title: 'الشروحات والملخصات',
    description: 'شروحات خصوصية وملخصات منظمة للمقررات الجامعية',
    icon: '📚',
    stats: 'مقررات جامعية',
    link: '/explanations',
    category: 'explanations',
    matchSlugs: ['explanations', 'sharh', 'shurooh', 'ملخصات', 'شروحات'],
  },
];

// ============================================================
// ✅ الأيقونات
// ============================================================
const SECTION_ICONS: Record<string, string> = {
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
  'fa-pen': '✏️',
  'fa-bookmark': '🔖',
  'fa-laptop': '💻',
  'fa-chart-line': '📈',
  'fa-lightbulb': '💡',
  'fa-atom': '⚛️',
  'fa-calculator': '🧮',
  'fa-microscope': '🔬',
  'fa-palette': '🎨',
  'fa-music': '🎵',
  'fa-code': '💻',
};

// ============================================================
// ✅ نمط افتراضي (يُستبدل من الأدمن)
// ============================================================
const DEFAULT_STYLE = {
  header: {
    enabled: true,
    eyebrow: 'الخدمات الأكاديمية',
    title: 'الأقسام',
    titleHighlight: 'الرئيسية',
    description:
      'اختر القسم المناسب لاحتياجاتك واستكشف الخدمات المتخصصة المقدمة من منصة ارتقاء',
    alignment: 'center',
    showLine: true,
    showEyebrowDot: true,
  },
  colors: {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#a855f7',
    sectionBg: 'transparent',
    cardBg: '#ffffff',
    cardBgDark: '#111827',
    titleColor: '#111827',
    titleColorDark: '#f9fafb',
    descriptionColor: '#6b7280',
    descriptionColorDark: '#9ca3af',
    borderColor: '#e5e7eb',
    borderColorDark: '#374151',
    gradientStart: '#7c3aed',
    gradientEnd: '#ec4899',
  },
  background: { type: 'none', value: '', gradientColors: [], opacity: 1, pattern: 'none' },
  card: {
    style: 'elevated',
    borderRadius: 24,
    shadow: 'lg',
    hoverEffect: 'lift',
    borderWidth: 1,
    padding: 28,
  },
  layout: {
    gridColumns: 3,
    gap: 16,
    maxWidth: 1200,
    paddingVertical: 80,
    showDecorCircles: true,
  },
  icons: { size: 'md', style: 'rounded', background: 'gradient' },
  typography: {
    titleSize: 24,
    descriptionSize: 15,
    fontFamily: 'inherit',
    titleWeight: 800,
  },
  animations: { enabled: true, type: 'fade', duration: 500, stagger: true },
};

// ============================================================
// ✅ Helper: بناء style الخلفية
// ============================================================
const buildBackgroundStyle = (background: any): React.CSSProperties => {
  const style: React.CSSProperties = {};

  switch (background?.type) {
    case 'solid':
      if (background.value) style.background = background.value;
      break;
    case 'gradient':
      if (background.gradientColors?.length >= 2) {
        style.background = `linear-gradient(135deg, ${background.gradientColors.join(', ')})`;
      }
      break;
    case 'image':
      if (background.value) {
        style.backgroundImage = `url(${background.value})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      }
      break;
    default:
      break;
  }

  if (background?.opacity !== undefined && background.opacity < 1) {
    style.opacity = background.opacity;
  }

  return style;
};

// ============================================================
// ✅ Helper: تحويل Shadow
// ============================================================
const getShadowValue = (shadow: string): string => {
  const shadows: Record<string, string> = {
    none: 'none',
    sm: '0 1px 3px rgba(0,0,0,0.08)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 10px 35px rgba(17,24,39,0.06), 0 2px 8px rgba(17,24,39,0.03)',
    xl: '0 20px 50px rgba(17,24,39,0.12), 0 5px 15px rgba(17,24,39,0.05)',
  };
  return shadows[shadow] || shadows.lg;
};

// ============================================================
// ✅ Helper: تحويل Icon Size
// ============================================================
const getIconSize = (size: string): string => {
  return { sm: '48px', md: '58px', lg: '68px', xl: '80px' }[size] || '58px';
};

// ============================================================
// ✅ المكوّن الرئيسي
// ============================================================
const MainSections: React.FC = () => {
  const { token } = useAuth();
  const [dynamicSections, setDynamicSections] = useState<Section[]>([]);
  const [styleConfig, setStyleConfig] = useState<any>(DEFAULT_STYLE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = resolvePortalId();

  // ============================================================
  // ✅ جلب الأقسام + النمط بالتوازي
  // ============================================================
  const fetchAll = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      const headers = {
        'Content-Type': 'application/json',
        'X-Portal-Id': PORTAL_ID,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [sectionsRes, styleRes] = await Promise.all([
        fetch(`${API_URL}/sections?isPublished=true`, { headers }),
        fetch(`${API_URL}/appearance/sections`, { headers }).catch(() => null),
      ]);

      if (!sectionsRes.ok) {
        throw new Error(`HTTP ${sectionsRes.status}`);
      }

      const sectionsData = await sectionsRes.json();
      const styleData = styleRes
        ? await styleRes.json().catch(() => ({ success: false }))
        : { success: false };

      if (!mountedRef.current) return;

      if (sectionsData.success) {
        const sortedSections = (sectionsData.data || [])
          .filter((s: Section) => s.isPublished)
          .sort((a: Section, b: Section) => a.order - b.order);
        setDynamicSections(sortedSections);
        setError(null);
      } else {
        setError(sectionsData.message || 'حدث خطأ في تحميل الأقسام');
      }

      if (styleData.success && styleData.data) {
        setStyleConfig({ ...DEFAULT_STYLE, ...styleData.data });
      }
    } catch (err: any) {
      console.error('❌ Error fetching sections:', err);
      if (mountedRef.current) {
        setError(
          err.message?.includes('fetch')
            ? 'تعذر الاتصال بالخادم'
            : 'حدث خطأ في تحميل الأقسام'
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
      isFetchingRef.current = false;
    }
  }, [API_URL, PORTAL_ID, token]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAll]);

  // ============================================================
  // ✅ Helpers
  // ============================================================
  const getSectionIcon = (icon: string): string =>
    SECTION_ICONS[icon] || '📁';

  const getSectionName = (section: Section): string =>
    section.nameAr || section.name || 'قسم';

  const getSectionDescription = (section: Section): string =>
    section.descriptionAr ||
    section.description ||
    'قسم متخصص في تقديم الخدمات';

  const getDynamicSectionsByCategory = useCallback(
    (category: string): Section[] => {
      const mainSection = MAIN_SECTIONS.find((m) => m.category === category);
      if (!mainSection) return [];

      return dynamicSections.filter((s) => {
        if (!s.parentId) return false;
        const parent = dynamicSections.find((p) => p._id === s.parentId);
        if (!parent) return false;
        return (
          mainSection.matchSlugs?.includes(parent.slug) ||
          mainSection.matchParentIds?.includes(parent._id)
        );
      });
    },
    [dynamicSections]
  );

  // ============================================================
  // ✅ CSS Variables محسوبة
  // ============================================================
  const cssVars = useMemo(() => {
    const c = styleConfig.colors || {};
    const l = styleConfig.layout || {};
    const cd = styleConfig.card || {};
    const t = styleConfig.typography || {};
    const i = styleConfig.icons || {};

    return {
      // Colors
      '--ms-primary': c.primary,
      '--ms-secondary': c.secondary,
      '--ms-accent': c.accent,
      '--ms-card-bg': c.cardBg,
      '--ms-card-bg-dark': c.cardBgDark,
      '--ms-title-color': c.titleColor,
      '--ms-title-color-dark': c.titleColorDark,
      '--ms-desc-color': c.descriptionColor,
      '--ms-desc-color-dark': c.descriptionColorDark,
      '--ms-border-color': c.borderColor,
      '--ms-border-color-dark': c.borderColorDark,
      '--ms-gradient-start': c.gradientStart,
      '--ms-gradient-end': c.gradientEnd,

      // Card
      '--ms-card-radius': `${cd.borderRadius}px`,
      '--ms-card-shadow': getShadowValue(cd.shadow),
      '--ms-card-border-width': `${cd.borderWidth}px`,
      '--ms-card-padding': `${cd.padding}px`,

      // Layout
      '--ms-grid-cols': l.gridColumns,
      '--ms-gap': `${l.gap}px`,
      '--ms-max-width': `${l.maxWidth}px`,
      '--ms-padding-v': `${l.paddingVertical}px`,

      // Icons
      '--ms-icon-size': getIconSize(i.size),

      // Typography
      '--ms-title-size': `${t.titleSize}px`,
      '--ms-desc-size': `${t.descriptionSize}px`,
      '--ms-title-weight': t.titleWeight,
      '--ms-font-family': t.fontFamily,

      // Animations
      '--ms-anim-duration': `${styleConfig.animations?.duration || 500}ms`,
    } as React.CSSProperties;
  }, [styleConfig]);

  // ============================================================
  // ✅ Helper: تصنيف hover
  // ============================================================
  const hoverClass = `ms-hover-${styleConfig.card?.hoverEffect || 'lift'}`;
  const cardStyle = `ms-card-${styleConfig.card?.style || 'elevated'}`;
  const bgStyle = buildBackgroundStyle(styleConfig.background);
  const alignment = styleConfig.header?.alignment || 'center';

  // ============================================================
  // ✅ Loading
  // ============================================================
  if (loading) {
    return (
      <section
        className="main-sections ms-loading"
        id="sections"
        style={{ ...cssVars, ...bgStyle }}
      >
        <div className="container-custom" style={{ maxWidth: cssVars['--ms-max-width'] }}>
          <div className={`section-header ms-align-${alignment}`}>
            <span className="section-eyebrow">جاري التحميل...</span>
          </div>

          <div
            className="sections-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${styleConfig.layout?.gridColumns || 3}, minmax(0, 1fr))`,
              gap: 'var(--ms-gap)',
            }}
          >
            {[1, 2, 3].map((item) => (
              <div key={item} className="section-skeleton">
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

  // ============================================================
  // ✅ Render
  // ============================================================
  const extraSections = dynamicSections.filter((s) => !s.parentId);

  return (
    <section
      className="main-sections"
      id="sections"
      style={{ ...cssVars, ...bgStyle }}
      data-card-style={cardStyle}
      data-hover={hoverClass}
    >
      {/* ✅ دوائر زخرفية */}
      {styleConfig.layout?.showDecorCircles && (
        <>
          <div className="ms-decor ms-decor-1" aria-hidden="true" />
          <div className="ms-decor ms-decor-2" aria-hidden="true" />
        </>
      )}

      <div
        className="container-custom"
        style={{ maxWidth: cssVars['--ms-max-width'] }}
      >
        {/* ====================================================
            Header
        ==================================================== */}
        {styleConfig.header?.enabled !== false && (
          <div className={`section-header enhanced-section-header ms-align-${alignment}`}>
            <span className="section-eyebrow">
              {styleConfig.header?.showEyebrowDot && (
                <span className="eyebrow-dot"></span>
              )}
              {styleConfig.header?.eyebrow}
            </span>

            <h2>
              {styleConfig.header?.title}{' '}
              <span>{styleConfig.header?.titleHighlight}</span>
            </h2>

            {styleConfig.header?.description && (
              <p>{styleConfig.header.description}</p>
            )}

            {styleConfig.header?.showLine && (
              <div className="section-header-line"></div>
            )}
          </div>
        )}

        {/* ====================================================
            Error
        ==================================================== */}
        {error ? (
          <div className="section-error-card">
            <div className="error-icon">!</div>
            <p>{error}</p>
            <button
              onClick={fetchAll}
              className="retry-button"
              disabled={isFetchingRef.current}
            >
              {isFetchingRef.current ? 'جاري المحاولة...' : 'إعادة المحاولة'}
            </button>
          </div>
        ) : (
          <div className="sections-grid">
            {MAIN_SECTIONS.map((mainSection, index) => {
              const subSections = getDynamicSectionsByCategory(
                mainSection.category
              );

              return (
                <div
                  key={mainSection.id}
                  className={`section-card main-section-card ${cardStyle} ${hoverClass}`}
                  style={{
                    animationDelay: styleConfig.animations?.stagger
                      ? `${index * 100}ms`
                      : '0ms',
                  }}
                >
                  <div className="card-top-line"></div>

                  <Link to={mainSection.link} className="main-section-link">
                    <div className="main-card-header">
                      <div className="card-icon main-card-icon">
                        <span>{mainSection.icon}</span>
                      </div>
                      <div className="main-card-badge">أكاديمي</div>
                    </div>

                    <div className="main-card-content">
                      <h3>{mainSection.title}</h3>
                      <p className="card-desc">{mainSection.description}</p>

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

                  {subSections.length > 0 && (
                    <div className="sub-sections">
                      <div className="sub-section-heading">
                        <div className="sub-heading-title">
                          <span className="sub-heading-icon">✦</span>
                          <span>أقسام الخدمات الأكاديمية</span>
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
                            <span className="sub-section-arrow">←</span>
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
            Extra Sections
        ==================================================== */}
        {extraSections.length > 0 && (
          <div className="extra-sections">
            <div className="extra-section-heading">
              <div>
                <span className="section-eyebrow">الخدمات المتخصصة</span>
                <h3>أقسام الخدمات الأكاديمية</h3>
              </div>
              <span className="extra-section-total">
                {extraSections.length} أقسام
              </span>
            </div>

            <div className="extra-sections-grid">
              {extraSections.map((section) => (
                <Link
                  key={section._id}
                  to={`/services?section=${section._id}`}
                  className={`extra-section-card ${cardStyle} ${hoverClass}`}
                >
                  <div className="extra-card-icon">
                    {getSectionIcon(section.icon)}
                  </div>
                  <div className="extra-card-content">
                    <h4>{getSectionName(section)}</h4>
                    <p>{getSectionDescription(section)}</p>
                  </div>
                  <span className="extra-card-arrow">←</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MainSections;