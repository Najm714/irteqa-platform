// frontend/portal-a/src/pages/About.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// أيقونات
import {
  FaSpinner, FaInfoCircle, FaEye, FaUsers, FaChartBar,
  FaAward, FaQuoteRight, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaFacebook, FaTwitter, FaInstagram, FaYoutube,
  FaLinkedin, FaWhatsapp, FaClock, FaStar, FaStarHalf,
  FaBuilding, FaGlobe, FaFileAlt,
} from 'react-icons/fa';

// ============================================================
// ✅ المكون الرئيسي
// ============================================================

const About: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [about, setAbout] = useState<any>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  // ===== جلب البيانات =====
  const fetchAbout = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/about`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAbout(data.data);
      }
    } catch (error) {
      console.error('Error fetching about:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ===== تنسيق التاريخ =====
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ===== عرض التقييم بالنجوم =====
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="text-yellow-400 w-4 h-4" />);
      } else if (i - rating < 1) {
        stars.push(<FaStarHalf key={i} className="text-yellow-400 w-4 h-4" />);
      } else {
        stars.push(<FaStar key={i} className="text-gray-300 dark:text-gray-600 w-4 h-4" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل صفحة نبذة عنا...</p>
        </div>
      </div>
    );
  }

  if (!about || !about.isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <FaInfoCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">عذراً!</h2>
          <p className="text-gray-600 dark:text-gray-400">صفحة نبذة عنا غير متاحة حالياً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom max-w-7xl">
        {/* ===== Header ===== */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <FaInfoCircle className="text-purple-600" />
            نبذة عنا
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            تعرف على منصتنا وقيمنا ورؤيتنا
          </p>
        </div>

        {/* ===== Cover Image ===== */}
        {about.platformCover && (
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <img
              src={`${API_URL}/about/file/${typeof about.platformCover === 'object' ? about.platformCover._id : about.platformCover}?token=${localStorage.getItem('token')}`}
              alt={about.platformNameAr}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-8 text-white">
                <h2 className="text-3xl font-bold">{about.platformNameAr || about.platformName}</h2>
                <p className="text-white/80 mt-2 max-w-2xl">{about.platformDescriptionAr || about.platformDescription}</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== Platform Info ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-8" data-aos="fade-up">
          <div className="flex items-center gap-4 mb-4">
            {about.platformLogo && (
              <img
                src={`${API_URL}/about/file/${typeof about.platformLogo === 'object' ? about.platformLogo._id : about.platformLogo}?token=${localStorage.getItem('token')}`}
                alt="Logo"
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {about.platformNameAr || about.platformName}
              </h2>
              {about.foundedDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  تأسست في {formatDate(about.foundedDate)}
                </p>
              )}
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {about.platformDescriptionAr || about.platformDescription}
          </p>
        </div>

        {/* ===== Story, Vision, Mission ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* القصة */}
          {(about.storyAr || about.story) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" data-aos="fade-up" data-aos-delay="0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-2xl">📖</span> قصتنا
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {about.storyAr || about.story}
              </p>
            </div>
          )}

          {/* الرؤية */}
          {(about.visionAr || about.vision) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" data-aos="fade-up" data-aos-delay="100">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-2xl">🔭</span> رؤيتنا
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {about.visionAr || about.vision}
              </p>
            </div>
          )}

          {/* الرسالة */}
          {(about.missionAr || about.mission) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" data-aos="fade-up" data-aos-delay="200">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-2xl">🎯</span> رسالتنا
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {about.missionAr || about.mission}
              </p>
            </div>
          )}
        </div>

        {/* ===== Values ===== */}
        {about.values && about.values.length > 0 && (
          <div className="mb-8" data-aos="fade-up">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">💎 قيمنا الجوهرية</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {about.values.map((value: any, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                  <div className="text-4xl mb-2">{value.icon || '⭐'}</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{value.titleAr || value.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{value.descriptionAr || value.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Stats ===== */}
        {about.stats && about.stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" data-aos="fade-up">
            {about.stats.map((stat: any, index: number) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-4xl text-purple-600 mb-2">
                  {stat.icon === 'users' && <FaUsers className="mx-auto" />}
                  {stat.icon === 'chart-bar' && <FaChartBar className="mx-auto" />}
                  {stat.icon === 'award' && <FaAward className="mx-auto" />}
                  {stat.icon === 'building' && <FaBuilding className="mx-auto" />}
                  {stat.icon === 'globe' && <FaGlobe className="mx-auto" />}
                  {!stat.icon && <FaChartBar className="mx-auto" />}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.labelAr || stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ===== Team ===== */}
        {about.team && about.team.filter((m: any) => m.isActive !== false).length > 0 && (
          <div className="mb-8" data-aos="fade-up">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">👥 فريق العمل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {about.team.filter((m: any) => m.isActive !== false).map((member: any, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition">
                  {member.imageId ? (
                    <img
                      src={`${API_URL}/about/file/${typeof member.imageId === 'object' ? member.imageId._id : member.imageId}?token=${localStorage.getItem('token')}`}
                      alt={member.nameAr}
                      className="w-24 h-24 rounded-full mx-auto object-cover mb-4"
                      onError={(e) => {
                        e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.nameAr || member.name);
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4 text-3xl text-purple-600">
                      {(member.nameAr || member.name || '?').charAt(0)}
                    </div>
                  )}
                  <h4 className="font-bold text-gray-900 dark:text-white">{member.nameAr || member.name}</h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400">{member.positionAr || member.position}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{member.bioAr || member.bio}</p>
                  <div className="flex justify-center gap-3 mt-3">
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="text-gray-400 hover:text-purple-600 transition">
                        <FaEnvelope />
                      </a>
                    )}
                    {member.linkedin && (
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition">
                        <FaLinkedin />
                      </a>
                    )}
                    {member.twitter && (
                      <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition">
                        <FaTwitter />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Achievements ===== */}
        {about.achievements && about.achievements.filter((a: any) => a.isActive !== false).length > 0 && (
          <div className="mb-8" data-aos="fade-up">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">🏆 إنجازاتنا</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {about.achievements.filter((a: any) => a.isActive !== false).map((achievement: any, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex gap-4 hover:shadow-md transition">
                  {achievement.imageId && (
                    <img
                      src={`${API_URL}/about/file/${typeof achievement.imageId === 'object' ? achievement.imageId._id : achievement.imageId}?token=${localStorage.getItem('token')}`}
                      alt={achievement.titleAr}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{achievement.titleAr || achievement.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.descriptionAr || achievement.description}</p>
                    {achievement.date && (
                      <p className="text-xs text-gray-400 mt-1">📅 {formatDate(achievement.date)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Testimonials ===== */}
        {about.testimonials && about.testimonials.filter((t: any) => t.isActive !== false).length > 0 && (
          <div className="mb-8" data-aos="fade-up">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">💬 آراء عملائنا</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {about.testimonials.filter((t: any) => t.isActive !== false).map((testimonial: any, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                  <div className="flex items-center gap-4 mb-3">
                    {testimonial.imageId ? (
                      <img
                        src={`${API_URL}/about/file/${typeof testimonial.imageId === 'object' ? testimonial.imageId._id : testimonial.imageId}?token=${localStorage.getItem('token')}`}
                        alt={testimonial.nameAr}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(testimonial.nameAr || testimonial.name);
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xl text-purple-600">
                        {(testimonial.nameAr || testimonial.name || '?').charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.nameAr || testimonial.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.positionAr || testimonial.position}</p>
                    </div>
                  </div>
                  <div className="flex mb-2">{renderStars(testimonial.rating || 5)}</div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">"{testimonial.contentAr || testimonial.content}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Contact Info ===== */}
        {about.contactInfo && (about.contactInfo.email || about.contactInfo.phone || about.contactInfo.address) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700" data-aos="fade-up">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">📞 تواصل معنا</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {about.contactInfo.email && (
                <div className="text-center">
                  <FaEnvelope className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">البريد الإلكتروني</p>
                  <a href={`mailto:${about.contactInfo.email}`} className="text-gray-900 dark:text-white font-medium hover:text-purple-600 transition">
                    {about.contactInfo.email}
                  </a>
                </div>
              )}
              {about.contactInfo.phone && (
                <div className="text-center">
                  <FaPhone className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">رقم الهاتف</p>
                  <a href={`tel:${about.contactInfo.phone}`} className="text-gray-900 dark:text-white font-medium hover:text-purple-600 transition">
                    {about.contactInfo.phone}
                  </a>
                </div>
              )}
              {about.contactInfo.address && (
                <div className="text-center">
                  <FaMapMarkerAlt className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">العنوان</p>
                  <p className="text-gray-900 dark:text-white font-medium">{about.contactInfo.addressAr || about.contactInfo.address}</p>
                </div>
              )}
            </div>
            {about.contactInfo.workingHours && (
              <div className="text-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <FaClock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-sm text-gray-500 dark:text-gray-400">ساعات العمل</p>
                <p className="text-gray-900 dark:text-white font-medium">{about.contactInfo.workingHoursAr || about.contactInfo.workingHours}</p>
              </div>
            )}
          </div>
        )}

        {/* ===== Social Media ===== */}
        {about.contactInfo?.socialMedia && Object.values(about.contactInfo.socialMedia).some(v => v) && (
          <div className="flex justify-center gap-4 mt-8" data-aos="fade-up">
            {about.contactInfo.socialMedia.facebook && (
              <a href={about.contactInfo.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition">
                <FaFacebook className="w-6 h-6" />
              </a>
            )}
            {about.contactInfo.socialMedia.twitter && (
              <a href={about.contactInfo.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition">
                <FaTwitter className="w-6 h-6" />
              </a>
            )}
            {about.contactInfo.socialMedia.instagram && (
              <a href={about.contactInfo.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-pink-600 text-white flex items-center justify-center hover:bg-pink-700 transition">
                <FaInstagram className="w-6 h-6" />
              </a>
            )}
            {about.contactInfo.socialMedia.youtube && (
              <a href={about.contactInfo.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition">
                <FaYoutube className="w-6 h-6" />
              </a>
            )}
            {about.contactInfo.socialMedia.linkedin && (
              <a href={about.contactInfo.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 transition">
                <FaLinkedin className="w-6 h-6" />
              </a>
            )}
            {about.contactInfo.socialMedia.whatsapp && (
              <a href={about.contactInfo.socialMedia.whatsapp} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition">
                <FaWhatsapp className="w-6 h-6" />
              </a>
            )}
          </div>
        )}

        {/* ===== Profile File ===== */}
        {about.profileFileId && (
          <div className="text-center mt-8" data-aos="fade-up">
            <a
              href={`${API_URL}/about/file/${typeof about.profileFileId === 'object' ? about.profileFileId._id : about.profileFileId}?token=${localStorage.getItem('token')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <FaFileAlt className="w-4 h-4" />
              تحميل ملف التعريف (PDF)
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default About;