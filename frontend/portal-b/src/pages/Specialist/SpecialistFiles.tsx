// frontend/portal-a/src/pages/Specialist/SpecialistFiles.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaSpinner, FaFileAlt, FaFilePdf, FaFileWord, FaFileImage, FaFileExcel, FaDownload, FaEye, FaSearch, FaFilter, FaClock } from 'react-icons/fa';

interface File {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  requestId?: string;
  requestNumber?: string;
  createdAt: string;
  uploadedBy: { _id: string; profile: { fullName: string } };
}

const SpecialistFiles: React.FC = () => {
  const { token } = useAuth();

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const url = categoryFilter === 'all' 
          ? `${API_URL}/files/specialist` 
          : `${API_URL}/files/specialist?category=${categoryFilter}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });
        const data = await response.json();
        if (data.success) {
          setFiles(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [token, categoryFilter]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500 w-5 h-5" />;
    if (mimeType.includes('word')) return <FaFileWord className="text-blue-500 w-5 h-5" />;
    if (mimeType.includes('image')) return <FaFileImage className="text-purple-500 w-5 h-5" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FaFileExcel className="text-green-500 w-5 h-5" />;
    return <FaFileAlt className="text-gray-500 w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredFiles = files.filter(file =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaFileAlt className="text-purple-600" />
          الملفات
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({files.length} ملف)
          </span>
        </h3>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="بحث عن ملف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          >
            <option value="all">جميع الفئات</option>
            <option value="request">مرفقات الطلب</option>
            <option value="delivery">تسليم العمل</option>
            <option value="modification">تعديلات</option>
            <option value="proof">إثباتات</option>
          </select>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            <FaFilter />
          </button>
        </div>
      </div>

      {/* Files List */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file._id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {file.originalName}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.category || 'عام'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FaClock className="w-3 h-3" />
                      {formatDate(file.createdAt)}
                    </span>
                  </div>
                  {file.requestNumber && (
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      طلب #{file.requestNumber}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg transition" title="تحميل">
                    <FaDownload className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded-lg transition" title="معاينة">
                    <FaEye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <FaFileAlt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد ملفات</h4>
          <p className="text-gray-500 dark:text-gray-400">ليس لديك أي ملفات حالياً</p>
        </div>
      )}
    </div>
  );
};

export default SpecialistFiles;