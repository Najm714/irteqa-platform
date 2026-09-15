import React from 'react'
import { FaArrowLeft } from 'react-icons/fa'

interface ServiceCardProps {
  service: any
  index: number
  onClick: (service: any) => void
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, index, onClick }) => {
  const iconMap: { [key: string]: string } = {
    'FaHandshake': 'fa-handshake',
    'FaLightbulb': 'fa-lightbulb',
    'FaBook': 'fa-book',
    'FaFileAlt': 'fa-file-alt',
    'FaSearchPlus': 'fa-search-plus',
    'FaArchive': 'fa-archive',
    'FaCommentDots': 'fa-comment-dots',
    'FaFile': 'fa-file',
    'FaShieldAlt': 'fa-shield-alt',
    'FaComments': 'fa-comments',
    'FaProjectDiagram': 'fa-project-diagram',
    'FaGlobe': 'fa-globe',
    'FaClock': 'fa-clock',
    'FaLifeRing': 'fa-life-ring',
    'FaMoneyBillWave': 'fa-money-bill-wave',
    'FaChartBar': 'fa-chart-bar',
    'FaChartLine': 'fa-chart-line',
    'FaHeart': 'fa-heart',
    'FaComment': 'fa-comment',
    'FaDatabase': 'fa-database',
    'FaCubes': 'fa-cubes',
    'FaCalculator': 'fa-calculator',
    'FaLanguage': 'fa-language',
    'FaSpellCheck': 'fa-spell-check',
    'FaPen': 'fa-pen',
    'FaFeatherAlt': 'fa-feather-alt',
    'FaIdCard': 'fa-id-card',
    'FaBriefcase': 'fa-briefcase',
    'FaDesktop': 'fa-desktop',
    'FaPaintBrush': 'fa-paint-brush',
    'FaNewspaper': 'fa-newspaper',
    'FaSearchLocation': 'fa-search-location',
    'FaBookOpen': 'fa-book-open',
    'FaFont': 'fa-font',
  }

  const iconClass = iconMap[service.icon] || 'fa-star'

  return (
    <div 
      className="group relative bg-white dark:bg-gray-800 rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400"
      onClick={() => onClick(service)}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <span className="absolute top-2 left-2 text-xl opacity-30">{service.emoji}</span>
      
      <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl text-purple-600 dark:text-purple-400 mx-auto mb-3 group-hover:scale-110 group-hover:rotate-180 transition-all duration-300">
        <i className={`fas ${iconClass}`}></i>
      </div>
      
      <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{service.name}</h4>
      <span className="text-xs text-gray-500 dark:text-gray-400 block line-clamp-1">{service.enName}</span>
      <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
        {service.categoryLabel}
      </span>
      
      <span className="block mt-3 text-xs text-gray-400 dark:text-gray-500 group-hover:text-purple-500 transition-colors">
        <FaArrowLeft className="inline ml-1" /> اضغط للتفاصيل
      </span>
    </div>
  )
}

export default ServiceCard