// frontend/portal-a/src/pages/Library.tsx

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
  FaDownload,
  FaEye,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFile,
  FaStar,
  FaClock,
  FaFilter,
  FaTimes,
  FaFileAlt,
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

interface LibraryFile {
  _id: string;

  fileId?: FileReference;

  title: string;
  titleAr: string;

  description: string;
  descriptionAr: string;

  category: string;
  categoryAr: string;

  tags: string[];

  isPublished: boolean;
  isFeatured: boolean;

  downloads: number;
  views: number;

  createdAt: string;
}

// ============================================================
// Main Component
// ============================================================

const Library: React.FC = () => {
  const { token } = useAuth();

  const [loading, setLoading] =
    useState(true);

  const [files, setFiles] =
    useState<LibraryFile[]>([]);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [categoryFilter, setCategoryFilter] =
    useState<string>('');

  const [showFilters, setShowFilters] =
    useState(false);

  // ==========================================================
  // Categories
  // ==========================================================

  const categories = [
    {
      value: 'guide',
      label: '📚 دليل',
    },
    {
      value: 'template',
      label: '📄 نموذج',
    },
    {
      value: 'policy',
      label: '📋 سياسة',
    },
    {
      value: 'manual',
      label: '📖 دليل إرشادي',
    },
    {
      value: 'report',
      label: '📊 تقرير',
    },
    {
      value: 'presentation',
      label: '🎯 عرض تقديمي',
    },
    {
      value: 'research',
      label: '🔬 بحث',
    },
    {
      value: 'other',
      label: '📁 أخرى',
    },
  ];

  // ==========================================================
  // Authenticated file URL
  // ==========================================================

  const getFileUrl = useCallback(
    (
      fileId?: string,
      action: 'view' | 'download-direct' = 'download-direct'
    ) => {
      if (!fileId || !token) {
        return '';
      }

      const params = new URLSearchParams({
        token,
        portalId: PORTAL_ID,
      });

      return `${API_URL}/files/${encodeURIComponent(
        fileId
      )}/${action}?${params.toString()}`;
    },
    [token]
  );

  // ==========================================================
  // Fetch library
  // ==========================================================

  const fetchFiles = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let url =
        `${API_URL}/library` +
        `?isPublished=true&limit=100`;

      if (categoryFilter) {
        url += `&category=${encodeURIComponent(
          categoryFilter
        )}`;
      }

      if (searchTerm) {
        url += `&search=${encodeURIComponent(
          searchTerm
        )}`;
      }

      console.log(
        '📤 Fetching library:',
        url
      );

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
          `Library API failed: ${response.status}`
        );
      }

      const data =
        await response.json();

      console.log(
        '📥 Library response:',
        data
      );

      if (data.success) {
        setFiles(data.data || []);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error(
        '❌ Error fetching library files:',
        error
      );

      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    categoryFilter,
    searchTerm,
  ]);

  // ==========================================================
  // Initialize AOS
  // ==========================================================

  useEffect(() => {
    AOS.init({
      duration: 600,
      once: true,
    });
  }, []);

  // ==========================================================
  // Load files
  // ==========================================================

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // ==========================================================
  // Download
  // ==========================================================

  const handleDownload = async (
    id: string,
    filename: string
  ) => {
    if (!token) {
      alert(
        'يرجى تسجيل الدخول أولاً'
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/library/${id}/download`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status}`
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const a =
        document.createElement('a');

      a.href = url;
      a.download =
        filename || 'file';

      document.body.appendChild(a);

      a.click();

      document.body.removeChild(a);

      window.URL.revokeObjectURL(
        url
      );
    } catch (error) {
      console.error(
        '❌ Download error:',
        error
      );

      alert(
        'حدث خطأ في تحميل الملف'
      );
    }
  };

  // ==========================================================
  // File icon
  // ==========================================================

  const getFileIcon = (
    mimeType?: string
  ) => {
    const mime =
      mimeType || '';

    if (
      mime ===
      'application/pdf'
    ) {
      return (
        <FaFilePdf
          className="
            text-red-500
            w-10
            h-10
          "
        />
      );
    }

    if (
      mime.includes('word') ||
      mime.includes(
        'officedocument.wordprocessingml'
      )
    ) {
      return (
        <FaFileWord
          className="
            text-blue-500
            w-10
            h-10
          "
        />
      );
    }

    if (
      mime.includes('excel') ||
      mime.includes(
        'spreadsheetml'
      )
    ) {
      return (
        <FaFileExcel
          className="
            text-green-500
            w-10
            h-10
          "
        />
      );
    }

    if (
      mime.startsWith(
        'image/'
      )
    ) {
      return (
        <FaFileImage
          className="
            text-purple-500
            w-10
            h-10
          "
        />
      );
    }

    return (
      <FaFile
        className="
          text-gray-500
          w-10
          h-10
        "
      />
    );
  };

  // ==========================================================
  // Date
  // ==========================================================

  const formatDate = (
    date: string
  ) => {
    if (!date) {
      return '';
    }

    return new Date(
      date
    ).toLocaleDateString(
      'ar-SA',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };

  // ==========================================================
  // Search
  // ==========================================================

  const filteredFiles =
    files.filter((file) => {
      if (!searchTerm) {
        return true;
      }

      const search =
        searchTerm.toLowerCase();

      return (
        (file.titleAr || '')
          .toLowerCase()
          .includes(search) ||

        (file.title || '')
          .toLowerCase()
          .includes(search) ||

        (file.descriptionAr || '')
          .toLowerCase()
          .includes(search) ||

        (file.description || '')
          .toLowerCase()
          .includes(search) ||

        file.tags?.some(
          (tag) =>
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
      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
          bg-gray-50
          dark:bg-gray-950
        "
      >
        <div className="text-center">

          <div
            className="
              w-20
              h-20
              rounded-3xl
              bg-purple-100
              dark:bg-purple-900/20
              flex
              items-center
              justify-center
              mx-auto
              mb-5
            "
          >
            <FaSpinner
              className="
                w-10
                h-10
                text-purple-600
                animate-spin
              "
            />
          </div>

          <p
            className="
              text-sm
              font-medium
              text-gray-600
              dark:text-gray-400
            "
          >
            جاري تحميل المكتبة...
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
      <div
        className="
          container-custom
          max-w-7xl
        "
      >

        {/* ================================================== */}
        {/* Header */}
        {/* ================================================== */}

        <div
          className="
            text-center
            mb-8
          "
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
            <FaFileAlt
              className="w-6 h-6"
            />
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
            المكتبة
          </h1>

          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mt-2
            "
          >
            استعرض وحمّل الملفات
            والموارد التعليمية المتاحة
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
            <FaFileAlt />

            {filteredFiles.length}
            {' '}
            ملف متاح
          </div>

        </div>

        {/* ================================================== */}
        {/* Search */}
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

            <div
              className="
                relative
              "
            >

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
                placeholder="بحث في المكتبة..."
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

            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >

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

              {categories.map(
                (cat) => (
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
                )
              )}

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
                  <FaTimes
                    className="
                      inline
                      ml-1
                    "
                  />

                  إزالة التصفية
                </button>
              )}

            </div>

          </div>
        )}

        {/* ================================================== */}
        {/* Files Grid */}
        {/* ================================================== */}

        {filteredFiles.length > 0 ? (

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-3
              gap-5
            "
          >

            {filteredFiles.map(
              (file, index) => (
                <LibraryCard
                  key={file._id}
                  file={file}
                  index={index}
                  getFileUrl={
                    getFileUrl
                  }
                  getFileIcon={
                    getFileIcon
                  }
                  onDownload={
                    handleDownload
                  }
                  formatDate={
                    formatDate
                  }
                />
              )
            )}

          </div>

        ) : (

          /* ================================================= */
          /* Empty State */
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
              <FaFileAlt
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
              لا توجد ملفات
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
                ? 'لا توجد ملفات تطابق البحث أو التصفية'
                : 'لم يتم إضافة أي ملفات إلى المكتبة بعد'}
            </p>

          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Library Card
// ============================================================

interface LibraryCardProps {
  file: LibraryFile;
  index: number;

  getFileUrl: (
    fileId?: string,
    action?: 'view' | 'download-direct'
  ) => string;

  getFileIcon: (
    mimeType?: string
  ) => React.ReactNode;

  onDownload: (
    id: string,
    filename: string
  ) => void;

  formatDate: (
    date: string
  ) => string;
}

const LibraryCard: React.FC<
  LibraryCardProps
> = ({
  file,
  index,
  getFileUrl,
  getFileIcon,
  onDownload,
  formatDate,
}) => {
  // ==========================================================
  // File information
  // ==========================================================

  const fileId =
    file.fileId?._id || '';

  const mimeType =
    file.fileId?.mimeType || '';

  const originalName =
    file.fileId?.originalName ||
    'file';

  const isImage =
    mimeType.startsWith(
      'image/'
    );

  // ==========================================================
  // Image URL
  // ==========================================================

  const imageUrl = isImage
    ? getFileUrl(
        fileId,
        'download-direct'
      )
    : '';

  const viewUrl = getFileUrl(
    fileId,
    'view'
  );

  // ==========================================================
  // Image state
  // ==========================================================

  const [imageFailed, setImageFailed] =
    useState(false);

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
      data-aos-delay={
        index * 50
      }
    >

      {/* ==================================================== */}
      {/* File Preview */}
      {/* ==================================================== */}

      <div
        className="
          relative
          aspect-[4/3]
          overflow-hidden
          bg-gradient-to-br
          from-gray-100
          to-gray-200
          dark:from-gray-700
          dark:to-gray-800
        "
      >

        {/* ================================================== */}
        {/* Image file */}
        {/* ================================================== */}

        {isImage &&
        imageUrl &&
        !imageFailed ? (

          <img
            src={imageUrl}
            alt={
              file.titleAr ||
              file.title ||
              originalName
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
            onError={() => {
              console.error(
                '❌ Failed to load library image:',
                {
                  libraryId:
                    file._id,
                  fileId,
                }
              );

              setImageFailed(
                true
              );
            }}
          />

        ) : (

          /* ================================================= */
          /* Non-image file / fallback */
          /* ================================================= */

          <div
            className="
              absolute
              inset-0
              flex
              flex-col
              items-center
              justify-center
              gap-3
            "
          >

            <div
              className="
                w-20
                h-20
                rounded-2xl
                bg-white
                dark:bg-gray-800
                shadow-md
                flex
                items-center
                justify-center
              "
            >
              {isImage &&
              imageFailed ? (
                <FaExclamationTriangle
                  className="
                    w-10
                    h-10
                    text-gray-300
                    dark:text-gray-600
                  "
                />
              ) : (
                getFileIcon(
                  mimeType
                )
              )}
            </div>

            <span
              className="
                max-w-[80%]
                text-center
                text-xs
                text-gray-500
                dark:text-gray-400
                truncate
              "
              title={
                originalName
              }
            >
              {originalName}
            </span>

          </div>
        )}

        {/* ================================================== */}
        {/* Gradient */}
        {/* ================================================== */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-t
            from-black/60
            via-black/5
            to-transparent
            pointer-events-none
          "
        />

        {/* ================================================== */}
        {/* Featured */}
        {/* ================================================== */}

        {file.isFeatured && (
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
          {file.categoryAr ||
            'ملف'}
        </span>

        {/* ================================================== */}
        {/* File type */}
        {/* ================================================== */}

        <span
          className="
            absolute
            bottom-3
            right-3
            px-2.5
            py-1
            rounded-full
            text-[10px]
            bg-black/50
            backdrop-blur-sm
            text-white
          "
        >
          {mimeType
            ? mimeType
                .split('/')
                .pop()
                ?.toUpperCase()
            : 'FILE'}
        </span>

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
            file.titleAr ||
            file.title
          }
        >
          {file.titleAr ||
            file.title}
        </h3>

        {/* Description */}

        {(file.descriptionAr ||
          file.description) && (
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
            {file.descriptionAr ||
              file.description}
          </p>
        )}

        {/* ================================================== */}
        {/* Tags */}
        {/* ================================================== */}

        {file.tags &&
          file.tags.length > 0 && (
            <div
              className="
                flex
                flex-wrap
                gap-1
                mt-3
              "
            >

              {file.tags
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

              {file.tags.length >
                3 && (
                <span
                  className="
                    px-2
                    py-0.5
                    rounded-full
                    text-[10px]
                    bg-gray-100
                    dark:bg-gray-700
                    text-gray-400
                  "
                >
                  +
                  {file.tags.length -
                    3}
                </span>
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
            <FaDownload
              className="w-3 h-3"
            />

            {file.downloads ||
              0}
          </span>

          <span
            className="
              flex
              items-center
              gap-1
            "
          >
            <FaEye
              className="w-3 h-3"
            />

            {file.views || 0}
          </span>

          <span
            className="
              flex
              items-center
              gap-1
            "
          >
            <FaClock
              className="w-3 h-3"
            />

            {formatDate(
              file.createdAt
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

          {/* Download */}

          <button
            onClick={() =>
              onDownload(
                file._id,
                originalName
              )
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
            <FaDownload
              className="w-3.5 h-3.5"
            />

            تحميل
          </button>

          {/* Preview */}

          <button
            onClick={() => {
              if (viewUrl) {
                window.open(
                  viewUrl,
                  '_blank',
                  'noopener,noreferrer'
                );
              }
            }}
            disabled={!viewUrl}
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
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            <FaEye
              className="w-3.5 h-3.5"
            />

            معاينة
          </button>

        </div>

      </div>
    </div>
  );
};

export default Library;
