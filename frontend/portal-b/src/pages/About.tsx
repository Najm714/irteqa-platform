// frontend/portal-a/src/pages/About.tsx

import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import { useAuth } from '../context/AuthContext';

import {
  FaSpinner,
  FaInfoCircle,
  FaUsers,
  FaChartBar,
  FaAward,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaLinkedin,
  FaWhatsapp,
  FaClock,
  FaStar,
  FaStarHalf,
  FaBuilding,
  FaGlobe,
  FaFileAlt,
  FaBullseye,
  FaEye,
  FaBookOpen,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaChevronLeft,
  FaRocket,
  FaQuoteRight,
} from 'react-icons/fa';

// ============================================================
// Types
// ============================================================

interface FileReference {
  _id?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  storageKey?: string;
}

interface AboutValue {
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  icon?: string;
  order?: number;
}

interface AboutStat {
  label?: string;
  labelAr?: string;
  value?: string | number;
  icon?: string;
  order?: number;
}

interface AboutTeamMember {
  name?: string;
  nameAr?: string;
  position?: string;
  positionAr?: string;
  bio?: string;
  bioAr?: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  isActive?: boolean;
  order?: number;
  imageId?: string | FileReference;
}

interface AboutAchievement {
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  date?: string;
  isActive?: boolean;
  order?: number;
  imageId?: string | FileReference;
}

interface AboutTestimonial {
  name?: string;
  nameAr?: string;
  position?: string;
  positionAr?: string;
  content?: string;
  contentAr?: string;
  rating?: number;
  isActive?: boolean;
  order?: number;
  imageId?: string | FileReference;
}

interface SocialMedia {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
}

interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  addressAr?: string;
  mapUrl?: string;
  workingHours?: string;
  workingHoursAr?: string;
  socialMedia?: SocialMedia;
}

interface AboutData {
  _id?: string;

  platformName?: string;
  platformNameAr?: string;

  platformDescription?: string;
  platformDescriptionAr?: string;

  platformLogo?: string | FileReference;
  platformCover?: string | FileReference;

  story?: string;
  storyAr?: string;

  foundedDate?: string;

  vision?: string;
  visionAr?: string;

  mission?: string;
  missionAr?: string;

  values?: AboutValue[];
  stats?: AboutStat[];

  team?: AboutTeamMember[];
  achievements?: AboutAchievement[];
  testimonials?: AboutTestimonial[];

  contactInfo?: ContactInfo;

  profileFileId?: string | FileReference;

  isPublished?: boolean;
}

// ============================================================
// Helpers
// ============================================================

const getFileId = (
  file: string | FileReference | null | undefined
): string | null => {
  if (!file) return null;

  if (typeof file === 'string') {
    return file;
  }

  return file._id || null;
};

const text = (
  arabic?: string,
  english?: string,
  fallback = ''
): string => {
  return (
    arabic?.trim() ||
    english?.trim() ||
    fallback
  );
};

const ordered = <T extends { order?: number }>(
  items?: T[]
): T[] => {
  if (!Array.isArray(items)) return [];

  return [...items].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
};

// ============================================================
// Component
// ============================================================

const About: React.FC = () => {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);

  const [about, setAbout] =
    useState<AboutData | null>(null);

  const [activeTab, setActiveTab] =
    useState('overview');

  const [error, setError] = useState('');

  // ============================================================
  // Environment
  // ============================================================

  const API_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:5001/api';

  const PORTAL_ID =
    import.meta.env.VITE_PORTAL_ID || '';

  // ============================================================
  // File URL
  // ============================================================

  const getAboutFileUrl = useCallback(
    (
      file:
        | string
        | FileReference
        | null
        | undefined
    ) => {
      const fileId = getFileId(file);

      if (!fileId || !token) {
        return '';
      }

      const params = new URLSearchParams({
        token,
        portalId: PORTAL_ID,
      });

      return `${API_URL}/about/file/${encodeURIComponent(
        fileId
      )}?${params.toString()}`;
    },
    [API_URL, PORTAL_ID, token]
  );

  // ============================================================
  // Fetch
  // ============================================================

  const fetchAbout = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError(
        'لم يتم العثور على جلسة تسجيل الدخول.'
      );
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/about`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
            Accept: 'application/json',
          },
        }
      );

      const rawText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          `About API failed: ${response.status}`
        );
      }

      const data = JSON.parse(rawText);

      if (
        data.success &&
        data.data
      ) {
        setAbout(data.data);
      } else {
        setAbout(null);
        setError(
          data.message ||
            'لا توجد بيانات متاحة.'
        );
      }
    } catch (err) {
      console.error(
        '❌ Error fetching About:',
        err
      );

      setAbout(null);

      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تحميل البيانات.'
      );
    } finally {
      setLoading(false);
    }
  }, [
    API_URL,
    PORTAL_ID,
    token,
  ]);

  useEffect(() => {
    fetchAbout();
  }, [fetchAbout]);

  // ============================================================
  // Date
  // ============================================================

  const formatDate = (
    date?: string
  ) => {
    if (!date) return '';

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return '';
    }

    return parsed.toLocaleDateString(
      'ar-SA',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };

  // ============================================================
  // Stars
  // ============================================================

  const renderStars = (
    rating?: number
  ) => {
    const safe = Math.max(
      0,
      Math.min(
        5,
        Number(rating) || 0
      )
    );

    return Array.from(
      { length: 5 },
      (_, index) => {
        const number =
          index + 1;

        if (
          number <=
          Math.floor(safe)
        ) {
          return (
            <FaStar
              key={number}
              className="w-3.5 h-3.5 text-amber-400"
            />
          );
        }

        if (
          number - safe > 0 &&
          number - safe < 1
        ) {
          return (
            <FaStarHalf
              key={number}
              className="w-3.5 h-3.5 text-amber-400"
            />
          );
        }

        return (
          <FaStar
            key={number}
            className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700"
          />
        );
      }
    );
  };

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"
      >
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
            <FaSpinner className="w-6 h-6 text-purple-600 animate-spin" />
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            جاري تحميل المعلومات...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Empty
  // ============================================================

  if (!about) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4"
      >
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm">
          <FaInfoCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />

          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            تعذر تحميل الصفحة
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            {error ||
              'لا توجد بيانات متاحة حالياً.'}
          </p>

          <button
            onClick={fetchAbout}
            className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Published
  // ============================================================

  if (
    about.isPublished === false
  ) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4"
      >
        <div className="max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800">
          <FaInfoCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />

          <h2 className="text-lg font-bold mb-2">
            الصفحة غير منشورة
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            صفحة نبذة عنا غير متاحة حالياً.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Data
  // ============================================================

  const platformName =
    text(
      about.platformNameAr,
      about.platformName,
      'منصة ارتقاء'
    );

  const description =
    text(
      about.platformDescriptionAr,
      about.platformDescription
    );

  const values =
    ordered(about.values);

  const stats =
    ordered(about.stats);

  const team =
    ordered(about.team).filter(
      (member) =>
        member.isActive !== false
    );

  const achievements =
    ordered(
      about.achievements
    ).filter(
      (item) =>
        item.isActive !== false
    );

  const testimonials =
    ordered(
      about.testimonials
    ).filter(
      (item) =>
        item.isActive !== false
    );

  const contact =
    about.contactInfo;

  const social =
    contact?.socialMedia;

  // ============================================================
  // Tabs
  // ============================================================

  const tabs = [
    {
      id: 'overview',
      label: 'الرئيسية',
      icon: <FaInfoCircle />,
      visible: true,
    },
    {
      id: 'story',
      label: 'قصتنا',
      icon: <FaBookOpen />,
      visible:
        !!(
          about.storyAr ||
          about.story
        ),
    },
    {
      id: 'vision',
      label: 'الرؤية والرسالة',
      icon: <FaEye />,
      visible:
        !!(
          about.visionAr ||
          about.vision ||
          about.missionAr ||
          about.mission
        ),
    },
    {
      id: 'values',
      label: 'قيمنا',
      icon: <FaCheckCircle />,
      visible:
        values.length > 0,
    },
    {
      id: 'stats',
      label: 'الإحصاءات',
      icon: <FaChartBar />,
      visible:
        stats.length > 0,
    },
    {
      id: 'team',
      label: 'فريق العمل',
      icon: <FaUsers />,
      visible:
        team.length > 0,
    },
    {
      id: 'achievements',
      label: 'الإنجازات',
      icon: <FaAward />,
      visible:
        achievements.length > 0,
    },
    {
      id: 'testimonials',
      label: 'الآراء',
      icon: <FaStar />,
      visible:
        testimonials.length > 0,
    },
    {
      id: 'contact',
      label: 'تواصل معنا',
      icon: <FaPhone />,
      visible:
        !!(
          contact?.email ||
          contact?.phone ||
          contact?.address ||
          contact?.addressAr ||
          contact?.workingHours ||
          contact?.workingHoursAr ||
          contact?.mapUrl ||
          (social &&
            Object.values(
              social
            ).some(Boolean))
        ),
    },
  ].filter(
    (tab) => tab.visible
  );

  // ============================================================
  // Render
  // ============================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
    >

      {/* ======================================================
          Decorative Background
      ====================================================== */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-purple-200/30 dark:bg-purple-900/10 blur-3xl" />

        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-indigo-200/20 dark:bg-indigo-900/10 blur-3xl" />

        <div className="absolute bottom-0 right-1/3 w-96 h-96 rounded-full bg-blue-100/20 dark:bg-blue-900/10 blur-3xl" />
      </div>

      {/* ======================================================
          Hero
      ====================================================== */}

      <section className="relative">

        {about.platformCover ? (
          <div className="relative h-[300px] md:h-[380px] overflow-hidden">

            <img
              src={getAboutFileUrl(
                about.platformCover
              )}
              alt={platformName}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display =
                  'none';
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-l from-slate-950/90 via-purple-950/65 to-slate-950/30" />

            <div className="relative z-10 h-full max-w-6xl mx-auto px-5 flex items-center">

              <div className="max-w-3xl">

                <div className="flex items-center gap-3 mb-4">

                  {about.platformLogo && (
                    <div className="w-12 h-12 rounded-xl bg-white/95 p-2 shadow-lg">
                      <img
                        src={getAboutFileUrl(
                          about.platformLogo
                        )}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <span className="text-xs md:text-sm text-white/80">
                    نبذة عن المنصة
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
                  {platformName}
                </h1>

                {description && (
                  <p className="text-sm md:text-base leading-7 text-white/85 max-w-2xl whitespace-pre-line">
                    {description}
                  </p>
                )}

              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-l from-purple-950 via-purple-800 to-indigo-800">
            <div className="max-w-6xl mx-auto px-5 py-14 text-center text-white">

              {about.platformLogo && (
                <div className="w-20 h-20 rounded-2xl bg-white p-3 mx-auto mb-5 shadow-xl">
                  <img
                    src={getAboutFileUrl(
                      about.platformLogo
                    )}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                {platformName}
              </h1>

              {description && (
                <p className="max-w-3xl mx-auto text-sm md:text-base leading-7 text-white/85 whitespace-pre-line">
                  {description}
                </p>
              )}

            </div>
          </div>
        )}

      </section>

      {/* ======================================================
          Main
      ====================================================== */}

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">

        {/* ====================================================
            Tabs
        ==================================================== */}

        {tabs.length > 1 && (
          <div className="relative -mt-6 mb-10">

            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-2">

              <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">

                {tabs.map((tab) => {
                  const active =
                    activeTab ===
                    tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          tab.id
                        )
                      }
                      className={`
                        flex-shrink-0
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        px-4
                        py-2.5
                        rounded-xl
                        text-xs
                        md:text-sm
                        font-medium
                        transition-all
                        duration-200
                        ${
                          active
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }
                      `}
                    >
                      <span className="text-sm">
                        {tab.icon}
                      </span>

                      {tab.label}
                    </button>
                  );
                })}

              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            OVERVIEW
        ==================================================== */}

        {activeTab ===
          'overview' && (
          <section className="pb-12">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Platform Card */}

              <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">

                <div className="flex items-center gap-3 mb-5">

                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <FaBuilding className="text-purple-600" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">
                      {platformName}
                    </h2>

                    {about.foundedDate && (
                      <p className="text-xs text-slate-400 mt-1">
                        تأسست في{' '}
                        {formatDate(
                          about.foundedDate
                        )}
                      </p>
                    )}
                  </div>

                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 mb-5" />

                <div className="flex items-start gap-4">

                  {about.platformLogo && (
                    <img
                      src={getAboutFileUrl(
                        about.platformLogo
                      )}
                      alt={platformName}
                      className="w-16 h-16 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 p-2 flex-shrink-0"
                    />
                  )}

                  <div className="text-sm text-slate-600 dark:text-slate-300 leading-7">
                    هذه المنصة الرقمية تجمع الخدمات والمحتوى الأكاديمي في بيئة منظمة تساعد المستخدمين على الوصول إلى المعرفة والخدمات المتخصصة بصورة واضحة واحترافية.
                  </div>

                </div>

              </div>

              {/* Quick Info */}

              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-sm">

                <FaRocket className="w-7 h-7 mb-5 opacity-90" />

                <h3 className="text-lg font-bold mb-3">
                  ارتقاء | IRTEQA
                </h3>

                <p className="text-xs leading-6 text-white/80">
                  تجربة أكاديمية رقمية تجمع المعرفة والخدمات والتقنيات الحديثة في بيئة واحدة.
                </p>

                {about.isPublished && (
                  <div className="mt-6 flex items-center gap-2 text-xs">
                    <FaCheckCircle />
                    <span>
                      المنصة منشورة ومتاحة
                    </span>
                  </div>
                )}

              </div>

            </div>

          </section>
        )}

        {/* ====================================================
            STORY
        ==================================================== */}

        {activeTab ===
          'story' &&
          (about.storyAr ||
            about.story) && (
            <section className="pb-12">

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">

                <div className="flex items-center gap-3 mb-6">

                  <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <FaBookOpen className="text-purple-600" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">
                      قصتنا
                    </h2>

                    <p className="text-xs text-slate-400 mt-1">
                      رحلتنا وهويتنا
                    </p>
                  </div>

                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-8 whitespace-pre-line">
                  {text(
                    about.storyAr,
                    about.story
                  )}
                </p>

              </div>

            </section>
          )}

        {/* ====================================================
            VISION / MISSION
        ==================================================== */}

        {activeTab ===
          'vision' && (
          <section className="pb-12">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {(about.visionAr ||
                about.vision) && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">

                  <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-5">
                    <FaEye className="text-blue-600" />
                  </div>

                  <h2 className="text-lg font-bold mb-3">
                    رؤيتنا
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-7 whitespace-pre-line">
                    {text(
                      about.visionAr,
                      about.vision
                    )}
                  </p>

                </div>
              )}

              {(about.missionAr ||
                about.mission) && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">

                  <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5">
                    <FaBullseye className="text-green-600" />
                  </div>

                  <h2 className="text-lg font-bold mb-3">
                    رسالتنا
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-7 whitespace-pre-line">
                    {text(
                      about.missionAr,
                      about.mission
                    )}
                  </p>

                </div>
              )}

            </div>

          </section>
        )}

        {/* ====================================================
            VALUES
        ==================================================== */}

        {activeTab ===
          'values' &&
          values.length > 0 && (
            <section className="pb-12">

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {values.map(
                  (value, index) => (
                    <div
                      key={`${value.titleAr || value.title || 'value'}-${index}`}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition"
                    >

                      <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xl mb-4">
                        {value.icon ||
                          <FaCheckCircle className="text-purple-600" />}
                      </div>

                      <h3 className="text-sm font-bold mb-2">
                        {text(
                          value.titleAr,
                          value.title,
                          'قيمة'
                        )}
                      </h3>

                      {(value.descriptionAr ||
                        value.description) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-6">
                          {text(
                            value.descriptionAr,
                            value.description
                          )}
                        </p>
                      )}

                    </div>
                  )
                )}

              </div>

            </section>
          )}

        {/* ====================================================
            STATS
        ==================================================== */}

        {activeTab ===
          'stats' &&
          stats.length > 0 && (
            <section className="pb-12">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {stats.map(
                  (stat, index) => {

                    let icon =
                      <FaChartBar />;

                    if (
                      stat.icon ===
                      'users'
                    ) {
                      icon =
                        <FaUsers />;
                    } else if (
                      stat.icon ===
                      'award'
                    ) {
                      icon =
                        <FaAward />;
                    } else if (
                      stat.icon ===
                      'building'
                    ) {
                      icon =
                        <FaBuilding />;
                    } else if (
                      stat.icon ===
                      'globe'
                    ) {
                      icon =
                        <FaGlobe />;
                    }

                    return (
                      <div
                        key={`${stat.labelAr || stat.label || 'stat'}-${index}`}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-center shadow-sm"
                      >

                        <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3 text-purple-600">
                          {icon}
                        </div>

                        <div className="text-2xl font-bold">
                          {stat.value ??
                            '—'}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {text(
                            stat.labelAr,
                            stat.label,
                            'إحصائية'
                          )}
                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </section>
          )}

        {/* ====================================================
            TEAM
        ==================================================== */}

        {activeTab ===
          'team' &&
          team.length > 0 && (
            <section className="pb-12">

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                {team.map(
                  (member, index) => (
                    <article
                      key={`${member.nameAr || member.name || 'member'}-${index}`}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-center"
                    >

                      {member.imageId ? (
                        <img
                          src={getAboutFileUrl(
                            member.imageId
                          )}
                          alt={text(
                            member.nameAr,
                            member.name,
                            'عضو الفريق'
                          )}
                          className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-purple-50 dark:border-purple-900/20"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                          {text(
                            member.nameAr,
                            member.name,
                            '?'
                          ).charAt(0)}
                        </div>
                      )}

                      <h3 className="text-base font-bold">
                        {text(
                          member.nameAr,
                          member.name,
                          'عضو الفريق'
                        )}
                      </h3>

                      {(member.positionAr ||
                        member.position) && (
                        <p className="text-xs text-purple-600 mt-1">
                          {text(
                            member.positionAr,
                            member.position
                          )}
                        </p>
                      )}

                      {(member.bioAr ||
                        member.bio) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-6 mt-3">
                          {text(
                            member.bioAr,
                            member.bio
                          )}
                        </p>
                      )}

                      {(member.email ||
                        member.linkedin ||
                        member.twitter) && (
                        <div className="flex justify-center gap-4 mt-4">

                          {member.email && (
                            <a
                              href={`mailto:${member.email}`}
                              className="text-slate-400 hover:text-purple-600"
                            >
                              <FaEnvelope />
                            </a>
                          )}

                          {member.linkedin && (
                            <a
                              href={
                                member.linkedin
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-blue-600"
                            >
                              <FaLinkedin />
                            </a>
                          )}

                          {member.twitter && (
                            <a
                              href={
                                member.twitter
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-sky-500"
                            >
                              <FaTwitter />
                            </a>
                          )}

                        </div>
                      )}

                    </article>
                  )
                )}

              </div>

            </section>
          )}

        {/* ====================================================
            ACHIEVEMENTS
        ==================================================== */}

        {activeTab ===
          'achievements' &&
          achievements.length > 0 && (
            <section className="pb-12">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {achievements.map(
                  (
                    achievement,
                    index
                  ) => (
                    <article
                      key={`${achievement.titleAr || achievement.title || 'achievement'}-${index}`}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm"
                    >

                      <div className="flex gap-4">

                        {achievement.imageId && (
                          <img
                            src={getAboutFileUrl(
                              achievement.imageId
                            )}
                            alt={text(
                              achievement.titleAr,
                              achievement.title,
                              'إنجاز'
                            )}
                            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                          />
                        )}

                        <div className="flex-1">

                          <div className="flex items-center gap-2 mb-2">
                            <FaAward className="text-amber-500" />

                            <h3 className="text-sm font-bold">
                              {text(
                                achievement.titleAr,
                                achievement.title,
                                'إنجاز'
                              )}
                            </h3>
                          </div>

                          {(achievement.descriptionAr ||
                            achievement.description) && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-6">
                              {text(
                                achievement.descriptionAr,
                                achievement.description
                              )}
                            </p>
                          )}

                          {achievement.date && (
                            <p className="text-[11px] text-slate-400 mt-3">
                              {formatDate(
                                achievement.date
                              )}
                            </p>
                          )}

                        </div>

                      </div>

                    </article>
                  )
                )}

              </div>

            </section>
          )}

        {/* ====================================================
            TESTIMONIALS
        ==================================================== */}

        {activeTab ===
          'testimonials' &&
          testimonials.length > 0 && (
            <section className="pb-12">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {testimonials.map(
                  (
                    testimonial,
                    index
                  ) => (
                    <article
                      key={`${testimonial.nameAr || testimonial.name || 'testimonial'}-${index}`}
                      className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
                    >

                      <FaQuoteRight className="absolute top-5 left-5 text-purple-100 dark:text-purple-900/30 w-8 h-8" />

                      <div className="flex items-center gap-3 mb-4">

                        {testimonial.imageId ? (
                          <img
                            src={getAboutFileUrl(
                              testimonial.imageId
                            )}
                            alt={text(
                              testimonial.nameAr,
                              testimonial.name,
                              'عميل'
                            )}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-bold">
                            {text(
                              testimonial.nameAr,
                              testimonial.name,
                              '?'
                            ).charAt(0)}
                          </div>
                        )}

                        <div>
                          <h3 className="text-sm font-bold">
                            {text(
                              testimonial.nameAr,
                              testimonial.name,
                              'عميل'
                            )}
                          </h3>

                          {(testimonial.positionAr ||
                            testimonial.position) && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {text(
                                testimonial.positionAr,
                                testimonial.position
                              )}
                            </p>
                          )}
                        </div>

                      </div>

                      <div className="flex gap-1 mb-3">
                        {renderStars(
                          testimonial.rating
                        )}
                      </div>

                      {(testimonial.contentAr ||
                        testimonial.content) && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-7 whitespace-pre-line">
                          “
                          {text(
                            testimonial.contentAr,
                            testimonial.content
                          )}
                          ”
                        </p>
                      )}

                    </article>
                  )
                )}

              </div>

            </section>
          )}

        {/* ====================================================
            CONTACT
        ==================================================== */}

        {activeTab ===
          'contact' && (
          <section className="pb-12">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {contact?.email && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-center shadow-sm">

                  <FaEnvelope className="text-purple-600 w-6 h-6 mx-auto mb-3" />

                  <p className="text-xs text-slate-400 mb-1">
                    البريد الإلكتروني
                  </p>

                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm font-medium hover:text-purple-600 break-all"
                  >
                    {contact.email}
                  </a>

                </div>
              )}

              {contact?.phone && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-center shadow-sm">

                  <FaPhone className="text-purple-600 w-6 h-6 mx-auto mb-3" />

                  <p className="text-xs text-slate-400 mb-1">
                    رقم الهاتف
                  </p>

                  <a
                    href={`tel:${contact.phone}`}
                    className="text-sm font-medium"
                  >
                    {contact.phone}
                  </a>

                </div>
              )}

              {(contact?.address ||
                contact?.addressAr) && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-center shadow-sm">

                  <FaMapMarkerAlt className="text-purple-600 w-6 h-6 mx-auto mb-3" />

                  <p className="text-xs text-slate-400 mb-1">
                    العنوان
                  </p>

                  <p className="text-sm font-medium leading-6">
                    {text(
                      contact.addressAr,
                      contact.address
                    )}
                  </p>

                </div>
              )}

              {(contact?.workingHours ||
                contact?.workingHoursAr) && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-center shadow-sm">

                  <FaClock className="text-purple-600 w-6 h-6 mx-auto mb-3" />

                  <p className="text-xs text-slate-400 mb-1">
                    ساعات العمل
                  </p>

                  <p className="text-sm font-medium leading-6">
                    {text(
                      contact.workingHoursAr,
                      contact.workingHours
                    )}
                  </p>

                </div>
              )}

            </div>

            {/* Map */}

            {contact?.mapUrl && (
              <div className="text-center mt-6">

                <a
                  href={contact.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition"
                >
                  <FaMapMarkerAlt />
                  عرض الموقع على الخريطة
                  <FaExternalLinkAlt className="w-3 h-3" />
                </a>

              </div>
            )}

            {/* Social */}

            {social &&
              Object.values(
                social
              ).some(Boolean) && (
                <div className="mt-8">

                  <h3 className="text-sm font-bold text-center mb-4">
                    تابعنا على منصات التواصل
                  </h3>

                  <div className="flex justify-center gap-3">

                    {social.facebook && (
                      <a
                        href={
                          social.facebook
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:scale-105 transition"
                      >
                        <FaFacebook />
                      </a>
                    )}

                    {social.twitter && (
                      <a
                        href={
                          social.twitter
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center hover:scale-105 transition"
                      >
                        <FaTwitter />
                      </a>
                    )}

                    {social.instagram && (
                      <a
                        href={
                          social.instagram
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center hover:scale-105 transition"
                      >
                        <FaInstagram />
                      </a>
                    )}

                    {social.youtube && (
                      <a
                        href={
                          social.youtube
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center hover:scale-105 transition"
                      >
                        <FaYoutube />
                      </a>
                    )}

                    {social.linkedin && (
                      <a
                        href={
                          social.linkedin
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center hover:scale-105 transition"
                      >
                        <FaLinkedin />
                      </a>
                    )}

                    {social.whatsapp && (
                      <a
                        href={
                          social.whatsapp
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center hover:scale-105 transition"
                      >
                        <FaWhatsapp />
                      </a>
                    )}

                  </div>

                </div>
              )}

            {/* Profile PDF */}

            {about.profileFileId && (
              <div className="text-center mt-8">

                <a
                  href={getAboutFileUrl(
                    about.profileFileId
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-purple-600 text-purple-600 text-sm font-medium hover:bg-purple-600 hover:text-white transition"
                >
                  <FaFileAlt />
                  عرض ملف التعريف
                  <FaExternalLinkAlt className="w-3 h-3" />
                </a>

              </div>
            )}

          </section>
        )}

      </div>
    </main>
  );
};

export default About;
