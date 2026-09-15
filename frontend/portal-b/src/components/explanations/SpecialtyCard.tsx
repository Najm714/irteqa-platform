import React from 'react'
import { FaTag, FaSchool } from 'react-icons/fa'

interface SpecialtyCardProps {
  specialty: {
    _id: string
    name: string
    icon: string
    description?: string
  }
  college: {
    name: string
  }
  materialCount: number
  onClick: () => void
}

const SpecialtyCard: React.FC<SpecialtyCardProps> = ({ specialty, college, materialCount, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
      <div className="text-3xl mb-2">
        <i className={`fas ${specialty.icon || 'fa-tag'}`}></i>
      </div>
      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{specialty.name}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        <FaSchool className="inline ml-1 text-xs" />
        {college.name}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{materialCount} مادة</p>
      {specialty.description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">{specialty.description}</p>
      )}
      <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <i className="fas fa-arrow-left ml-1"></i> اضغط للتفاصيل
      </div>
    </div>
  )
}

export default SpecialtyCard