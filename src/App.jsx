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
import VendorRegisterPage from './pages/auth/VendorRegisterPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import ServiceDetailPage from './pages/ServiceDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ReferralPage from './pages/ReferralPage.jsx';
import ReferralDashboardPage from './pages/ReferralDashboardPage.jsx';
import SubscriptionPage from './pages/SubscriptionPage.jsx';
import BlogPage from './pages/BlogPage.jsx';
import BlogDetailPage from './pages/BlogDetailPage.jsx';
import FAQPage from './pages/FAQPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import BannerManagement from './pages/admin/BannerManagement.jsx';
import BlogManagement from './pages/admin/BlogManagement.jsx';
import FAQManagement from './pages/admin/FAQManagement.jsx';
import PricingManagement from './pages/admin/PricingManagement.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ApiTest from './components/ApiTest.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Dashboard and Admin routes (full-page layout) */}
              <Route path="/dashboard/*" element={
                <div className="min-h-screen bg-gray-50">
                  <Header />
                  <main className="pt-16">
                    <DashboardPage />
                  </main>
                </div>
              } />
              <Route path="/admin/banners" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-16">
                      <BannerManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/blogs" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-16">
                      <BlogManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/faqs" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-16">
                      <FAQManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/pricing" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-16">
                      <PricingManagement />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="pt-16">
                      <UserManagement />
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
                      <Route path="/faq" element={<FAQPage />} />
                      <Route path="/pricing" element={<PricingPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/vendor-register" element={<VendorRegisterPage />} />
                      <Route path="/booking" element={<BookingPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/referral" element={<ReferralPage />} />
                      <Route path="/referral-dashboard" element={
                        <ProtectedRoute>
                          <ReferralDashboardPage />
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
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App; 