// frontend/portal-a/src/pages/Specialist/SpecialistTasks.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaTasks, FaCheckCircle, FaClock, FaEye, FaTimesCircle, FaFilter, FaSearch } from 'react-icons/fa';

interface Task {
  _id: string;
  title: string;
  description: string;
  requestId: string;
  requestNumber: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string;
  assignedAt: string;
}

const SpecialistTasks: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const url = filter === 'all' 
          ? `${API_URL}/tasks/specialist` 
          : `${API_URL}/tasks/specialist?status=${filter}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });
        const data = await response.json();
        if (data.success) {
          setTasks(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [token, filter]);

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, { label: string; color: string }> = {
      'high': { label: 'عاجل', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      'medium': { label: 'متوسط', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'low': { label: 'منخفض', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    };
    return map[priority] || map.medium;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      'pending': { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'in_progress': { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      'completed': { label: 'مكتمل', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      'cancelled': { label: 'ملغي', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };
    return map[status] || map.pending;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaTasks className="text-purple-600" />
          المهام
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({tasks.length} مهمة)
          </span>
        </h3>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="بحث عن مهمة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          >
            <option value="all">جميع المهام</option>
            <option value="pending">قيد الانتظار</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="completed">مكتمل</option>
          </select>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            <FaFilter />
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const priority = getPriorityBadge(task.priority);
            const status = getStatusBadge(task.status);
            return (
              <div
                key={task._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/request/${task.requestId}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-900 dark:text-white">{task.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priority.color}`}>
                        {priority.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FaClock className="w-3 h-3" />
                        الطلب: #{task.requestNumber || 'غير معروف'}
                      </span>
                      <span>📅 {formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/request/${task.requestId}`); }}
                    className="p-2 bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg transition"
                  >
                    <FaEye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <FaTasks className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد مهام</h4>
          <p className="text-gray-500 dark:text-gray-400">ليس لديك أي مهام حالياً</p>
        </div>
      )}
    </div>
  );
};

export default SpecialistTasks;