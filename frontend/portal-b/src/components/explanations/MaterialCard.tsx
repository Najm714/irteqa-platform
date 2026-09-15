import React from 'react'
import { Link } from 'react-router-dom'
import { FaVideo, FaUsers, FaStar, FaPlay, FaInfoCircle, FaTag, FaCheckCircle } from 'react-icons/fa'; // ✅ أضف FaTag و FaCheckCircle


interface MaterialCardProps {
  material: {
    _id: string
    title: string
    code: string
    instructor: string
    description: string
    icon: string
    price: number
    isFeatured: boolean
  }
  specialty: {
    name: string
  }
  videoCount: number
  isSubscribed: boolean
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, specialty, videoCount, isSubscribed }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
      {material.isFeatured && (
        <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <FaStar /> مميز
        </span>
      )}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-500"></div>
      
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">
          {material.code}
        </span>
        <span className="text-2xl">
          <i className={`fas ${material.icon || 'fa-book'}`}></i>
        </span>
      </div>

      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{material.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        <FaUsers className="inline ml-1" /> {material.instructor}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{material.description}</p>
      
      <div className="mt-2">
        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full">
          <FaTag className="inline ml-1 text-xs" /> {specialty.name}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span><FaVideo className="inline ml-1" /> {videoCount}</span>
          {!isSubscribed && (
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {material.price} ريال
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isSubscribed ? (
            <Link
              to={`/material-content/${material._id}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
            >
              <FaPlay /> فتح
            </Link>
          ) : (
            <Link
              to={`/subscription?materialId=${material._id}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              <FaPlay /> اشتراك
            </Link>
          )}
          <Link
            to={`/material-detail/${material._id}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <FaInfoCircle /> تفاصيل
          </Link>
        </div>
      </div>

      {isSubscribed && (
        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
          <FaCheckCircle className="inline ml-1" /> مشترك
        </div>
      )}
    </div>
  )
}

export default MaterialCard