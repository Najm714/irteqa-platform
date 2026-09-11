import React, { useState, useEffect } from 'react'
import { 
  FaArrowRight, FaInfoCircle, FaQuestionCircle, FaUsers, FaTools, 
  FaLightbulb, FaImages, FaClipboardList, FaTag, FaChevronDown,
  FaPaperPlane, FaCloudUploadAlt, FaCircle, FaSpinner
} from 'react-icons/fa'

interface ServiceDetailsProps {
  service: any
  onBack: () => void
}

const ServiceDetails: React.FC<ServiceDetailsProps> = ({ service, onBack }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState<{ text: string; type: string } | null>(null)
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setSelectedFiles([...selectedFiles, ...Array.from(files)])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormMessage(null)

    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setFormMessage({ 
      text: '✅ تم إرسال طلب الخدمة بنجاح! سيتم التواصل معك قريباً.', 
      type: 'success' 
    })
    setIsSubmitting(false)
    
    setTimeout(() => {
      setFormMessage(null)
      setSelectedFiles([])
      const form = e.target as HTMLFormElement
      form.reset()
    }, 5001)
  }

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
    <div className="py-8 bg-gray-50 dark:bg-gray-900">
      <div className="container-custom">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 transition-all"
        >
          <FaArrowRight /> العودة إلى جميع الخدمات
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mt-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-3xl text-white flex-shrink-0">
              <i className={`fas ${iconClass}`}></i>
            </div>
            <div className="text-center md:text-right">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{service.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{service.enName}</p>
              <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <FaTag /> {service.categoryLabel}
              </span>
            </div>
          </div>

          <div className="py-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-3">
              <FaInfoCircle className="text-purple-600" /> نبذة الخدمة
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{service.description}</p>
          </div>

          <div className="py-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-3">
              <FaQuestionCircle className="text-purple-600" /> ما هي خدمة {service.name}؟
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{service.whatIs}</p>
          </div>

          <div className="py-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-3">
              <FaUsers className="text-purple-600" /> من يستفيد من هذه الخدمة؟
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {service.beneficiaries.map((b: string, i: number) => (
                <li key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-sm">
                  <FaCircle className="text-purple-600 text-xs" /> {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="py-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-3">
              <FaTools className="text-purple-600" /> المنهجيات والأساليب المستخدمة
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {service.methodologies.map((m: string, i: number) => (
                <li key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-sm">
                  <FaCircle className="text-purple-600 text-xs" /> {m}
                </li>
              ))}
            </ul>
          </div>

          <div className="py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border-r-4 border-purple-600">
              <FaLightbulb className="text-purple-600 text-xl flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 dark:text-gray-300 text-sm">{service.note}</p>
            </div>
          </div>

          <div className="py-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-3">
              <FaImages className="text-purple-600" /> معرض الخدمة
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {service.gallery.map((item: string, i: number) => (
                <div key={i} className="aspect-square rounded-xl flex items-center justify-center text-4xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform cursor-pointer">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="py-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-3">
              <FaClipboardList className="text-purple-600" /> أنواع الطلبات المتاحة
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {service.requestTypes.map((type: string, i: number) => (
                <div key={i} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium">
                  {type}
                </div>
              ))}
            </div>
          </div>

          <div className="py-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-3">
              <FaQuestionCircle className="text-purple-600" /> الأسئلة الشائعة
            </h3>
            <div className="space-y-2">
              {service.faq.map((item: any, index: number) => (
                <div 
                  key={index}
                  className={`rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden transition-all ${
                    openFaqs.includes(index) ? 'border-purple-400' : ''
                  }`}
                >
                  <button
                    className="w-full flex items-center justify-between p-4 text-right text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    onClick={() => toggleFaq(index)}
                  >
                    <span>{item.q}</span>
                    <FaChevronDown className={`transition-transform ${openFaqs.includes(index) ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all ${
                    openFaqs.includes(index) ? 'max-h-40 p-4 pt-0' : 'max-h-0'
                  }`}>
                    <p className="text-gray-600 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
                      {item.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="py-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-4">
              <FaPaperPlane className="text-purple-600" /> طلب الخدمة
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" placeholder="أدخل اسمك الكامل" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    البريد الإلكتروني <span className="text-red-500">*</span>
                  </label>
                  <input type="email" required className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" placeholder="example@email.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  رقم التواصل <span className="text-red-500">*</span>
                </label>
                <input type="tel" required className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" placeholder="+966 54 850 4018" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    نوع الطلب <span className="text-red-500">*</span>
                  </label>
                  <select required className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition">
                    <option value="">اختر نوع الطلب</option>
                    {service.requestTypes.map((type: string, i: number) => (
                      <option key={i} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    موعد التسليم <span className="text-red-500">*</span>
                  </label>
                  <input type="date" required className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  وصف الطلب <span className="text-red-500">*</span>
                </label>
                <textarea required rows={3} className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" placeholder="صف طلبك بالتفصيل..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الملفات المرفقة <span className="text-gray-400 text-xs">(اختياري)</span>
                  <span className="mr-2 text-sm font-bold text-purple-600">{selectedFiles.length}</span>
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all"
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <FaCloudUploadAlt className="text-4xl text-purple-600 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">اضغط لرفع الملفات</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">PDF, Word, Excel, PowerPoint, ZIP, صور</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">الحد الأقصى: 50MB لكل ملف</p>
                </div>
                <input id="fileInput" type="file" multiple className="hidden" onChange={handleFileUpload} />
                
                {selectedFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{file.name}</span>
                        <button type="button" className="text-red-500 hover:text-red-700 font-bold" onClick={() => removeFile(index)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border-2 border-gray-200 dark:border-gray-700">
                <input type="checkbox" required className="mt-1 w-4 h-4 accent-purple-600" />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="text-purple-600">أقر بأنني قرأت ووافقت على الشروط والأحكام</strong>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><FaSpinner className="animate-spin" /> جاري الإرسال...</>
                ) : (
                  <><FaPaperPlane /> إرسال الطلب</>
                )}
              </button>

              {formMessage && (
                <div className={`p-4 rounded-xl text-center font-semibold ${
                  formMessage.type === 'success' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-400'
                }`}>
                  {formMessage.text}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceDetails