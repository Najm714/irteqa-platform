import React, { useState, useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { 
  FaBuilding, FaStar, FaUsers, FaGraduationCap, FaSearch, FaFilter,
  FaFileAlt, FaFile, FaSitemap, FaCheckDouble, FaBalanceScale,
  FaCalculator, FaChartBar, FaShieldAlt, FaFileInvoice, FaBook,
  FaTable, FaChartPie, FaBullhorn, FaCube, FaLightbulb,
  FaChartLine, FaFileSignature, FaChartBar as FaChartBar2, FaCog,
  FaMap, FaCogs, FaIndustry, FaWarehouse, FaRoute,
  FaPen, FaDesktop, FaClipboardCheck,
  FaArrowUp, FaCloudUploadAlt, FaPaperPlane,
  FaCircle, FaChevronDown, FaInfoCircle, FaQuestionCircle, FaTools,
  FaImages, FaClipboardList, FaTag, FaArrowRight, FaSpinner
} from 'react-icons/fa'

// Services data
import { businessServices } from '../data/businessServices'
// Components
import ServiceCard from '../components/services/ServiceCard'
import ServiceDetails from '../components/services/ServiceDetails'
import FilterButtons from '../components/services/FilterButtons'

const Business: React.FC = () => {
  const [filter, setFilter] = useState('all')
  const [selectedService, setSelectedService] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    AOS.refresh()
  }, [])

  const filteredServices = filter === 'all' 
    ? businessServices 
    : businessServices.filter(s => s.category === filter)

  const handleServiceClick = (service: any) => {
    setSelectedService(service)
    setShowDetails(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setShowDetails(false)
    setSelectedService(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getCount = (category: string) => {
    if (category === 'all') return businessServices.length
    return businessServices.filter(s => s.category === category).length
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#2D1B69] text-white py-12 md:py-16 overflow-hidden">
        <div className="container-custom relative z-10 text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 text-sm">
              <FaBuilding /> 30 خدمة
            </span>
            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 text-sm">
              <FaStar /> 7 تخصصات
            </span>
            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 text-sm">
              <FaUsers /> خبراء معتمدون
            </span>
            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 text-sm">
              <FaGraduationCap /> أكاديمي
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
            خدمات <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">الأعمال والاقتصاد</span>
          </h1>
          <p className="text-base md:text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
            خدمات أكاديمية واستشارية متخصصة في مجالات الإدارة، التسويق، المالية، المحاسبة، الاقتصاد،
            والموارد البشرية، بأيدي خبراء أكاديميين وممارسين محترفين.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <a href="#services-grid" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-1">
              <FaSearch /> استكشف الخدمات
            </a>
            <button 
              onClick={() => document.getElementById('filter-wrapper')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 bg-transparent border-2 border-white/30 text-white px-6 py-3 rounded-full font-bold hover:bg-white/10 transition-all hover:-translate-y-1"
            >
              <FaFilter /> تصفية
            </button>
          </div>
        </div>
      </section>

      {!showDetails ? (
        <>
          {/* Filter Section */}
          <section className="py-6 bg-gray-50 dark:bg-gray-900" id="filter-wrapper">
            <div className="container-custom">
              <FilterButtons 
                activeFilter={filter}
                onFilterChange={setFilter}
                counts={{
                  all: getCount('all'),
                  research: 0,
                  statistics: 0,
                  translation: 0,
                  editing: 0,
                  design: 0,
                  publication: 0,
                  references: 0,
                }}
                businessCounts={{
                  management: getCount('management'),
                  finance: getCount('finance'),
                  accounting: getCount('accounting'),
                  marketing: getCount('marketing'),
                  economics: getCount('economics'),
                  operations: getCount('operations'),
                  reports: getCount('reports'),
                }}
                type="business"
              />
            </div>
          </section>

          {/* Services Grid */}
          <section className="py-8 pb-16 bg-gray-50 dark:bg-gray-900" id="services-grid">
            <div className="container-custom">
              <div className="text-center mb-8" data-aos="fade-up">
                <h2 className="text-2xl md:text-3xl font-black">
                  جميع <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">خدمات الأعمال</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  اختر الخدمة المناسبة لاحتياجاتك الأكاديمية في مجالات الأعمال والاقتصاد
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredServices.map((service, index) => (
                  <ServiceCard 
                    key={service.id}
                    service={service}
                    index={index}
                    onClick={handleServiceClick}
                  />
                ))}
              </div>

              {filteredServices.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FaSearch className="text-4xl mx-auto mb-4" />
                  <p>لا توجد خدمات في هذا التصنيف</p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <ServiceDetails 
          service={selectedService}
          onBack={handleBack}
        />
      )}
    </div>
  )
}

export default Business