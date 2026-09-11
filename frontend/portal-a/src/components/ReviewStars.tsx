// frontend/portal-a/src/components/ReviewStars.tsx
import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

interface ReviewStarsProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  className?: string;
}

const ReviewStars: React.FC<ReviewStarsProps> = ({
  rating,
  size = 'md',
  showNumber = false,
  className = '',
}) => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const starSize = sizes[size] || sizes.md;

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    if (starValue <= fullStars) {
      return <FaStar key={index} className={`${starSize} text-yellow-400`} />;
    }
    if (starValue === fullStars + 1 && hasHalfStar) {
      return <FaStarHalfAlt key={index} className={`${starSize} text-yellow-400`} />;
    }
    return <FaRegStar key={index} className={`${starSize} text-gray-300 dark:text-gray-600`} />;
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex">{Array.from({ length: 5 }, (_, i) => renderStar(i))}</div>
      {showNumber && (
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default ReviewStars;