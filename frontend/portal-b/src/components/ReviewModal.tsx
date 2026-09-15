// frontend/portal-a/src/components/ReviewModal.tsx
import React, { useState } from 'react';
import { FaStar, FaTimes, FaSpinner } from 'react-icons/fa';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  onSubmit: (data: ReviewData) => Promise<void>;
}

interface ReviewData {
  requestId: string;
  rating: number;
  comment: string;
  aspects: {
    quality: number;
    communication: number;
    timeliness: number;
    value: number;
  };
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  requestId,
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [aspects, setAspects] = useState({
    quality: 0,
    communication: 0,
    timeliness: 0,
    value: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        requestId,
        rating,
        comment,
        aspects,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في إرسال التقييم');
    } finally {
      setLoading(false);
    }
  };

  const AspectRating = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-1">
      <label className="block text-sm text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <FaStar
              className={`w-6 h-6 ${
                star <= value
                  ? 'text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            تقييم الخدمة
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <FaTimes className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* التقييم العام */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              التقييم العام
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <FaStar
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating === 0 && (
              <p className="text-sm text-red-500 mt-1">يرجى اختيار تقييم</p>
            )}
          </div>

          {/* جوانب التقييم */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              جوانب التقييم
            </h3>
            <AspectRating
              label="جودة العمل"
              value={aspects.quality}
              onChange={(value) => setAspects({ ...aspects, quality: value })}
            />
            <AspectRating
              label="التواصل"
              value={aspects.communication}
              onChange={(value) => setAspects({ ...aspects, communication: value })}
            />
            <AspectRating
              label="الالتزام بالوقت"
              value={aspects.timeliness}
              onChange={(value) => setAspects({ ...aspects, timeliness: value })}
            />
            <AspectRating
              label="القيمة مقابل السعر"
              value={aspects.value}
              onChange={(value) => setAspects({ ...aspects, value: value })}
            />
          </div>

          {/* التعليق */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تعليق (اختياري)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="شاركنا رأيك في الخدمة..."
            />
          </div>

          {/* أزرار */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50"
            >
              {loading ? (
                <FaSpinner className="animate-spin mx-auto" />
              ) : (
                'إرسال التقييم'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;