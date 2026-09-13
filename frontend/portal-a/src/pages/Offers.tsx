// frontend/portal-a/src/pages/Offers.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaSearch, FaTag, FaStar, FaClock,
  FaFilter, FaTimes, FaPercentage, FaMoneyBill,
  FaEye, FaArrowLeft, FaArrowRight,
} from 'react-icons/fa';

// ============================================================
// ✅ واجهات البيانات
// ============================================================

interface Offer {
  _id: string;
  imageId?: {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  discountType: string;
  discountValue: number;
  discountValueAr: string;
  originalPrice: number;
  offerPrice: number;
  currency: string;
  startDate: string;
  endDate: string;
  category: string;
  categoryAr: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  isActive: boolean;
  views: number;
  clicks: number;
  createdAt: string;
  isActiveOffer: boolean;
  discountPercentage: number;
  savings: number;
}

// ============================================================
// ✅ المكون الرئيسي
// ============================================================

const Offers: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { value: 'service', label: '🛠️ خدمات' },
    { value: 'product', label: '📦 منتجات' },
    { value: 'subscription', label: '📋 اشتراكات' },
    { value: 'event', label: '🎪 فعاليات' },
    { value: 'course', label: '📚 دورات' },
    { value: 'other', label: '📁 أخرى' },
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // ===== جلب العروض =====
  const fetchOffers = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      let url = `${API_URL}/offers?isPublished=true&isActive=true&limit=100`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        setOffers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  }, [token, categoryFilter, searchTerm]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchOffers();
  }, [fetchOffers]);

  // ===== تنسيق التاريخ =====
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ===== تصفية العروض =====
  const filteredOffers = offers.filter(offer => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (offer.titleAr || '').toLowerCase().includes(search) ||
      (offer.title || '').toLowerCase().includes(search) ||
      (offer.descriptionAr || '').toLowerCase().includes(search) ||
      (offer.description || '').toLowerCase().includes(search) ||
      offer.tags?.some(t => t.toLowerCase().includes(search))
    );
  });

  // ===== العروض النشطة =====
  const activeOffers = filteredOffers.filter(o => o.isActiveOffer);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل العروض...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom max-w-7xl">
        {/* ===== Header ===== */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <FaTag className="text-purple-600" />
            العروض والخصومات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            استعرض أحدث العروض والخصومات المتاحة
          </p>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {activeOffers.length} عرض نشط
          </div>
        </div>

        {/* ===== Search & Filter ===== */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث في العروض..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
          >
            <FaFilter />
            تصفية
            {categoryFilter && <span className="w-2 h-2 bg-purple-500 rounded-full" />}
          </button>
        </div>

        {/* ===== Filters ===== */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter('')}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  !categoryFilter
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                الكل
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    categoryFilter === cat.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
              {categoryFilter && (
                <button
                  onClick={() => setCategoryFilter('')}
                  className="px-3 py-1.5 rounded-lg text-sm bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                >
                  <FaTimes className="inline ml-1" /> إزالة التصفية
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===== Grid ===== */}
        {activeOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOffers.map((offer, index) => (
              <div
                key={offer._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group"
                data-aos="fade-up"
                data-aos-delay={index * 50}
              >
                {/* ===== Image ===== */}
                <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {offer.imageId ? (
                    <img
                      src={`${API_URL}/offers/${offer._id}/image?token=${localStorage.getItem('token')}`}
                      alt={offer.titleAr}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <FaTag className="w-16 h-16" />
                      <span className="text-sm mt-2">لا توجد صورة</span>
                    </div>
                  )}
                  
                  {/* ===== Badges ===== */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {offer.isFeatured && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white">
                        <FaStar className="inline ml-1" /> مميز
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                      {offer.discountValueAr || `${offer.discountValue}%`}
                    </span>
                  </div>
                  
                  {/* ===== Price Overlay ===== */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-lg">
                    <span className="text-sm line-through text-gray-400">{offer.originalPrice} ريال</span>
                    <span className="text-lg font-bold text-white">{offer.offerPrice} ريال</span>
                  </div>
                </div>

                {/* ===== Content ===== */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                    {offer.titleAr || offer.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                    {offer.descriptionAr || offer.description || 'لا يوجد وصف'}
                  </p>

                  {/* ===== Tags ===== */}
                  {offer.tags && offer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {offer.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ===== Stats ===== */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FaClock className="w-3 h-3" />
                      حتى {formatDate(offer.endDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaEye className="w-3 h-3" /> {offer.views || 0}
                    </span>
                  </div>

                  {/* ===== Actions ===== */}
                  <button
                    onClick={() => {
                      // تسجيل النقرة
                      fetch(`${API_URL}/offers/${offer._id}/click`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'X-Portal-Id': PORTAL_ID,
                        },
                      });
                      // فتح رابط العرض (يمكن تخصيصه)
                      window.open(`/offer/${offer._id}`, '_blank');
                    }}
                    className="w-full mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <FaTag className="w-4 h-4" />
                    استفد من العرض
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <FaTag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد عروض</h4>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || categoryFilter ? 'لا توجد عروض تطابق البحث' : 'لا توجد عروض متاحة حالياً'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;