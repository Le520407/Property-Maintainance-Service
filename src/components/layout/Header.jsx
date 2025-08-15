import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShoppingCart, User, Menu, X, Gift, MessageCircle } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const location = useLocation();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigation = [
    { name: t('home'), href: '/' },
    { name: t('services'), href: '/services' },
    { name: t('products'), href: '/products' },
    { name: 'Announcements', href: '/announcements' },
    { name: 'FAQ', href: '/faq' },
    { name: t('about'), href: '/about' },
    { name: t('contact'), href: '/contact' },
  ];

  // Admin navigation items (only show for admin users)
  const adminNavigation = user?.role === 'admin' ? [
    { name: 'Admin Panel', href: '/dashboard', isDropdown: true, items: [
      { name: 'Order Management', href: '/admin/orders' },
      { name: 'User Management', href: '/admin/users' },
      { name: 'Announcement Management', href: '/admin/announcements' },
      { name: 'FAQ Management', href: '/admin/faqs' },
    ]}
  ] : [];

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
      {/* Top Bar */}
      <div className="bg-orange-600 text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span>📞 +65 9123 4567</span>
            <span>📧 info@swiftfixpro.sg</span>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <span>🕒 Mon-Fri: 8AM-6PM</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Swift Fix Pro" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Regular Navigation */}
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-gray-700 hover:text-orange-600 transition-colors ${
                  location.pathname === item.href ? 'text-orange-600 font-medium' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Admin Navigation Dropdown */}
            {adminNavigation.map((item) => (
              <div key={item.name} className="relative group">
                <button className="flex items-center text-gray-700 hover:text-orange-600 transition-colors">
                  {item.name}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-[9999] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border border-gray-200">
                  {item.items.map((subItem) => (
                    <Link
                      key={subItem.name}
                      to={subItem.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            
            {/* Messages - Only show for logged in customers and vendors */}
            {user && (user.role === 'customer' || user.role === 'vendor') && (
              <Link
                to="/messages"
                className="relative flex items-center text-gray-700 hover:text-orange-600"
              >
                <MessageCircle className="w-6 h-6" />
                {/* You can add unread count badge here later */}
              </Link>
            )}
            
            {/* Cart */}
            <Link to="/cart" className="relative flex items-center text-gray-700 hover:text-orange-600">
              <ShoppingCart className="w-6 h-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-orange-600"
                >
                  <User className="w-5 h-5" />
                  <div className="hidden md:block">
                    <span className="block text-sm">{user.firstName || user.name}</span>
                    <span className="block text-xs text-gray-500 capitalize">{user.role}</span>
                  </div>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-[9999] border border-gray-200">
                    {/* Membership Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            {user.role === 'vendor' ? 'Membership' : user.role === 'admin' ? 'Access Level' : 'Account'}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {user.role === 'vendor' ? 'Professional Plan' : 
                             user.role === 'admin' ? 'Administrator' : 
                             'Standard Member'}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            user.status === 'ACTIVE' ? 'bg-green-400' : 'bg-yellow-400'
                          }`}></div>
                          <span className={`text-xs font-medium ${
                            user.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {user.status === 'ACTIVE' ? 'Active' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      {user.role === 'vendor' && user.status === 'ACTIVE' && (
                        <p className="text-xs text-gray-500 mt-1">Next billing: Feb 15, 2025</p>
                      )}
                      {user.status === 'PENDING' && (
                        <p className="text-xs text-yellow-600 mt-1">Account pending approval</p>
                      )}
                    </div>
                    
                    <Link
                      to={user.role === 'vendor' ? '/vendor-dashboard' : '/dashboard'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        console.log('Dashboard link clicked. User role:', user.role);
                        setIsUserMenuOpen(false);
                      }}
                    >
                      {t('dashboard')} {user.role === 'vendor' && '(Vendor)'}
                    </Link>
                    {user.role !== 'vendor' && (
                      <>
                        <Link
                          to="/dashboard?section=account&tab=profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            console.log('Profile link clicked for role:', user.role);
                            setIsUserMenuOpen(false);
                          }}
                        >
                          <User className="w-4 h-4 inline mr-2" />
                          {t('profile')}
                        </Link>
                        <Link
                          to="/dashboard?section=referrals&tab=overview"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Gift className="w-4 h-4 inline mr-2" />
                          Referrals
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-orange-600 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                >
                  {t('register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-700 hover:text-orange-600"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-gray-700 hover:text-orange-600 transition-colors ${
                    location.pathname === item.href ? 'text-orange-600 font-medium' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {!user && (
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-orange-600 transition-colors"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-center"
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 