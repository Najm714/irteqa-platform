import React from 'react'
import { Link } from 'react-router-dom'
import { 
  FaPlus, FaSearch, FaBook, FaComments, FaPhone, FaCreditCard 
} from 'react-icons/fa'

const QuickActions: React.FC = () => {
  const actions = [
    { label: 'طلب خدمة جديدة', icon: FaPlus, link: '/services', color: 'bg-purple-600' },
    { label: 'استكشاف الخدمات', icon: FaSearch, link: '/services', color: 'bg-blue-600' },
    { label: 'المكتبة الإلكترونية', icon: FaBook, link: '/library', color: 'bg-green-600' },
    { label: 'مركز الرسائل', icon: FaComments, link: '/messages', color: 'bg-indigo-600' },
    { label: 'جدولة مكالمة', icon: FaPhone, link: '/calls', color: 'bg-amber-600' },
    { label: 'المدفوعات', icon: FaCreditCard, link: '/payments', color: 'bg-rose-600' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        إجراءات سريعة
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
          >
            <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform`}>
              <action.icon />
            </div>
            <span className="text-xs text-center text-gray-700 dark:text-gray-300 font-medium">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default QuickActions