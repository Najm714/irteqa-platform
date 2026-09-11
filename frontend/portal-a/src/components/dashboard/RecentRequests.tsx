import React from 'react'
import { Link } from 'react-router-dom'
import { FaEye, FaClock, FaCheckCircle, FaHourglassHalf } from 'react-icons/fa'

interface RecentRequestsProps {
  requests: Array<{
    id: string
    service: string
    status: string
    date: string
    specialist: string
  }>
}

const RecentRequests: React.FC<RecentRequestsProps> = ({ requests }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return FaCheckCircle
      case 'in_progress': return FaClock
      case 'pending': return FaHourglassHalf
      default: return FaClock
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          آخر الطلبات
        </h3>
        <Link
          to="/requests"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          عرض الكل
        </Link>
      </div>

      <div className="space-y-3">
        {requests.map((request) => {
          const StatusIcon = getStatusIcon(request.status)
          return (
            <div
              key={request.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-400 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  request.status === 'completed' ? 'bg-green-500' :
                  request.status === 'in_progress' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}></div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {request.service}
                  </h4>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span>رقم: {request.id}</span>
                    <span>•</span>
                    <span>{request.date}</span>
                    <span>•</span>
                    <span>{request.specialist}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 sm:mt-0">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                  <StatusIcon className="inline ml-1 text-xs" />
                  {request.status === 'completed' ? 'مكتمل' :
                   request.status === 'in_progress' ? 'قيد التنفيذ' :
                   'قيد المراجعة'}
                </span>
                <Link
                  to={`/requests/${request.id}`}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <FaEye />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RecentRequests