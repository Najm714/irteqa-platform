import React from 'react'
import { FaTh, FaFlask, FaChartBar, FaLanguage, FaPenFancy, FaPalette, FaNewspaper, FaBook } from 'react-icons/fa'

interface FilterButtonsProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  counts: {
    all: number
    research: number
    statistics: number
    translation: number
    editing: number
    design: number
    publication: number
    references: number
  }
  businessCounts?: {
    management: number
    finance: number
    accounting: number
    marketing: number
    economics: number
    operations: number
    reports: number
  }
  type?: 'academic' | 'business'
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ 
  activeFilter, 
  onFilterChange, 
  counts, 
  businessCounts,
  type = 'academic' 
}) => {
  // Academic filters
  const academicFilters = [
    { id: 'all', label: 'الكل', icon: FaTh, count: counts.all },
    { id: 'research', label: 'بحث علمي', icon: FaFlask, count: counts.research },
    { id: 'statistics', label: 'تحليل إحصائي', icon: FaChartBar, count: counts.statistics },
    { id: 'translation', label: 'ترجمة', icon: FaLanguage, count: counts.translation },
    { id: 'editing', label: 'تحرير', icon: FaPenFancy, count: counts.editing },
    { id: 'design', label: 'تصميم', icon: FaPalette, count: counts.design },
    { id: 'publication', label: 'نشر', icon: FaNewspaper, count: counts.publication },
    { id: 'references', label: 'مراجع', icon: FaBook, count: counts.references },
  ]

  // Business filters
  const businessFilters = [
    { id: 'all', label: 'الكل', icon: FaTh, count: counts.all },
    { id: 'management', label: 'إدارة', icon: FaBriefcase, count: businessCounts?.management || 0 },
    { id: 'finance', label: 'مالية', icon: FaCoins, count: businessCounts?.finance || 0 },
    { id: 'accounting', label: 'محاسبة', icon: FaBook, count: businessCounts?.accounting || 0 },
    { id: 'marketing', label: 'تسويق', icon: FaBullhorn, count: businessCounts?.marketing || 0 },
    { id: 'economics', label: 'اقتصاد', icon: FaGlobe, count: businessCounts?.economics || 0 },
    { id: 'operations', label: 'عمليات', icon: FaIndustry, count: businessCounts?.operations || 0 },
    { id: 'reports', label: 'تقارير', icon: FaFileAlt, count: businessCounts?.reports || 0 },
  ]

  const filters = type === 'business' ? businessFilters : academicFilters

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
            activeFilter === filter.id
              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400'
          }`}
          onClick={() => onFilterChange(filter.id)}
        >
          <filter.icon className="text-sm" />
          {filter.label}
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeFilter === filter.id
              ? 'bg-white/20 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}>
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  )
}

// Import missing icons
import { FaBriefcase, FaCoins, FaBullhorn, FaGlobe, FaIndustry, FaFileAlt } from 'react-icons/fa'

export default FilterButtons