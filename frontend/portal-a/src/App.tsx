// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Pages
import Home from './pages/Home';
import Services from './pages/Services';
import AdminSections from './pages/AdminSections';
import Dashboard from './pages/Dashboard/CustomerDashboard';
import CustomerDashboard from './pages/Dashboard/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Explanations from './pages/Explanations';
import AdminExplanations from './pages/AdminExplanations';
import MaterialDetail from './pages/MaterialDetail';
import Business from './pages/Business';
import Login from './pages/Login';
import Register from './pages/Register';
import Reviews from './pages/Reviews';
import AdminServices from './pages/AdminServices';
import AdminVideos from './pages/AdminVideos';
import AdminUsers from './pages/AdminUsers';
import RequestService from './pages/RequestService';
import AdminPayments from './pages/AdminPayments';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminRequests from './pages/Admin/AdminRequests';
import AdminSettings from './pages/AdminSettings';
import AdminServiceDetails from './pages/AdminServiceDetails';
import AdminServiceForms from './pages/AdminServiceForms';
import ServiceDetails from './pages/ServiceDetails';
import CustomerRequests from './pages/Requests/CustomerRequests';
import SpecialistRequests from './pages/Requests/SpecialistRequests';
import RequestWorkspace from './pages/RequestWorkspace';
import ChangePassword from './pages/Dashboard/ChangePassword';
import AdminReports from './pages/AdminReports';
import AdminLibrary from './pages/Admin/AdminLibrary';
import Library from './pages/Library';
import Videos from './pages/Videos';
import AdminVideosLibrary from './pages/Admin/AdminVideos';
import VideosLibrary from './pages/Library';
import AdminInfographics from './pages/Admin/AdminInfographics';
import Infographics from './pages/Infographics';
import AdminOffers from './pages/Admin/AdminOffers';
import Offers from './pages/Offers';
import AdminAbout from './pages/Admin/AdminAbout';
import About from './pages/About';
import AcademicCharter from './pages/Policies/AcademicCharter';
import IntellectualProperty from './pages/Policies/IntellectualProperty';
import PrivacyPolicy from './pages/Policies/PrivacyPolicy';
import TermsOfService from './pages/Policies/TermsOfService';
import PaymentRefundPolicy from './pages/Policies/PaymentRefundPolicy';
import CookiePolicy from './pages/Policies/CookiePolicy';
import Notifications from './pages/Dashboard/Notifications';

// ✅ استيراد صفحات المختص
import SpecialistDashboard from './pages/Specialist/SpecialistDashboard';

// Layout
import MainLayout from './components/layout/MainLayout';

// Context
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext'; // ✅ إضافة SidebarProvider
import ProtectedRoute from './components/common/ProtectedRoute';

// Styles
import './index.css';

// ✅ مكون التوجيه التلقائي
const AutoRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    // إذا كان المستخدم مديراً
    if ((user.role === 'portal_admin' || user.role === 'super_admin') && 
        window.location.pathname !== '/admin-dashboard' &&
        !window.location.pathname.startsWith('/admin-')) {
      return <Navigate to="/admin-dashboard" replace />;
    }
    // إذا كان المستخدم مختصاً
    if (user.role === 'specialist' && 
        (window.location.pathname === '/admin-dashboard' || 
         window.location.pathname.startsWith('/admin-') ||
         window.location.pathname === '/dashboard')) {
      return <Navigate to="/specialist/dashboard" replace />;
    }
    // إذا كان المستخدم عميلاً
    if (user.role === 'customer' && 
        (window.location.pathname === '/admin-dashboard' || 
         window.location.pathname.startsWith('/admin-') ||
         window.location.pathname.startsWith('/specialist/'))) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
    });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider> {/* ✅ تغليف التطبيق بـ SidebarProvider */}
          <BrowserRouter>
            <AutoRedirect>
              <Routes>
                {/* ============================================================
                    ✅ Auth Routes (غير محمية)
                    ============================================================ */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ============================================================
                    ✅ Routes العامة (مع MainLayout)
                    ============================================================ */}
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="services" element={<Services />} />
                  <Route path="explanations" element={<Explanations />} />
                  <Route path="business" element={<Business />} />
                </Route>

                {/* ============================================================
                    ✅ Routes العميل - لوحة التحكم 
                    ============================================================ */}
                
                <Route path="/Library" element={
                  <ProtectedRoute allowedRoles={['customer', 'specialist', 'portal_admin', 'super_admin']}>
                    <Library />
                  </ProtectedRoute>
                } />

                <Route path="/Videos" element={
                  <ProtectedRoute allowedRoles={['customer', 'specialist', 'portal_admin', 'super_admin']}>
                    <Videos />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/requests" element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/subscriptions" element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                } />

              <Route path="/dashboard/payments" element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              } />

                <Route path="/dashboard/notifications" element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/addresses" element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                } />

                {/* ✅ صفحة الإشعارات - مسار منفصل */}
                <Route path="/dashboard/notifications" element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Notifications />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/profile" element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/settings" element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                } />

                {/* ============================================================
                    ✅ Routes المختص - لوحة التحكم
                    ============================================================ */}

                <Route path="/specialist/dashboard" element={
                  <ProtectedRoute allowedRoles={['specialist']}>
                    <SpecialistDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/specialist/requests" element={
                  <ProtectedRoute allowedRoles={['specialist']}>
                    <SpecialistDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/specialist/tasks" element={
                  <ProtectedRoute allowedRoles={['specialist']}>
                    <SpecialistDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/specialist/calls" element={
                  <ProtectedRoute allowedRoles={['specialist']}>
                    <SpecialistDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/specialist/messages" element={
                  <ProtectedRoute allowedRoles={['specialist']}>
                    <SpecialistDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/specialist/files" element={
                  <ProtectedRoute allowedRoles={['specialist']}>
                    <SpecialistDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/specialist/profile" element={
                  <ProtectedRoute allowedRoles={['specialist']}>
                    <SpecialistDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/specialist/settings" element={
                  <ProtectedRoute allowedRoles={['specialist']}>
                    <SpecialistDashboard />
                  </ProtectedRoute>
                } />

                {/* ============================================================
                    ✅ Routes الطلبات
                    ============================================================ */}

                <Route path="/my-requests" element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerRequests />
                  </ProtectedRoute>
                } />

                <Route path="/specialist-requests" element={
                  <ProtectedRoute allowedRoles={['specialist']}>
                    <SpecialistRequests />
                  </ProtectedRoute>
                } />

                <Route path="/admin-requests" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminRequests />
                  </ProtectedRoute>
                } />

                <Route path="/request/:id" element={
                  <ProtectedRoute allowedRoles={['customer', 'specialist', 'portal_admin', 'super_admin']}>
                    <RequestWorkspace />
                  </ProtectedRoute>
                } />

                {/* ============================================================
                    ✅ Routes الخدمات
                    ============================================================ */}

                <Route path="/request-service/:id" element={
                  <ProtectedRoute allowedRoles={['customer', 'specialist', 'portal_admin', 'super_admin']}>
                    <RequestService />
                  </ProtectedRoute>
                } />

                <Route path="/service/:id" element={
                  <ProtectedRoute allowedRoles={['customer', 'specialist', 'portal_admin', 'super_admin']}>
                    <ServiceDetails />
                  </ProtectedRoute>
                } />

                <Route path="/material-detail/:id" element={
                  <ProtectedRoute allowedRoles={['customer', 'specialist', 'portal_admin', 'super_admin']}>
                    <MaterialDetail />
                  </ProtectedRoute>
                } />

                {/* ============================================================
                    ✅ Routes المشتركة
                    ============================================================ */}

                <Route path="/reviews" element={
                  <ProtectedRoute allowedRoles={['customer', 'specialist', 'portal_admin', 'super_admin']}>
                    <Reviews />
                  </ProtectedRoute>
                } />

                <Route path="/change-password" element={
                  <ProtectedRoute allowedRoles={['customer', 'specialist', 'portal_admin', 'super_admin']}>
                    <ChangePassword />
                  </ProtectedRoute>
                } />

                {/* ============================================================
                    ✅ Routes الإدارية
                    ============================================================ */}

                <Route path="/admin-dashboard" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/admin-services" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminServices />
                  </ProtectedRoute>
                } />

                <Route path="/admin-sections" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminSections />
                  </ProtectedRoute>
                } />

                <Route path="/admin-explanations" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminExplanations />
                  </ProtectedRoute>
                } />

                <Route path="/admin-videos" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminVideos />
                  </ProtectedRoute>
                } />

                <Route path="/admin-users" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminUsers />
                  </ProtectedRoute>
                } />

                <Route path="/admin-videos-library" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminVideosLibrary />
                  </ProtectedRoute>
                } />

                <Route path="/videos-library" element={
                  <ProtectedRoute allowedRoles={['customer', 'specialist', 'portal_admin', 'super_admin']}>
                    <VideosLibrary />
                  </ProtectedRoute>
                } />

                <Route path="/admin-offers" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminOffers />
                  </ProtectedRoute>
                } />

                <Route path="/offers" element={
                  <ProtectedRoute allowedRoles={['customer', 'specialist', 'portal_admin', 'super_admin']}>
                    <Offers />
                  </ProtectedRoute>
                } />

                <Route path="/admin-payments" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminPayments />
                  </ProtectedRoute>
                } />

                <Route path="/admin-subscriptions" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminSubscriptions />
                  </ProtectedRoute>
                } />

                <Route path="/admin-reports" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminReports />
                  </ProtectedRoute>
                } />

                <Route path="/admin-service-details" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminServiceDetails />
                  </ProtectedRoute>
                } />

                <Route path="/admin-service-forms" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminServiceForms />
                  </ProtectedRoute>
                } />

                <Route path="/admin-settings" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminSettings />
                  </ProtectedRoute>
                } />

                <Route path="/admin-library" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminLibrary />
                  </ProtectedRoute>
                } />

                <Route path="/admin-infographics" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminInfographics />
                  </ProtectedRoute>
                } />

                <Route path="/infographics" element={
                  <ProtectedRoute allowedRoles={['customer', 'specialist', 'portal_admin', 'super_admin']}>
                    <Infographics />
                  </ProtectedRoute>
                } />

                <Route path="/admin-about" element={
                  <ProtectedRoute allowedRoles={['portal_admin', 'super_admin']}>
                    <AdminAbout />
                  </ProtectedRoute>
                } />

                <Route path="/about" element={
                  <ProtectedRoute allowedRoles={['customer', 'specialist', 'portal_admin', 'super_admin']}>
                    <About />
                  </ProtectedRoute>
                } />

                <Route path="/policies/academic-charter" element={
                  <ProtectedRoute>
                    <AcademicCharter />
                  </ProtectedRoute>
                } />

                <Route path="/policies/intellectual-property" element={
                  <ProtectedRoute>
                    <IntellectualProperty />
                  </ProtectedRoute>
                } />

                <Route path="/policies/privacy" element={
                  <ProtectedRoute>
                    <PrivacyPolicy />
                  </ProtectedRoute>
                } />

                <Route path="/policies/terms" element={
                  <ProtectedRoute>
                    <TermsOfService />
                  </ProtectedRoute>
                } />

                <Route path="/policies/payment-refund" element={
                  <ProtectedRoute>
                    <PaymentRefundPolicy />
                  </ProtectedRoute>
                } />

                <Route path="/policies/cookies" element={
                  <ProtectedRoute>
                    <CookiePolicy />
                  </ProtectedRoute>
                } />

                {/* ============================================================
                    ✅ 404 - Not Found
                    ============================================================ */}
                <Route path="*" element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">الصفحة غير موجودة</p>
                      <a href="/" className="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        العودة للرئيسية
                      </a>
                    </div>
                  </div>
                } />
              </Routes>
            </AutoRedirect>
          </BrowserRouter>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;