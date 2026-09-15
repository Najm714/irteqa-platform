import React from 'react'
import { FaSchool, FaUniversity } from 'react-icons/fa'

interface CollegeCardProps {
  college: {
    _id: string
    name: string
    icon: string
    description?: string
  }
  university: {
    name: string
  }
  specialtyCount: number
  onClick: () => void
}

const CollegeCard: React.FC<CollegeCardProps> = ({ college, university, specialtyCount, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-amber-500"></div>
      <div className="text-3xl mb-2">
        <i className={`fas ${college.icon || 'fa-school'}`}></i>
      </div>
      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{college.name}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        <FaUniversity className="inline ml-1 text-xs" />
        {university.name}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{specialtyCount} تخصص</p>
      {college.description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">{college.description}</p>
      )}
      <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <i className="fas fa-arrow-left ml-1"></i> اضغط للتفاصيل
      </div>
    </div>
  )
}

export default CollegeCard