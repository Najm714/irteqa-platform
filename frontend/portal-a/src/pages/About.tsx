// frontend/portal-a/src/pages/About.tsx

import React, { useState, useEffect, useCallback } from 'react';
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

const getArabicText = (
  arabic?: string,
  english?: string,
  fallback = ''
): string => {
  return arabic?.trim() || english?.trim() || fallback;
};

const getOrderedItems = <T extends { order?: number }>(
  items: T[] | undefined
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
  const [about, setAbout] = useState<AboutData | null>(null);
  const [error, setError] = useState('');

  // ============================================================
  // Environment
  // ============================================================

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const PORTAL_ID =
    import.meta.env.VITE_PORTAL_ID || '';

  // ============================================================
  // File URL
  // ============================================================

  const getAboutFileUrl = useCallback(
    (
      file: string | FileReference | null | undefined
    ): string => {
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
  // Fetch About
  // ============================================================

  const fetchAbout = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError('لم يتم العثور على جلسة تسجيل الدخول.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/about`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
          Accept: 'application/json',
        },
      });

      const rawText = await response.text();

      if (!response.ok) {
        throw new Error(
          `About API failed: ${response.status} ${rawText}`
        );
      }

      let data: {
        success?: boolean;
        data?: AboutData;
        message?: string;
      };

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          'استجابة غير صالحة من خادم صفحة نبذة عنا.'
        );
      }

      if (data.success && data.data) {
        setAbout(data.data);
      } else {
        setAbout(null);
        setError(
          data.message ||
            'لم يتم العثور على بيانات صفحة نبذة عنا.'
        );
      }
    } catch (err) {
      console.error('❌ Error fetching About:', err);

      setAbout(null);
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تحميل صفحة نبذة عنا.'
      );
    } finally {
      setLoading(false);
    }
  }, [API_URL, PORTAL_ID, token]);

  // ============================================================
  // Load
  // ============================================================

  useEffect(() => {
    fetchAbout();
  }, [fetchAbout]);

  // ============================================================
  // Format Date
  // ============================================================

  const formatDate = (
    date: string | undefined
  ): string => {
    if (!date) return '';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    return parsedDate.toLocaleDateString(
      'ar-SA',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };

  // ============================================================
  // Render Stars
  // ============================================================

  const renderStars = (
    rating: number | undefined
  ) => {
    const safeRating = Math.max(
      0,
      Math.min(5, Number(rating) || 0)
    );

    return Array.from(
      { length: 5 },
      (_, index) => {
        const number = index + 1;

        if (number <= Math.floor(safeRating)) {
          return (
            <FaStar
              key={number}
              className="w-4 h-4 text-yellow-400"
            />
          );
        }

        if (
          number - safeRating > 0 &&
          number - safeRating < 1
        ) {
          return (
            <FaStarHalf
              key={number}
              className="w-4 h-4 text-yellow-400"
            />
          );
        }

        return (
          <FaStar
            key={number}
            className="w-4 h-4 text-gray-300"
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
        className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"
        dir="rtl"
      >
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />

          <p className="text-gray-600 dark:text-gray-400">
            جاري تحميل صفحة نبذة عنا...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Error / Empty
  // ============================================================

  if (!about) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4"
        dir="rtl"
      >
        <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-3xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-800">
          <FaInfoCircle className="w-16 h-16 text-gray-300 mx-auto mb-5" />

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            تعذر تحميل صفحة نبذة عنا
          </h2>

          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            {error ||
              'لا توجد بيانات متاحة حالياً.'}
          </p>

          <button
            type="button"
            onClick={fetchAbout}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Published Check
  // ============================================================

  if (about.isPublished === false) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4"
        dir="rtl"
      >
        <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-3xl p-10 text-center shadow-lg border border-gray-200 dark:border-gray-800">
          <FaInfoCircle className="w-16 h-16 text-gray-300 mx-auto mb-5" />

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            صفحة نبذة عنا غير منشورة
          </h2>

          <p className="text-gray-600 dark:text-gray-400">
            سيتم إتاحة هذه الصفحة عند نشرها من لوحة الإدارة.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Safe Data
  // ============================================================

  const values = getOrderedItems(about.values);

  const stats = getOrderedItems(about.stats);

  const team = getOrderedItems(about.team)
    .filter(
      (member) => member.isActive !== false
    );

  const achievements = getOrderedItems(
    about.achievements
  ).filter(
    (achievement) =>
      achievement.isActive !== false
  );

  const testimonials = getOrderedItems(
    about.testimonials
  ).filter(
    (testimonial) =>
      testimonial.isActive !== false
  );

  const contact = about.contactInfo;

  const social = contact?.socialMedia;

  const platformName = getArabicText(
    about.platformNameAr,
    about.platformName,
    'منصة ارتقاء'
  );

  const platformDescription = getArabicText(
    about.platformDescriptionAr,
    about.platformDescription
  );

  // ============================================================
  // Render
  // ============================================================

  return (
    <main
      className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white"
      dir="rtl"
    >
      {/* ======================================================
          Hero
      ====================================================== */}

      <section className="relative overflow-hidden">
        {about.platformCover ? (
          <div className="relative h-[360px] md:h-[460px]">
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

            <div className="absolute inset-0 bg-gradient-to-l from-purple-950/90 via-purple-900/60 to-black/30" />

            <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex items-center">
              <div className="max-w-3xl text-white">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-5">
                  <FaInfoCircle />
                  <span>
                    نبذة عن المنصة
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5">
                  {platformName}
                </h1>

                {platformDescription && (
                  <p className="text-lg md:text-xl text-white/90 leading-9 whitespace-pre-line">
                    {platformDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-l from-purple-900 to-purple-700">
            <div className="max-w-7xl mx-auto px-6 py-20 text-white text-center">
              <div className="flex justify-center mb-6">
                {about.platformLogo ? (
                  <img
                    src={getAboutFileUrl(
                      about.platformLogo
                    )}
                    alt={platformName}
                    className="w-28 h-28 object-contain rounded-2xl bg-white p-3 shadow-xl"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <FaGlobe className="w-14 h-14" />
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold mb-5">
                {platformName}
              </h1>

              {platformDescription && (
                <p className="max-w-4xl mx-auto text-lg md:text-xl text-white/90 leading-9 whitespace-pre-line">
                  {platformDescription}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ======================================================
          Main Container
      ====================================================== */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

        {/* ====================================================
            Platform Information
        ==================================================== */}

        <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-10 mb-10">

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">

            {about.platformLogo && (
              <div className="flex-shrink-0">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
                  <img
                    src={getAboutFileUrl(
                      about.platformLogo
                    )}
                    alt={platformName}
                    className="max-w-full max-h-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        'none';
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 text-center md:text-right">

              <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                <FaBuilding className="text-purple-600 w-6 h-6" />

                <h2 className="text-3xl font-bold">
                  {platformName}
                </h2>
              </div>

              {about.foundedDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                  تأسست في{' '}
                  {formatDate(
                    about.foundedDate
                  )}
                </p>
              )}

              {platformDescription && (
                <div className="text-gray-600 dark:text-gray-300 leading-9 whitespace-pre-line text-base md:text-lg">
                  {platformDescription}
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ====================================================
            Story
        ==================================================== */}

        {(about.storyAr || about.story) && (
          <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-7 md:p-10 mb-10">

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <FaBookOpen className="text-purple-600 w-6 h-6" />
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  قصتنا
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  من نحن وكيف بدأت رحلتنا
                </p>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 leading-9 whitespace-pre-line text-lg">
              {getArabicText(
                about.storyAr,
                about.story
              )}
            </p>

          </section>
        )}

        {/* ====================================================
            Vision & Mission
        ==================================================== */}

        {(about.visionAr ||
          about.vision ||
          about.missionAr ||
          about.mission) && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

            {(about.visionAr ||
              about.vision) && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-7 md:p-9">

                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FaEye className="text-blue-600 w-7 h-7" />
                  </div>

                  <h2 className="text-2xl font-bold">
                    رؤيتنا
                  </h2>
                </div>

                <p className="text-gray-600 dark:text-gray-300 leading-9 whitespace-pre-line text-lg">
                  {getArabicText(
                    about.visionAr,
                    about.vision
                  )}
                </p>
              </div>
            )}

            {(about.missionAr ||
              about.mission) && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-7 md:p-9">

                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <FaBullseye className="text-green-600 w-7 h-7" />
                  </div>

                  <h2 className="text-2xl font-bold">
                    رسالتنا
                  </h2>
                </div>

                <p className="text-gray-600 dark:text-gray-300 leading-9 whitespace-pre-line text-lg">
                  {getArabicText(
                    about.missionAr,
                    about.mission
                  )}
                </p>
              </div>
            )}

          </section>
        )}

        {/* ====================================================
            Values
        ==================================================== */}

        {values.length > 0 && (
          <section className="mb-12">

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3">
                <FaCheckCircle className="text-purple-600 w-7 h-7" />

                <h2 className="text-3xl font-bold">
                  قيمنا الجوهرية
                </h2>
              </div>

              <p className="text-gray-500 dark:text-gray-400 mt-2">
                المبادئ التي توجه عمل منصة ارتقاء
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {values.map(
                (value, index) => (
                  <article
                    key={`${value.titleAr || value.title || 'value'}-${index}`}
                    className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl mb-5">
                      {value.icon || '⭐'}
                    </div>

                    <h3 className="text-xl font-bold mb-3">
                      {getArabicText(
                        value.titleAr,
                        value.title,
                        'قيمة'
                      )}
                    </h3>

                    {(value.descriptionAr ||
                      value.description) && (
                      <p className="text-gray-500 dark:text-gray-400 leading-7">
                        {getArabicText(
                          value.descriptionAr,
                          value.description
                        )}
                      </p>
                    )}
                  </article>
                )
              )}

            </div>
          </section>
        )}

        {/* ====================================================
            Statistics
        ==================================================== */}

        {stats.length > 0 && (
          <section className="mb-12">

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">
                أرقام وإحصاءات
              </h2>

              <p className="text-gray-500 dark:text-gray-400 mt-2">
                مؤشرات مختارة عن المنصة
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              {stats.map(
                (stat, index) => {
                  const icon =
                    stat.icon === 'users'
                      ? <FaUsers />
                      : stat.icon === 'award'
                      ? <FaAward />
                      : stat.icon === 'building'
                      ? <FaBuilding />
                      : stat.icon === 'globe'
                      ? <FaGlobe />
                      : <FaChartBar />;

                  return (
                    <div
                      key={`${stat.labelAr || stat.label || 'stat'}-${index}`}
                      className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-800 shadow-sm"
                    >
                      <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 text-xl mx-auto mb-4">
                        {icon}
                      </div>

                      <div className="text-3xl md:text-4xl font-extrabold mb-2">
                        {stat.value ?? '—'}
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {getArabicText(
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
            Team
        ==================================================== */}

        {team.length > 0 && (
          <section className="mb-12">

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3">
                <FaUsers className="text-purple-600 w-7 h-7" />

                <h2 className="text-3xl font-bold">
                  فريق العمل
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {team.map(
                (member, index) => (
                  <article
                    key={`${member.nameAr || member.name || 'member'}-${index}`}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-7 border border-gray-200 dark:border-gray-800 shadow-sm text-center"
                  >

                    {member.imageId ? (
                      <img
                        src={getAboutFileUrl(
                          member.imageId
                        )}
                        alt={getArabicText(
                          member.nameAr,
                          member.name,
                          'عضو الفريق'
                        )}
                        className="w-28 h-28 rounded-full object-cover mx-auto mb-5 border-4 border-purple-100 dark:border-purple-900/30"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center text-4xl font-bold mx-auto mb-5">
                        {getArabicText(
                          member.nameAr,
                          member.name,
                          '?'
                        ).charAt(0)}
                      </div>
                    )}

                    <h3 className="text-xl font-bold">
                      {getArabicText(
                        member.nameAr,
                        member.name,
                        'عضو الفريق'
                      )}
                    </h3>

                    {(member.positionAr ||
                      member.position) && (
                      <p className="text-purple-600 font-medium mt-1">
                        {getArabicText(
                          member.positionAr,
                          member.position
                        )}
                      </p>
                    )}

                    {(member.bioAr ||
                      member.bio) && (
                      <p className="text-gray-500 dark:text-gray-400 leading-7 mt-4">
                        {getArabicText(
                          member.bioAr,
                          member.bio
                        )}
                      </p>
                    )}

                    {(member.email ||
                      member.linkedin ||
                      member.twitter) && (
                      <div className="flex justify-center gap-4 mt-5">

                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="text-gray-400 hover:text-purple-600 transition"
                            aria-label="Email"
                          >
                            <FaEnvelope />
                          </a>
                        )}

                        {member.linkedin && (
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-600 transition"
                            aria-label="LinkedIn"
                          >
                            <FaLinkedin />
                          </a>
                        )}

                        {member.twitter && (
                          <a
                            href={member.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-400 transition"
                            aria-label="Twitter"
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
            Achievements
        ==================================================== */}

        {achievements.length > 0 && (
          <section className="mb-12">

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3">
                <FaAward className="text-yellow-500 w-7 h-7" />

                <h2 className="text-3xl font-bold">
                  إنجازاتنا
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {achievements.map(
                (achievement, index) => (
                  <article
                    key={`${achievement.titleAr || achievement.title || 'achievement'}-${index}`}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm"
                  >

                    <div className="flex flex-col sm:flex-row gap-5">

                      {achievement.imageId && (
                        <img
                          src={getAboutFileUrl(
                            achievement.imageId
                          )}
                          alt={getArabicText(
                            achievement.titleAr,
                            achievement.title,
                            'إنجاز'
                          )}
                          className="w-full sm:w-28 h-40 sm:h-28 object-cover rounded-2xl"
                        />
                      )}

                      <div className="flex-1">

                        <div className="flex items-start gap-3">
                          <FaAward className="text-yellow-500 mt-1 flex-shrink-0" />

                          <h3 className="text-xl font-bold">
                            {getArabicText(
                              achievement.titleAr,
                              achievement.title,
                              'إنجاز'
                            )}
                          </h3>
                        </div>

                        {(achievement.descriptionAr ||
                          achievement.description) && (
                          <p className="text-gray-500 dark:text-gray-400 leading-7 mt-3">
                            {getArabicText(
                              achievement.descriptionAr,
                              achievement.description
                            )}
                          </p>
                        )}

                        {achievement.date && (
                          <p className="text-sm text-gray-400 mt-4">
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
            Testimonials
        ==================================================== */}

        {testimonials.length > 0 && (
          <section className="mb-12">

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3">
                <FaStar className="text-yellow-400 w-7 h-7" />

                <h2 className="text-3xl font-bold">
                  آراء عملائنا
                </h2>
              </div>

              <p className="text-gray-500 dark:text-gray-400 mt-2">
                تجارب وانطباعات مستخدمي المنصة
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {testimonials.map(
                (testimonial, index) => (
                  <article
                    key={`${testimonial.nameAr || testimonial.name || 'testimonial'}-${index}`}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-7 border border-gray-200 dark:border-gray-800 shadow-sm"
                  >

                    <div className="flex items-center gap-4 mb-5">

                      {testimonial.imageId ? (
                        <img
                          src={getAboutFileUrl(
                            testimonial.imageId
                          )}
                          alt={getArabicText(
                            testimonial.nameAr,
                            testimonial.name,
                            'عميل'
                          )}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center text-xl font-bold">
                          {getArabicText(
                            testimonial.nameAr,
                            testimonial.name,
                            '?'
                          ).charAt(0)}
                        </div>
                      )}

                      <div>
                        <h3 className="font-bold text-lg">
                          {getArabicText(
                            testimonial.nameAr,
                            testimonial.name,
                            'عميل'
                          )}
                        </h3>

                        {(testimonial.positionAr ||
                          testimonial.position) && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getArabicText(
                              testimonial.positionAr,
                              testimonial.position
                            )}
                          </p>
                        )}
                      </div>

                    </div>

                    <div className="flex gap-1 mb-4">
                      {renderStars(
                        testimonial.rating
                      )}
                    </div>

                    {(testimonial.contentAr ||
                      testimonial.content) && (
                      <blockquote className="text-gray-600 dark:text-gray-300 leading-8 whitespace-pre-line">
                        “
                        {getArabicText(
                          testimonial.contentAr,
                          testimonial.content
                        )}
                        ”
                      </blockquote>
                    )}

                  </article>
                )
              )}

            </div>
          </section>
        )}

        {/* ====================================================
            Contact
        ==================================================== */}

        {contact &&
          (
            contact.email ||
            contact.phone ||
            contact.address ||
            contact.addressAr ||
            contact.workingHours ||
            contact.workingHoursAr ||
            contact.mapUrl
          ) && (
            <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-7 md:p-10 mb-8">

              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3">
                  <FaPhone className="text-purple-600 w-7 h-7" />

                  <h2 className="text-3xl font-bold">
                    تواصل معنا
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {contact.email && (
                  <div className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-800">
                    <FaEnvelope className="w-8 h-8 text-purple-600 mx-auto mb-3" />

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      البريد الإلكتروني
                    </p>

                    <a
                      href={`mailto:${contact.email}`}
                      className="font-semibold hover:text-purple-600 break-all"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}

                {contact.phone && (
                  <div className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-800">
                    <FaPhone className="w-8 h-8 text-purple-600 mx-auto mb-3" />

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      رقم الهاتف
                    </p>

                    <a
                      href={`tel:${contact.phone}`}
                      className="font-semibold"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}

                {(contact.address ||
                  contact.addressAr) && (
                  <div className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-800">
                    <FaMapMarkerAlt className="w-8 h-8 text-purple-600 mx-auto mb-3" />

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      العنوان
                    </p>

                    <p className="font-semibold leading-7">
                      {getArabicText(
                        contact.addressAr,
                        contact.address
                      )}
                    </p>
                  </div>
                )}

              </div>

              {(contact.workingHours ||
                contact.workingHoursAr) && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
                  <FaClock className="w-7 h-7 text-purple-600 mx-auto mb-2" />

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ساعات العمل
                  </p>

                  <p className="font-semibold mt-1">
                    {getArabicText(
                      contact.workingHoursAr,
                      contact.workingHours
                    )}
                  </p>
                </div>
              )}

              {contact.mapUrl && (
                <div className="text-center mt-6">
                  <a
                    href={contact.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
                  >
                    <FaMapMarkerAlt />
                    عرض الموقع على الخريطة
                    <FaExternalLinkAlt className="w-3 h-3" />
                  </a>
                </div>
              )}

            </section>
          )}

        {/* ====================================================
            Social Media
        ==================================================== */}

        {social &&
          Object.values(social).some(Boolean) && (
            <section className="mb-10">

              <div className="text-center mb-5">
                <h2 className="text-xl font-bold">
                  تابعنا على منصات التواصل
                </h2>
              </div>

              <div className="flex justify-center flex-wrap gap-4">

                {social.facebook && (
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-105 transition"
                  >
                    <FaFacebook className="w-5 h-5" />
                  </a>
                )}

                {social.twitter && (
                  <a
                    href={social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                    className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center hover:scale-105 transition"
                  >
                    <FaTwitter className="w-5 h-5" />
                  </a>
                )}

                {social.instagram && (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-12 h-12 rounded-full bg-pink-600 text-white flex items-center justify-center hover:scale-105 transition"
                  >
                    <FaInstagram className="w-5 h-5" />
                  </a>
                )}

                {social.youtube && (
                  <a
                    href={social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:scale-105 transition"
                  >
                    <FaYoutube className="w-5 h-5" />
                  </a>
                )}

                {social.linkedin && (
                  <a
                    href={social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center hover:scale-105 transition"
                  >
                    <FaLinkedin className="w-5 h-5" />
                  </a>
                )}

                {social.whatsapp && (
                  <a
                    href={social.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:scale-105 transition"
                  >
                    <FaWhatsapp className="w-5 h-5" />
                  </a>
                )}

              </div>
            </section>
          )}

        {/* ====================================================
            Profile File
        ==================================================== */}

        {about.profileFileId && (
          <section className="text-center pb-10">

            <a
              href={getAboutFileUrl(
                about.profileFileId
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl bg-purple-600 text-white font-semibold shadow-sm hover:bg-purple-700 transition"
            >
              <FaFileAlt className="w-5 h-5" />

              عرض ملف التعريف

              <FaExternalLinkAlt className="w-3 h-3" />
            </a>

          </section>
        )}

      </div>
    </main>
  );
};

export default About;
