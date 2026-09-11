// frontend/portal-a/src/pages/Reviews.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ReviewStars from '../components/ReviewStars';
import { FaUser, FaCalendar, FaSpinner, FaSearch } from 'react-icons/fa';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  aspects: {
    quality: number;
    communication: number;
    timeliness: number;
    value: number;
  };
  reviewerId: {
    _id: string;
    profile: { fullName: string };
    email: string;
  };
  requestId: {
    _id: string;
    title: string;
    status: string;
    createdAt: string;
  };
  serviceId: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

const Reviews: React.FC = () => {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    average: 0,
    count: 0,
    distribution: {} as Record<string, number>,
  });
  const [filter, setFilter] = useState({
    minRating: '',
    maxRating: '',
    search: '',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const specialistId = user?.id || '';

  // جلب التقييمات
  useEffect(() => {
    const fetchReviews = async () => {
      if (!token || !specialistId) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filter.minRating) params.append('minRating', filter.minRating);
        if (filter.maxRating) params.append('maxRating', filter.maxRating);

        const response = await fetch(
          `${API_URL}/reviews/specialist/${specialistId}?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch reviews');

        const data = await response.json();
        if (data.success) {
          setReviews(data.data);
          setStats(data.stats);
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ في تحميل التقييمات');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token, specialistId, filter]);

  // تصفية التقييمات حسب البحث
  const filteredReviews = reviews.filter((review) =>
    filter.search
      ? review.comment?.includes(filter.search) ||
        review.reviewerId?.profile?.fullName?.includes(filter.search)
      : true
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            التقييمات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            تقييمات العملاء للخدمات المقدمة
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center border border-gray-200 dark:border-gray-700">
            <div className="text-4xl font-bold text-purple-600">
              {stats.average.toFixed(1)}
            </div>
            <div className="flex justify-center mt-2">
              <ReviewStars rating={stats.average} size="lg" />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              متوسط التقييم
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center border border-gray-200 dark:border-gray-700">
            <div className="text-4xl font-bold text-blue-600">{stats.count}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              إجمالي التقييمات
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center border border-gray-200 dark:border-gray-700">
            <div className="text-4xl font-bold text-green-600">
              {Object.keys(stats.distribution).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              مستويات التقييم
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FaSearch className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث في التعليقات..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                />
              </div>
            </div>
            <select
              value={filter.minRating}
              onChange={(e) => setFilter({ ...filter, minRating: e.target.value })}
              className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            >
              <option value="">الحد الأدنى</option>
              <option value="1">1 نجمة</option>
              <option value="2">2 نجمة</option>
              <option value="3">3 نجمة</option>
              <option value="4">4 نجمة</option>
              <option value="5">5 نجمة</option>
            </select>
            <select
              value={filter.maxRating}
              onChange={(e) => setFilter({ ...filter, maxRating: e.target.value })}
              className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            >
              <option value="">الحد الأعلى</option>
              <option value="1">1 نجمة</option>
              <option value="2">2 نجمة</option>
              <option value="3">3 نجمة</option>
              <option value="4">4 نجمة</option>
              <option value="5">5 نجمة</option>
            </select>
          </div>
        </div>
ئ
        {/* Error */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4 opacity-30">⭐</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              لا توجد تقييمات
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter.search ? 'لا توجد تقييمات تطابق بحثك' : 'لم يتم تلقي أي تقييمات بعد'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold">
                          {review.reviewerId?.profile?.fullName?.charAt(0) || 'م'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {review.reviewerId?.profile?.fullName || 'مستخدم'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {review.reviewerId?.email || ''}
                          </p>
                        </div>
                      </div>
                      <ReviewStars rating={review.rating} size="sm" />
                      <span className="text-sm font-bold text-purple-600">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>

                    {review.comment && (
                      <p className="text-gray-700 dark:text-gray-300 mt-3">
                        {review.comment}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        <FaUser className="inline ml-1" />
                        {review.serviceId?.name || 'خدمة'}
                      </span>
                      <span>
                        <FaCalendar className="inline ml-1" />
                        {new Date(review.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* جوانب التقييم */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(review.aspects || {}).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getAspectLabel(key)}
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {value}
                        </div>
                        <ReviewStars rating={value} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== دوال مساعدة =====

const getAspectLabel = (key: string): string => {
  const labels: Record<string, string> = {
    quality: 'جودة العمل',
    communication: 'التواصل',
    timeliness: 'الالتزام بالوقت',
    value: 'القيمة مقابل السعر',
  };
  return labels[key] || key;
};

export default Reviews;