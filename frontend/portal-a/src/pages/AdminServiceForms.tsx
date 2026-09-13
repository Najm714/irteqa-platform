// frontend/portal-a/src/pages/AdminServiceForms.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaSpinner, FaSearch, FaExclamationCircle,
  FaSave, FaTimes, FaFileAlt, FaUpload,
  FaCheckCircle, FaTimesCircle, FaFilePdf,
  FaFileWord, FaFileImage, FaFile,
} from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface Section {
  _id: string;
  name: string;
  nameAr: string;
}

interface Service {
  _id: string;
  name: string;
  nameAr: string;
  sectionId?: string | { _id: string; name: string; nameAr: string }; // ✅ إضافة
  isPublished?: boolean;
  icon: string;
}

interface ServiceForm {
  _id: string;
  sectionId: Section | string;
  serviceId: Service | string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  fileId: { _id: string; originalName: string; size: number; mimeType: string };
  filename: string;
  fileSize: number;
  fileMimeType: string;
  isPublished: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const AdminServiceForms: React.FC = () => {
  const { token } = useAuth();
  const [serviceForms, setServiceForms] = useState<ServiceForm[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    sectionId: '',
    serviceId: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    fileId: '',
    filename: '',
    fileSize: 0,
    fileMimeType: '',
    isPublished: true,
    order: 0,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // جلب البيانات
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [formsRes, sectionsRes, servicesRes] = await Promise.all([
        fetch(`${API_URL}/service-forms`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID },
        }),
        fetch(`${API_URL}/sections`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID },
        }),
        fetch(`${API_URL}/services`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID },
        }),
      ]);

      const formsData = await formsRes.json();
      const sectionsData = await sectionsRes.json();
      const servicesData = await servicesRes.json();

      if (formsData.success) setServiceForms(formsData.data || []);
      if (sectionsData.success) setSections(sectionsData.data || []);
      if (servicesData.success) setServices(servicesData.data || []);
    } catch (err) {
      setError('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, PORTAL_ID]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchData();
  }, [fetchData]);

  // رفع الملف
  const uploadFormFile = async (file: File): Promise<any> => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('portalId', PORTAL_ID);

      const response = await fetch(`${API_URL}/service-forms/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setUploadProgress(100);
        return data.data;
      }
      throw new Error(data.message || 'فشل رفع الملف');
    } catch (err: any) {
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // حفظ البيانات
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let fileData = null;

      // رفع الملف إذا تم اختياره
      if (selectedFile) {
        fileData = await uploadFormFile(selectedFile);
        formData.fileId = fileData.fileId;
        formData.filename = fileData.filename;
        formData.fileSize = fileData.size;
        formData.fileMimeType = fileData.mimeType;
      }

      const url = editingId ? `${API_URL}/service-forms/${editingId}` : `${API_URL}/service-forms`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        await fetchData();
        resetForm();
        setShowForm(false);
        setEditingId(null);
        setSelectedFile(null);
        alert('✅ تم حفظ النموذج بنجاح!');
      } else {
        alert(data.message || 'حدث خطأ في حفظ النموذج');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في حفظ النموذج');
    }
  };

  const resetForm = () => {
    setFormData({
      sectionId: '',
      serviceId: '',
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      fileId: '',
      filename: '',
      fileSize: 0,
      fileMimeType: '',
      isPublished: true,
      order: 0,
    });
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData({
        ...formData,
        filename: file.name,
        fileSize: file.size,
        fileMimeType: file.type,
      });
    }
  };

  const editForm = (form: ServiceForm) => {
    setFormData({
      sectionId: typeof form.sectionId === 'object' ? form.sectionId._id : form.sectionId,
      serviceId: typeof form.serviceId === 'object' ? form.serviceId._id : form.serviceId,
      name: form.name || '',
      nameAr: form.nameAr || '',
      description: form.description || '',
      descriptionAr: form.descriptionAr || '',
      fileId: typeof form.fileId === 'object' ? form.fileId._id : form.fileId,
      filename: form.filename || '',
      fileSize: form.fileSize || 0,
      fileMimeType: form.fileMimeType || '',
      isPublished: form.isPublished,
      order: form.order || 0,
    });
    setEditingId(form._id);
    setShowForm(true);
  };

  const deleteForm = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا النموذج؟')) return;
    try {
      const response = await fetch(`${API_URL}/service-forms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID },
      });
      const data = await response.json();
      if (data.success) await fetchData();
    } catch (err) {
      alert('حدث خطأ في الحذف');
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/service-forms/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID },
      });
      const data = await response.json();
      if (data.success) await fetchData();
    } catch (err) {
      alert('حدث خطأ في تغيير الحالة');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500" />;
    if (mimeType.includes('word')) return <FaFileWord className="text-blue-500" />;
    if (mimeType.includes('image')) return <FaFileImage className="text-purple-500" />;
    return <FaFileAlt className="text-gray-500" />;
  };

  const filteredForms = serviceForms.filter(f => {
    const serviceName = typeof f.serviceId === 'object' ? (f.serviceId.nameAr || f.serviceId.name) : '';
    const sectionName = typeof f.sectionId === 'object' ? (f.sectionId.nameAr || f.sectionId.name) : '';
    return serviceName.includes(searchTerm) || sectionName.includes(searchTerm) || (f.nameAr || f.name).includes(searchTerm);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaFileAlt className="text-purple-600" />
              إدارة نماذج الخدمات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة نماذج الخدمات ورفع الملفات
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setEditingId(null); setShowForm(!showForm); }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'إلغاء' : 'إضافة نموذج جديد'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'تعديل النموذج' : 'إضافة نموذج جديد'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    القسم *
                  </label>
                  <select
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  >
                    <option value="">اختر القسم</option>
                    {sections.map((s) => (
                      <option key={s._id} value={s._id}>{s.nameAr || s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الخدمة *
                  </label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  >
                    <option value="">اختر الخدمة</option>
                    {services
  .filter(s => {
    const sSectionId = typeof s.sectionId === 'object' ? s.sectionId?._id : s.sectionId;
    return sSectionId === formData.sectionId || !formData.sectionId;
  })
  .map((s) => (
                      <option key={s._id} value={s._id}>{s.nameAr || s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    اسم النموذج (عربي) *
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                    placeholder="نموذج طلب الخدمة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    اسم النموذج (إنجليزي)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="Service Request Form"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الوصف (عربي)
                  </label>
                  <textarea
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="وصف النموذج"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الوصف (إنجليزي)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="Form description"
                  />
                </div>
              </div>

              {/* رفع الملف */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ملف النموذج *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-3">
                        {getFileIcon(selectedFile.type)}
                        <span className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</span>
                        <span className="text-sm text-gray-500">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setFormData({ ...formData, filename: '', fileSize: 0, fileMimeType: '' }); }}
                        className="text-red-500 text-sm hover:text-red-700 transition"
                      >
                        إزالة الملف
                      </button>
                      {uploading && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <FaUpload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">اضغط لرفع ملف النموذج</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, PowerPoint, Images - الحد الأقصى 10MB</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 px-4 py-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                      >
                        اختيار ملف
                      </button>
                    </div>
                  )}
                </div>
                {editingId && !selectedFile && formData.fileId && (
                  <p className="text-sm text-green-600 mt-2">✅ ملف موجود حالياً</p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">منشور</span>
                </label>
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mr-2">الترتيب</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={uploading} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50">
                  {uploading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {uploading ? 'جاري الرفع...' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); setEditingId(null); }}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث عن نموذج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            {filteredForms.length} نموذج
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الخدمة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">القسم</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">اسم النموذج</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الملف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredForms.map((form, index) => {
                  const serviceName = typeof form.serviceId === 'object' ? (form.serviceId.nameAr || form.serviceId.name) : '';
                  const sectionName = typeof form.sectionId === 'object' ? (form.sectionId.nameAr || form.sectionId.name) : '';
                  const fileInfo = typeof form.fileId === 'object' ? form.fileId : null;
                  return (
                    <tr key={form._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{serviceName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{sectionName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{form.nameAr || form.name}</td>
                      <td className="px-4 py-3">
                        {fileInfo ? (
                          <div className="flex items-center gap-2">
                            {getFileIcon(fileInfo.mimeType || '')}
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                              {fileInfo.originalName || form.filename}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">لا يوجد</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          form.isPublished
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {form.isPublished ? 'منشور' : 'غير منشور'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => toggleStatus(form._id)} className={`p-2 rounded-lg transition ${
                            form.isPublished
                              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                          }`} title={form.isPublished ? 'إخفاء' : 'نشر'}>
                            {form.isPublished ? <FaEyeSlash /> : <FaEye />}
                          </button>
                          <button onClick={() => editForm(form)} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition" title="تعديل">
                            <FaEdit />
                          </button>
                          <button onClick={() => deleteForm(form._id)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition" title="حذف">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredForms.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد نماذج</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminServiceForms;