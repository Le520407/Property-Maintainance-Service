import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Layout Components
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';

// Page Components
import HomePage from './pages/HomePage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import CustomerRegisterPage from './pages/auth/CustomerRegisterPage.jsx';
import VendorRegisterPage from './pages/auth/VendorRegisterPage.jsx';
import AgentRegisterPage from './pages/auth/AgentRegisterPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import SimpleDashboard from './pages/dashboard/SimpleDashboard.jsx';
import ReferralDashboardPage from './pages/ReferralDashboardPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import ServiceDetailPage from './pages/ServiceDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ReferralPage from './pages/ReferralPage.jsx';
import VendorDashboardPage from './pages/vendor/VendorDashboardPage.jsx';
import SubscriptionPage from './pages/SubscriptionPage.jsx';
import BlogPage from './pages/BlogPage.jsx';
import BlogDetailPage from './pages/BlogDetailPage.jsx';
import FAQPage from './pages/FAQPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import AnnouncementManagement from './pages/admin/AnnouncementManagement.jsx';
import AnnouncementsPage from './pages/AnnouncementsPage.jsx';
import FAQManagement from './pages/admin/FAQManagement.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import OrderManagement from './pages/admin/OrderManagement.jsx';
import HomepageManagement from './pages/admin/HomepageManagement.jsx';
import OrderSubmissionPage from './pages/OrderSubmissionPage.jsx';
import UnifiedMessagesPage from './pages/UnifiedMessagesPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import JobDetailsPage from './pages/jobs/JobDetailsPage.jsx';
import ApiTest from './components/ApiTest.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

// Membership Components
import MembershipPlans from './components/customer/MembershipPlans.jsx';
import MembershipDashboard from './components/customer/MembershipDashboard.jsx';
import MembershipSuccess from './pages/MembershipSuccess.jsx';
import VendorMembership from './components/vendor/VendorMembership.jsx';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { MessagesProvider } from './contexts/MessagesContext';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MessagesProvider>
          <CartProvider>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Dashboard and Admin routes (full-page layout) */}
              <Route path="/dashboard/*" element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              } />
              <Route path="/admin/announcements" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-24">
                      <AnnouncementManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/homepage" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-24">
                      <HomepageManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/faqs" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-24">
                      <FAQManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-24">
                      <UserManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-24">
                      <OrderManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Main layout routes (with Header and Footer) */}
              <Route path="*" element={
                <div className="min-h-screen bg-gray-50">
                  <Header />
                  <main className="pt-16">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/services" element={<ServicesPage />} />
                      <Route path="/services/:id" element={<ServiceDetailPage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/:id" element={<ProductDetailPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogDetailPage />} />
                      <Route path="/announcements" element={<AnnouncementsPage />} />
                      <Route path="/faq" element={<FAQPage />} />
                      <Route path="/pricing" element={<PricingPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/customer-register" element={<CustomerRegisterPage />} />
                      <Route path="/vendor-register" element={<VendorRegisterPage />} />
                      <Route path="/agent-register" element={<AgentRegisterPage />} />
                      <Route path="/booking" element={<BookingPage />} />
                      <Route path="/order-request" element={
                        <ProtectedRoute>
                          <OrderSubmissionPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/messages" element={
                        <ProtectedRoute>
                          <UnifiedMessagesPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/payment/:jobId" element={
                        <ProtectedRoute requiredRole="customer">
                          <PaymentPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/jobs/:jobId" element={
                        <ProtectedRoute>
                          <JobDetailsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/referral" element={<ReferralPage />} />
                      <Route path="/referral-dashboard" element={
                        <ProtectedRoute>
                          <ReferralDashboardPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/vendor-dashboard" element={
                        <ProtectedRoute requiredRole="vendor">
                          <VendorDashboardPage />
                        </ProtectedRoute>
                      } />
                      
                      {/* Membership Routes */}
                      <Route path="/membership/plans" element={
                        <ProtectedRoute requiredRole="customer">
                          <MembershipPlans />
                        </ProtectedRoute>
                      } />
                      <Route path="/membership/dashboard" element={
                        <ProtectedRoute requiredRole="customer">
                          <MembershipDashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/membership/success" element={
                        <ProtectedRoute requiredRole="customer">
                          <MembershipSuccess />
                        </ProtectedRoute>
                      } />
                      
                      {/* Vendor Membership Routes */}
                      <Route path="/vendor/membership" element={
                        <ProtectedRoute requiredRole="vendor">
                          <VendorMembership />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/subscription" element={<SubscriptionPage />} />
                      <Route path="/api-test" element={<ApiTest />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              } />
            </Routes>
          </AnimatePresence>
          </CartProvider>
        </MessagesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

// Dashboard redirect component to route users based on their role
const DashboardRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect referral agents to specialized dashboard
  if (user.role === 'referral') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ReferralDashboardPage />
      </div>
    );
  }

  // Default dashboard for customers, vendors, and other roles
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SimpleDashboard />
    </div>
  );
};

export default App; 