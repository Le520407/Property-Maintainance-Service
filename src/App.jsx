import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Route, Routes } from 'react-router-dom';
import SessionManager from './components/auth/SessionManager';
import CookieConsent from './components/common/CookieConsent';
import { GoogleOAuthProvider } from '@react-oauth/google';

import AboutPage from './pages/AboutPage.jsx';
import AgentAgreementPage from './pages/legal/AgentAgreementPage.jsx';
import AgentRegisterPage from './pages/auth/AgentRegisterPage.jsx';
import { AnimatePresence } from 'framer-motion';
import AnnouncementManagement from './pages/admin/AnnouncementManagement.jsx';
import AnnouncementsPage from './pages/AnnouncementsPage.jsx';
import ApiTest from './components/ApiTest.jsx';
import BillingHistoryPage from './pages/customer/BillingHistoryPage.jsx';
import BlogDetailPage from './pages/BlogDetailPage.jsx';
import BlogPage from './pages/BlogPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import CEAVerificationManagement from './pages/admin/CEAVerificationManagement.jsx';
import CartPage from './pages/CartPage.jsx';
import { CartProvider } from './contexts/CartContext';
import CheckoutPage from './pages/CheckoutPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import EventDetailsPage from './pages/EventDetailsPage.jsx';
import EventManagement from './pages/admin/EventManagement.jsx';
import CompliancePage from './pages/legal/CompliancePage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';
import CustomerFeedback from './pages/customer/CustomerFeedback.jsx';
import CustomerRegisterPage from './pages/auth/CustomerRegisterPage.jsx';
import FAQManagement from './pages/admin/FAQManagement.jsx';
import FAQPage from './pages/FAQPage.jsx';
import Footer from './components/layout/Footer.jsx';
import Header from './components/layout/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import HomepageManagement from './pages/admin/HomepageManagement.jsx';
import JobDetailsPage from './pages/jobs/JobDetailsPage.jsx';
import { LanguageProvider } from './contexts/LanguageContext.js';
import LoginPage from './pages/auth/LoginPage.jsx';
import GoogleRegistrationPage from './pages/auth/GoogleRegistrationPage.jsx';
import MembershipDashboard from './components/customer/MembershipDashboard.jsx';
import MembershipPlans from './components/customer/MembershipPlans.jsx';
import MembershipSuccess from './pages/MembershipSuccess.jsx';
import { MessagesProvider } from './contexts/MessagesContext';
import NotFoundPage from './pages/NotFoundPage.jsx';
import OrderManagement from './pages/admin/OrderManagement.jsx';
import OrderSubmissionPage from './pages/OrderSubmissionPage.jsx';
import OrderSuccessPage from './pages/OrderSuccessPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import RateVendor from './pages/customer/RateVendor.jsx';
import React from 'react';
import ReferralDashboardPage from './pages/ReferralDashboardPage.jsx';
import ReferralPage from './pages/ReferralPage.jsx';
import RegisterSelectionPage from './pages/auth/RegisterSelectionPage.jsx';
import SLAPage from './pages/legal/SLAPage.jsx';
import ServiceDetailPage from './pages/ServiceDetailPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import SimpleDashboard from './pages/dashboard/SimpleDashboard.jsx';
import SubscriptionPage from './pages/SubscriptionPage.jsx';
import TermsPage from './pages/legal/TermsPage.jsx';
import UnifiedMessagesPage from './pages/UnifiedMessagesPage.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import VendorAgreementPage from './pages/legal/VendorAgreementPage.jsx';
import VendorDashboardPage from './pages/vendor/VendorDashboardPage.jsx';
import VendorMembership from './components/vendor/VendorMembership.jsx';
import VendorMembershipSuccessPage from './pages/VendorMembershipSuccessPage.jsx';
import VendorRegisterPage from './pages/auth/VendorRegisterPage.jsx';

// Auth Pages



// Legal Pages










// Customer Components




// Membership Components




























// Context





function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        <AuthProvider>
          <SessionManager />
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
                    <main className="pt-20">
                      <AnnouncementManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/homepage" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-20">
                      <HomepageManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/faqs" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-20">
                      <FAQManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-20">
                      <AdminDashboard />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-20">
                      <AdminDashboard />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-20">
                      <UserManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-20">
                      <OrderManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/cea-verification" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-24">
                      <CEAVerificationManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/events" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-24">
                      <EventManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Main layout routes (with Header and Footer) */}
              <Route path="*" element={
                <div className="min-h-screen bg-gray-50">
                  <Header />
                  <main className="pt-20">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/services" element={<ServicesPage />} />
                      <Route path="/services/:id" element={<ServiceDetailPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogDetailPage />} />
                      <Route path="/announcements" element={<AnnouncementsPage />} />
                      <Route path="/faq" element={<FAQPage />} />
                      <Route path="/pricing" element={<PricingPage />} />
                      <Route path="/events" element={<EventsPage />} />
                      <Route path="/events/:id" element={<EventDetailsPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      
                      {/* Legal Pages */}
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/privacy" element={<PrivacyPolicyPage />} />
                      <Route path="/sla" element={<SLAPage />} />
                      <Route path="/compliance" element={<CompliancePage />} />
                      <Route path="/vendor-agreement" element={<VendorAgreementPage />} />
                      <Route path="/agent-agreement" element={<AgentAgreementPage />} />
                      
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/google-registration" element={<GoogleRegistrationPage />} />
                      <Route path="/register-selection" element={<RegisterSelectionPage />} />
                      <Route path="/customer-register" element={<CustomerRegisterPage />} />
                      <Route path="/vendor-register" element={<VendorRegisterPage />} />
                      <Route path="/agent-register" element={<AgentRegisterPage />} />
                      {/* Legacy route redirects */}
                      <Route path="/register" element={<CustomerRegisterPage />} />
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
                      <Route path="/jobs" element={
                        <ProtectedRoute requiredRole="customer">
                          <CustomerFeedback />
                        </ProtectedRoute>
                      } />
                      <Route path="/jobs/:jobId" element={
                        <ProtectedRoute>
                          <JobDetailsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/orders" element={
                        <ProtectedRoute>
                          <OrdersPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/orders/:orderId/success" element={
                        <ProtectedRoute>
                          <OrderSuccessPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      } />
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
                      <Route path="/membership/success" element={<MembershipSuccess />} />
                      
                      {/* Vendor Membership Routes */}
                      <Route path="/vendor/membership" element={
                        <ProtectedRoute requiredRole="vendor">
                          <VendorMembership />
                        </ProtectedRoute>
                      } />
                      <Route path="/vendor/membership/success" element={
                        <ProtectedRoute requiredRole="vendor">
                          <VendorMembershipSuccessPage />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/subscription" element={<SubscriptionPage />} />
                      
                      {/* Customer Dashboard Route */}
                      <Route path="/customer/dashboard" element={
                        <ProtectedRoute requiredRole="customer">
                          <CustomerDashboard />
                        </ProtectedRoute>
                      } />
                      
                      {/* Customer Feedback Route */}
                      <Route path="/customer/feedback" element={
                        <ProtectedRoute requiredRole="customer">
                          <CustomerFeedback />
                        </ProtectedRoute>
                      } />
                      
                      {/* Legacy feedback route for backward compatibility */}
                      <Route path="/feedback" element={
                        <ProtectedRoute requiredRole="customer">
                          <CustomerFeedback />
                        </ProtectedRoute>
                      } />
                      
                      {/* Rate Vendor Route */}
                      <Route path="/rate-vendor/:jobId" element={
                        <ProtectedRoute requiredRole="customer">
                          <RateVendor />
                        </ProtectedRoute>
                      } />
                      
                      {/* Customer Subscription Management Routes */}
                      <Route path="/subscription/manage" element={
                        <ProtectedRoute requiredRole="customer">
                          <SubscriptionPage />
                        </ProtectedRoute>
                      } />
                      
                      {/* Customer Billing Routes */}
                      <Route path="/subscription/billing-history" element={
                        <ProtectedRoute requiredRole="customer">
                          <BillingHistoryPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/subscription/billing-history/:subscriptionId" element={
                        <ProtectedRoute requiredRole="customer">
                          <BillingHistoryPage />
                        </ProtectedRoute>
                      } />
                      
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
        <CookieConsent />
      </AuthProvider>
    </LanguageProvider>
    </GoogleOAuthProvider>
  );
}

// Dashboard redirect component to route users based on their role
const DashboardRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center pt-20">
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

  // Redirect customers to their specialized dashboard
  if (user.role === 'customer') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <CustomerDashboard />
      </div>
    );
  }

  // Default dashboard for vendors and other roles
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SimpleDashboard />
    </div>
  );
};

export default App; 