// frontend/portal-a/src/pages/Infographics.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// ============================================================
// Icons
// ============================================================

import {
  FaSpinner,
  FaSearch,
  FaEye,
  FaDownload,
  FaStar,
  FaFilter,
  FaTimes,
  FaChartBar,
  FaClock,
  FaImage,
  FaExclamationTriangle,
} from 'react-icons/fa';

// ============================================================
// API
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const PORTAL_ID =
  import.meta.env.VITE_PORTAL_ID || '';

// ============================================================
// Interfaces
// ============================================================

interface FileReference {
  _id: string;
  originalName: string;
  size: number;
  mimeType: string;
}

interface Infographic {
  _id: string;

  fileId?: FileReference;

  thumbnailId?: FileReference;

  title: string;
  titleAr: string;

  description: string;
  descriptionAr: string;

  category: string;
  categoryAr: string;

  tags: string[];

  isPublished: boolean;
  isFeatured: boolean;

  views: number;
  downloads: number;

  createdAt: string;
}

// ============================================================
// Component
// ============================================================

const Infographics: React.FC = () => {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);

  const [infographics, setInfographics] = useState<Infographic[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  const [categoryFilter, setCategoryFilter] =
    useState<string>('');

  const [showFilters, setShowFilters] =
    useState(false);

  // ==========================================================
  // Categories
  // ==========================================================

  const categories = [
    {
      value: 'educational',
      label: '📚 تعليمي',
    },
    {
      value: 'statistical',
      label: '📊 إحصائي',
    },
    {
      value: 'process',
      label: '⚙️ عمليات',
    },
    {
      value: 'comparison',
      label: '🔍 مقارنات',
    },
    {
      value: 'timeline',
      label: '📅 تسلسل زمني',
    },
    {
      value: 'hierarchy',
      label: '🏛️ هرمي',
    },
    {
      value: 'geographical',
      label: '🌍 جغرافي',
    },
    {
      value: 'other',
      label: '📁 أخرى',
    },
  ];

  // ==========================================================
  // Build authenticated file URL
  // ==========================================================

  const getFileUrl = useCallback(
    (fileId?: string) => {
      if (!fileId || !token) {
        return '';
      }

      const params = new URLSearchParams({
        token,
        portalId: PORTAL_ID,
      });

      return `${API_URL}/files/${encodeURIComponent(
        fileId
      )}/download-direct?${params.toString()}`;
    },
    [token]
  );

  // ==========================================================
  // Fetch infographics
  // ==========================================================

  const fetchInfographics = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let url =
        `${API_URL}/infographics` +
        `?isPublished=true&limit=100`;

      if (categoryFilter) {
        url += `&category=${encodeURIComponent(
          categoryFilter
        )}`;
      }

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      console.log('📤 Fetching infographics:', url);

      const response = await fetch(url, {
        method: 'GET',

        headers: {
          Authorization: `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Infographics API failed: ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        '📥 Infographics response:',
        data
      );

      if (data.success) {
        setInfographics(data.data || []);
      } else {
        setInfographics([]);
      }
    } catch (error) {
      console.error(
        '❌ Error fetching infographics:',
        error
      );

      setInfographics([]);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    categoryFilter,
    searchTerm,
  ]);

  // ==========================================================
  // Initialisation
  // ==========================================================

  useEffect(() => {
    AOS.init({
      duration: 600,
      once: true,
    });
  }, []);

  // ==========================================================
  // Fetch when filters change
  // ==========================================================

  useEffect(() => {
    fetchInfographics();
  }, [fetchInfographics]);

  // ==========================================================
  // View
  // ==========================================================

  const handleView = (id: string) => {
    if (!token) {
      console.error(
        '❌ No authentication token'
      );
      return;
    }

    const params = new URLSearchParams({
      token,
      portalId: PORTAL_ID,
    });

    window.open(
      `${API_URL}/infographics/${id}/view?${params.toString()}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // ==========================================================
  // Download
  // ==========================================================

  const handleDownload = (id: string) => {
    if (!token) {
      console.error(
        '❌ No authentication token'
      );
      return;
    }

    const params = new URLSearchParams({
      token,
      portalId: PORTAL_ID,
    });

    window.open(
      `${API_URL}/infographics/${id}/download?${params.toString()}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // ==========================================================
  // Date
  // ==========================================================

  const formatDate = (date: string) => {
    if (!date) {
      return '';
    }

    return new Date(date).toLocaleDateString(
      'ar-SA',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };

  // ==========================================================
  // Search filtering
  // ==========================================================

  const filteredInfographics =
    infographics.filter((item) => {
      if (!searchTerm) {
        return true;
      }

      const search =
        searchTerm.toLowerCase();

      return (
        (item.titleAr || '')
          .toLowerCase()
          .includes(search) ||

        (item.title || '')
          .toLowerCase()
          .includes(search) ||

        (item.descriptionAr || '')
          .toLowerCase()
          .includes(search) ||

        (item.description || '')
          .toLowerCase()
          .includes(search) ||

        item.tags?.some((tag) =>
          tag
            .toLowerCase()
            .includes(search)
        )
      );
    });

  // ==========================================================
  // Loading
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-5">
            <FaSpinner className="w-10 h-10 text-purple-600 animate-spin" />
          </div>

          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            جاري تحميل الإنفوجرافيك...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-slate-50
        via-white
        to-purple-50
        dark:from-gray-950
        dark:via-gray-900
        dark:to-purple-950/20
        py-8
      "
    >
      <div className="container-custom max-w-7xl">

        {/* ================================================== */}
        {/* Header */}
        {/* ================================================== */}

        <div
          className="text-center mb-8"
          data-aos="fade-down"
        >
          <div
            className="
              inline-flex
              items-center
              justify-center
              w-14
              h-14
              rounded-2xl
              bg-gradient-to-br
              from-purple-600
              to-indigo-600
              text-white
              shadow-lg
              shadow-purple-500/20
              mb-4
            "
          >
            <FaChartBar className="w-6 h-6" />
          </div>

          <h1
            className="
              text-2xl
              md:text-3xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            الإنفوجرافيك
          </h1>

          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mt-2
            "
          >
            استعرض وحمّل الإنفوجرافيك التعليمية
            والمعلوماتية المتاحة
          </p>

          <div
            className="
              inline-flex
              items-center
              gap-2
              mt-3
              px-3
              py-1.5
              rounded-full
              bg-purple-50
              dark:bg-purple-900/20
              text-purple-600
              dark:text-purple-400
              text-xs
              font-semibold
            "
          >
            <FaImage />

            {filteredInfographics.length}
            {' '}
            إنفوجرافيك متاح
          </div>
        </div>

        {/* ================================================== */}
        {/* Search & Filter */}
        {/* ================================================== */}

        <div
          className="
            flex
            flex-col
            md:flex-row
            gap-3
            mb-6
          "
          data-aos="fade-up"
        >
          <div className="flex-1">
            <div className="relative">

              <FaSearch
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                  pointer-events-none
                "
              />

              <input
                type="text"
                placeholder="بحث في الإنفوجرافيك..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                className="
                  w-full
                  pr-11
                  pl-4
                  py-3
                  rounded-xl
                  border
                  border-gray-200
                  dark:border-gray-700
                  bg-white
                  dark:bg-gray-800
                  text-gray-900
                  dark:text-white
                  placeholder-gray-400
                  focus:border-purple-500
                  focus:ring-4
                  focus:ring-purple-500/10
                  outline-none
                  transition
                  text-sm
                "
              />
            </div>
          </div>

          <button
            onClick={() =>
              setShowFilters(
                !showFilters
              )
            }
            className="
              px-5
              py-3
              rounded-xl
              bg-white
              dark:bg-gray-800
              border
              border-gray-200
              dark:border-gray-700
              text-gray-600
              dark:text-gray-300
              hover:border-purple-400
              hover:text-purple-600
              transition
              flex
              items-center
              justify-center
              gap-2
              text-sm
              font-medium
            "
          >
            <FaFilter />

            تصفية

            {categoryFilter && (
              <span
                className="
                  w-2
                  h-2
                  bg-purple-500
                  rounded-full
                "
              />
            )}
          </button>
        </div>

        {/* ================================================== */}
        {/* Filters */}
        {/* ================================================== */}

        {showFilters && (
          <div
            className="
              bg-white
              dark:bg-gray-800
              rounded-2xl
              p-4
              shadow-sm
              border
              border-gray-200
              dark:border-gray-700
              mb-6
            "
            data-aos="fade-down"
          >
            <div className="flex flex-wrap gap-2">

              <button
                onClick={() =>
                  setCategoryFilter('')
                }
                className={`
                  px-3
                  py-1.5
                  rounded-lg
                  text-xs
                  font-medium
                  transition
                  ${
                    !categoryFilter
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                الكل
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() =>
                    setCategoryFilter(
                      cat.value
                    )
                  }
                  className={`
                    px-3
                    py-1.5
                    rounded-lg
                    text-xs
                    font-medium
                    transition
                    ${
                      categoryFilter ===
                      cat.value
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {cat.label}
                </button>
              ))}

              {categoryFilter && (
                <button
                  onClick={() =>
                    setCategoryFilter('')
                  }
                  className="
                    px-3
                    py-1.5
                    rounded-lg
                    text-xs
                    bg-red-50
                    text-red-600
                    hover:bg-red-100
                    dark:bg-red-900/20
                    dark:text-red-400
                    transition
                  "
                >
                  <FaTimes className="inline ml-1" />
                  إزالة التصفية
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* Grid */}
        {/* ================================================== */}

        {filteredInfographics.length > 0 ? (
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-3
              gap-5
            "
          >

            {filteredInfographics.map(
              (item, index) => (
                <InfographicCard
                  key={item._id}
                  item={item}
                  index={index}
                  getFileUrl={getFileUrl}
                  onView={handleView}
                  onDownload={
                    handleDownload
                  }
                  formatDate={formatDate}
                />
              )
            )}

          </div>
        ) : (
          /* ================================================= */
          /* Empty */
          /* ================================================= */

          <div
            className="
              bg-white
              dark:bg-gray-800
              rounded-2xl
              p-12
              text-center
              border
              border-gray-200
              dark:border-gray-700
            "
          >
            <div
              className="
                w-16
                h-16
                rounded-2xl
                bg-gray-100
                dark:bg-gray-700
                flex
                items-center
                justify-center
                mx-auto
                mb-4
              "
            >
              <FaChartBar
                className="
                  w-7
                  h-7
                  text-gray-300
                  dark:text-gray-500
                "
              />
            </div>

            <h4
              className="
                text-lg
                font-bold
                text-gray-900
                dark:text-white
                mb-2
              "
            >
              لا توجد إنفوجرافيك
            </h4>

            <p
              className="
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >
              {searchTerm ||
              categoryFilter
                ? 'لا توجد إنفوجرافيك تطابق البحث أو التصفية'
                : 'لم يتم إضافة أي إنفوجرافيك إلى المكتبة بعد'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Infographic Card
// ============================================================

interface InfographicCardProps {
  item: Infographic;
  index: number;
  getFileUrl: (
    fileId?: string
  ) => string;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  formatDate: (date: string) => string;
}

const InfographicCard: React.FC<
  InfographicCardProps
> = ({
  item,
  index,
  getFileUrl,
  onView,
  onDownload,
  formatDate,
}) => {
  // ==========================================================
  // Image state
  // ==========================================================

  const thumbnailUrl = getFileUrl(
    item.thumbnailId?._id
  );

  const originalUrl = getFileUrl(
    item.fileId?._id
  );

  const [imageUrl, setImageUrl] =
    useState<string>(
      thumbnailUrl ||
        originalUrl ||
        ''
    );

  const [imageFailed, setImageFailed] =
    useState(false);

  const [usingOriginal, setUsingOriginal] =
    useState(false);

  // ==========================================================
  // Update image when item changes
  // ==========================================================

  useEffect(() => {
    const firstUrl =
      thumbnailUrl ||
      originalUrl ||
      '';

    setImageUrl(firstUrl);
    setImageFailed(false);
    setUsingOriginal(false);
  }, [
    thumbnailUrl,
    originalUrl,
  ]);

  // ==========================================================
  // Image error
  //
  // If thumbnail fails:
  // try original file.
  //
  // If original also fails:
  // show fallback.
  // ==========================================================

  const handleImageError = () => {
    if (
      !usingOriginal &&
      originalUrl &&
      originalUrl !== imageUrl
    ) {
      console.warn(
        '⚠️ Thumbnail failed. Trying original file:',
        item.fileId?._id
      );

      setUsingOriginal(true);
      setImageUrl(originalUrl);
      return;
    }

    console.error(
      '❌ Failed to load infographic image:',
      {
        infographicId: item._id,
        thumbnailId:
          item.thumbnailId?._id,
        fileId:
          item.fileId?._id,
      }
    );

    setImageFailed(true);
    setImageUrl('');
  };

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div
      className="
        bg-white
        dark:bg-gray-800
        rounded-2xl
        shadow-sm
        border
        border-gray-200
        dark:border-gray-700
        overflow-hidden
        hover:shadow-xl
        hover:-translate-y-1
        transition-all
        duration-300
        group
      "
      data-aos="fade-up"
      data-aos-delay={index * 50}
    >

      {/* ==================================================== */}
      {/* Image */}
      {/* ==================================================== */}

      <div
        className="
          relative
          aspect-[4/3]
          bg-gradient-to-br
          from-gray-100
          to-gray-200
          dark:from-gray-700
          dark:to-gray-800
          overflow-hidden
          cursor-pointer
        "
        onClick={() =>
          onView(item._id)
        }
      >

        {/* ================================================== */}
        {/* Actual uploaded image */}
        {/* ================================================== */}

        {!imageFailed &&
        imageUrl ? (
          <img
            src={imageUrl}
            alt={
              item.titleAr ||
              item.title ||
              'إنفوجرافيك'
            }
            className="
              w-full
              h-full
              object-cover
              transition-transform
              duration-500
              group-hover:scale-105
            "
            loading="lazy"
            onError={
              handleImageError
            }
          />
        ) : (
          /* ================================================ */
          /* Image fallback */
          /* ================================================ */

          <div
            className="
              absolute
              inset-0
              flex
              flex-col
              items-center
              justify-center
              text-gray-400
              dark:text-gray-500
            "
          >
            <FaExclamationTriangle
              className="
                w-10
                h-10
                mb-3
                text-gray-300
                dark:text-gray-600
              "
            />

            <span
              className="
                text-xs
                text-center
                px-4
              "
            >
              تعذر تحميل صورة الإنفوجرافيك
            </span>
          </div>
        )}

        {/* ================================================== */}
        {/* Gradient overlay */}
        {/* ================================================== */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-t
            from-black/60
            via-black/10
            to-transparent
            pointer-events-none
          "
        />

        {/* ================================================== */}
        {/* View button */}
        {/* ================================================== */}

        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            opacity-0
            group-hover:opacity-100
            transition
          "
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(item._id);
            }}
            className="
              w-12
              h-12
              rounded-full
              bg-white/20
              backdrop-blur-md
              border
              border-white/30
              flex
              items-center
              justify-center
              text-white
              hover:bg-white/30
              hover:scale-110
              transition
              shadow-lg
            "
            title="عرض الإنفوجرافيك"
          >
            <FaEye className="w-5 h-5" />
          </button>
        </div>

        {/* ================================================== */}
        {/* Featured */}
        {/* ================================================== */}

        {item.isFeatured && (
          <span
            className="
              absolute
              top-3
              right-3
              px-2.5
              py-1
              rounded-full
              text-[11px]
              font-bold
              bg-amber-500
              text-white
              shadow-lg
            "
          >
            <FaStar
              className="
                inline
                ml-1
              "
            />
            مميز
          </span>
        )}

        {/* ================================================== */}
        {/* Category */}
        {/* ================================================== */}

        <span
          className="
            absolute
            bottom-3
            left-3
            px-2.5
            py-1
            rounded-full
            text-[11px]
            bg-black/50
            backdrop-blur-sm
            text-white
          "
        >
          {item.categoryAr ||
            'إنفوجرافيك'}
        </span>

        {/* ================================================== */}
        {/* Original file fallback indicator */}
        {/* ================================================== */}

        {usingOriginal &&
          item.thumbnailId && (
            <span
              className="
                absolute
                bottom-3
                right-3
                px-2
                py-1
                rounded-full
                text-[10px]
                bg-black/50
                backdrop-blur-sm
                text-white
              "
            >
              الصورة الأصلية
            </span>
          )}
      </div>

      {/* ==================================================== */}
      {/* Content */}
      {/* ==================================================== */}

      <div className="p-4">

        {/* Title */}

        <h3
          className="
            font-bold
            text-base
            text-gray-900
            dark:text-white
            truncate
          "
          title={
            item.titleAr ||
            item.title
          }
        >
          {item.titleAr ||
            item.title}
        </h3>

        {/* Description */}

        {(item.descriptionAr ||
          item.description) && (
          <p
            className="
              text-xs
              text-gray-500
              dark:text-gray-400
              line-clamp-2
              mt-1.5
              leading-5
            "
          >
            {item.descriptionAr ||
              item.description}
          </p>
        )}

        {/* ================================================== */}
        {/* Tags */}
        {/* ================================================== */}

        {item.tags &&
          item.tags.length > 0 && (
            <div
              className="
                flex
                flex-wrap
                gap-1
                mt-3
              "
            >
              {item.tags
                .slice(0, 3)
                .map(
                  (
                    tag,
                    tagIndex
                  ) => (
                    <span
                      key={`${tag}-${tagIndex}`}
                      className="
                        px-2
                        py-0.5
                        rounded-full
                        text-[10px]
                        bg-purple-50
                        dark:bg-purple-900/20
                        text-purple-600
                        dark:text-purple-400
                      "
                    >
                      #{tag}
                    </span>
                  )
                )}
            </div>
          )}

        {/* ================================================== */}
        {/* Stats */}
        {/* ================================================== */}

        <div
          className="
            flex
            items-center
            gap-3
            mt-3
            text-[10px]
            text-gray-400
            dark:text-gray-500
            flex-wrap
          "
        >

          <span
            className="
              flex
              items-center
              gap-1
            "
          >
            <FaEye className="w-3 h-3" />
            {item.views || 0}
          </span>

          <span
            className="
              flex
              items-center
              gap-1
            "
          >
            <FaDownload className="w-3 h-3" />
            {item.downloads || 0}
          </span>

          <span
            className="
              flex
              items-center
              gap-1
            "
          >
            <FaClock className="w-3 h-3" />

            {formatDate(
              item.createdAt
            )}
          </span>
        </div>

        {/* ================================================== */}
        {/* Actions */}
        {/* ================================================== */}

        <div
          className="
            flex
            gap-2
            mt-4
            pt-3
            border-t
            border-gray-200
            dark:border-gray-700
          "
        >

          <button
            onClick={() =>
              onView(item._id)
            }
            className="
              flex-1
              px-3
              py-2.5
              bg-gradient-to-r
              from-purple-600
              to-indigo-600
              text-white
              rounded-xl
              hover:from-purple-700
              hover:to-indigo-700
              transition
              flex
              items-center
              justify-center
              gap-2
              text-xs
              font-semibold
              shadow-sm
            "
          >
            <FaEye className="w-3.5 h-3.5" />
            عرض
          </button>

          <button
            onClick={() =>
              onDownload(item._id)
            }
            className="
              px-4
              py-2.5
              bg-gray-100
              text-gray-600
              dark:bg-gray-700
              dark:text-gray-300
              rounded-xl
              hover:bg-gray-200
              dark:hover:bg-gray-600
              transition
              flex
              items-center
              justify-center
              gap-2
              text-xs
              font-medium
            "
          >
            <FaDownload className="w-3.5 h-3.5" />
            تحميل
          </button>

        </div>
      </div>
    </div>
  );
};

export default Infographics;