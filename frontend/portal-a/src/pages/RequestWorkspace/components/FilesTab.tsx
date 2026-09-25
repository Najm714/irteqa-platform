// src/pages/RequestWorkspace/components/FilesTab.tsx
import React, { useState, useRef } from 'react';
import {
  FaUpload,
  FaPlus,
  FaTrash,
  FaDownload,
  FaEye,
  FaFile,
  FaFilePdf,
  FaFileWord,
  FaFileImage,
  FaSpinner,
} from 'react-icons/fa';
import type { Request, FileCategory, PaymentProof, RequestFileEntry } from '../types';
import {
  FILE_CATEGORIES_BY_ROLE,
  FILE_CATEGORY_TEXT,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from '../utils/constants';
import { formatFileSize } from '../utils/formatters';

interface FilesTabProps {
  request: Request;
  userRole: string;
  canEdit: boolean;
  onUploadFiles: (files: File[], category: FileCategory) => Promise<boolean>;
  onViewFile: (fileId: string) => void;
  onDownloadFile: (fileId: string, filename: string) => void;
}

export const FilesTab: React.FC<FilesTabProps> = ({
  request,
  userRole,
  canEdit,
  onUploadFiles,
  onViewFile,
  onDownloadFile,
}) => {
  const [uploadCategory, setUploadCategory] =
    useState<FileCategory>('request');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableCategories =
    FILE_CATEGORIES_BY_ROLE[userRole] || FILE_CATEGORIES_BY_ROLE.customer;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    const validFiles = fileList.filter((f) => f.size <= MAX_FILE_SIZE_BYTES);

    if (validFiles.length !== fileList.length) {
      alert(
        `⚠️ ${fileList.length - validFiles.length} ملف يتجاوز ${MAX_FILE_SIZE_MB}MB`
      );
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const success = await onUploadFiles(selectedFiles, uploadCategory);

    if (success) {
      setSelectedFiles([]);
    }
    setUploading(false);
  };

  const filesByCategory = (category: FileCategory) =>
    request.files?.filter((f) => f.category === category) || [];

  const hasAnyFiles =
    request.files?.length > 0 || request.paymentProofs?.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        📁 الملفات
      </h3>

      {/* Upload Section */}
      {canEdit && (
        <div className="mb-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
          <div className="flex flex-wrap gap-2 mb-3">
            <select
              value={uploadCategory}
              onChange={(e) =>
                setUploadCategory(e.target.value as FileCategory)
              }
              className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {FILE_CATEGORY_TEXT[cat]}
                </option>
              ))}
            </select>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
            >
              <FaPlus className="inline ml-1" /> اختيار ملفات
            </button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getFileIcon(file.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700 transition p-1"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                {uploading ? 'جاري الرفع...' : `رفع ${selectedFiles.length} ملف`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Files List */}
      <div className="space-y-4">
        {(['request', 'delivery', 'modification', 'final', 'support'] as FileCategory[]).map(
          (category) => {
            const files = filesByCategory(category);
            if (files.length === 0) return null;

            return (
              <div key={category}>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {FILE_CATEGORY_TEXT[category]}
                </h4>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <FileItem
                      key={index}
                      file={file}
                      onView={onViewFile}
                      onDownload={onDownloadFile}
                    />
                  ))}
                </div>
              </div>
            );
          }
        )}

        {/* Payment Proofs */}
        {request.paymentProofs && request.paymentProofs.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
              💳 إثباتات الدفع
            </h4>
            <div className="space-y-2">
              {request.paymentProofs.map((proof, index) => (
                <PaymentProofItem
                  key={index}
                  proof={proof}
                  onView={onViewFile}
                  onDownload={onDownloadFile}
                />
              ))}
            </div>
          </div>
        )}

        {!hasAnyFiles && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaFile className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>لا توجد ملفات</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// ✅ File Icon
// ============================================================
const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return <FaFile className="text-gray-500 w-5 h-5" />;
  if (mimeType === 'application/pdf')
    return <FaFilePdf className="text-red-500 w-5 h-5" />;
  if (mimeType.includes('word'))
    return <FaFileWord className="text-blue-500 w-5 h-5" />;
  if (mimeType.includes('image'))
    return <FaFileImage className="text-purple-500 w-5 h-5" />;
  return <FaFile className="text-gray-500 w-5 h-5" />;
};

// ============================================================
// ✅ File Item
// ============================================================
const FileItem: React.FC<{
  file: RequestFileEntry;
  onView: (fileId: string) => void;
  onDownload: (fileId: string, filename: string) => void;
}> = ({ file, onView, onDownload }) => {
  const fileId = file.fileId?._id;
  const filename = file.fileId?.originalName || '';
  const mimeType = file.fileId?.mimeType;
  const size = file.fileId?.size;

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {getFileIcon(mimeType)}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {filename}
          </p>
          <p className="text-xs text-gray-400">
            {size ? formatFileSize(size) : ''}
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onDownload(fileId, filename)}
          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
          title="تحميل"
        >
          <FaDownload />
        </button>
        <button
          onClick={() => onView(fileId)}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 transition"
          title="معاينة"
        >
          <FaEye />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// ✅ Payment Proof Item
// ============================================================
const PaymentProofItem: React.FC<{
  proof: PaymentProof;
  onView: (fileId: string) => void;
  onDownload: (fileId: string, filename: string) => void;
}> = ({ proof, onView, onDownload }) => {
  const fileId = proof.fileId?._id;
  const filename = proof.fileId?.originalName || proof.filename;
  const mimeType = proof.fileId?.mimeType;

  return (
    <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {getFileIcon(mimeType)}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {filename}
          </p>
          <p className="text-xs">
            {proof.verified ? (
              <span className="text-green-500">✅ مؤكد</span>
            ) : proof.rejectionReason ? (
              <span className="text-red-500">
                ❌ مرفوض: {proof.rejectionReason}
              </span>
            ) : (
              <span className="text-yellow-500">⏳ قيد المراجعة</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onDownload(fileId, filename)}
          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
          title="تحميل"
        >
          <FaDownload />
        </button>
        <button
          onClick={() => onView(fileId)}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 transition"
          title="معاينة"
        >
          <FaEye />
        </button>
      </div>
    </div>
  );
};