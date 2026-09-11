import React from 'react'
import { Link } from 'react-router-dom'
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaStar } from 'react-icons/fa'

interface ProfileCardProps {
  user: any
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-3xl text-white mx-auto">
          {user?.fullName?.charAt(0) || 'U'}
        </div>
        <button className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 bg-purple-600 text-white p-1.5 rounded-full hover:bg-purple-700 transition-colors">
          <FaEdit className="text-xs" />
        </button>
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-3">
        {user?.fullName || 'مستخدم'}
      </h3>
      
      <div className="flex items-center justify-center gap-1 mt-1 text-amber-500">
        <FaStar />
        <FaStar />
        <FaStar />
        <FaStar />
        <FaStar className="opacity-50" />
        <span className="text-sm text-gray-600 dark:text-gray-400 mr-1">(4.8)</span>
      </div>

      <div className="mt-3 space-y-2 text-sm text-right">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <FaEnvelope className="text-purple-600" />
          <span className="truncate">{user?.email || 'user@email.com'}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <FaPhone className="text-purple-600" />
          <span>{user?.phone || '+966 5X XXX XXXX'}</span>
        </div>
      </div>

      <Link
        to="/profile"
        className="block mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
      >
        عرض الملف الشخصي
      </Link>
    </div>
  )
}

export default ProfileCard