import React from 'react'
import { FaUniversity } from 'react-icons/fa'

interface UniversityCardProps {
  university: {
    _id: string
    name: string
    icon: string
  }
  collegeCount: number
  onClick: () => void
}

const UniversityCard: React.FC<UniversityCardProps> = ({ university, collegeCount, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl p-5 text-center border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-500"></div>
      <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        {collegeCount}
      </span>
      <div className="text-4xl mb-3">
        <i className={`fas ${university.icon || 'fa-university'}`}></i>
      </div>
      <h3 className="font-bold text-gray-900 dark:text-white">{university.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{collegeCount} كلية</p>
      <div className="mt-3 text-xs text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <i className="fas fa-arrow-left ml-1"></i> اضغط للتفاصيل
      </div>
    </div>
  )
}

export default UniversityCard