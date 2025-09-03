import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShoppingCart, User, Menu, X, Gift, MessageCircle } from 'lucide-react';
import { api } from '../../services/api';

// Global function to clear messages visited flag (can be called from anywhere)
export const clearMessagesVisitedFlag = (userId) => {
  if (userId) {
    localStorage.removeItem(`header-messages-visited-${userId}`);
  }
};

const Header = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const location = useLocation();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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
    // { name: 'Announcements', href: '/announcements' }, // Hidden temporarily
    { name: 'FAQ', href: '/faq' },
    { name: t('about'), href: '/about' },
    { name: t('contact'), href: '/contact' },
  ];

  // Customer-specific navigation items (only show for customers)
  const customerNavigation = user?.role === 'customer' ? [
    { name: 'Membership', href: '/membership/plans', badge: 'Premium' }
  ] : [];

  // Admin navigation items (only show for admin users)
  const adminNavigation = user?.role === 'admin' ? [
    { name: 'Admin Panel', href: '/dashboard', isDropdown: true, items: [
      { name: 'Homepage Management', href: '/admin/homepage' },
      { name: 'Order Management', href: '/admin/orders' },
      { name: 'User Management', href: '/admin/users' },
      // { name: 'Announcement Management', href: '/admin/announcements' }, // Hidden temporarily
      { name: 'FAQ Management', href: '/admin/faqs' },
    ]}
  ] : [];

  // Cache for API responses
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [cachedUnreadCount, setCachedUnreadCount] = useState(0);
  const CACHE_DURATION = 60000; // 1 minute cache
  
  // Fetch unread messages count with caching
  const fetchUnreadCount = async (forceRefresh = false) => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    console.log('🔍 Header fetchUnreadCount - User:', user.role, 'ID:', user.id);

    // Check if user has visited messages page - if so, don't bother fetching
    const hasVisitedMessages = localStorage.getItem(`header-messages-visited-${user.id}`) === 'true';
    console.log('📍 Has visited messages flag:', hasVisitedMessages);
    
    if (hasVisitedMessages && !forceRefresh) {
      console.log('⚠️ Skip fetch - user has visited messages page');
      setUnreadCount(0);
      return;
    }

    // Use cached data if available and not expired
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTime < CACHE_DURATION)) {
      setUnreadCount(cachedUnreadCount);
      return;
    }

    try {
      console.log('📡 Fetching unread count from API...');
      let response;
      if (user.role === 'admin') {
        response = await api.get('/messages/support/conversations');
        console.log('👑 Admin response:', response);
      } else {
        response = await api.messages.getConversations();
        console.log('👤 User response:', response);
      }
      
      const conversations = response.conversations || [];
      const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      
      console.log('💬 Conversations:', conversations.length, 'Total unread:', totalUnread);
      console.log('🔢 Individual unread counts:', conversations.map(c => ({ name: c.customer?.firstName || c.vendor?.firstName, unread: c.unreadCount })));
      
      // Update cache
      setCachedUnreadCount(totalUnread);
      setLastFetchTime(now);
      setUnreadCount(totalUnread);
      
      console.log('✅ Header unread count set to:', totalUnread);
      
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      // Use cached data on error if available
      if (cachedUnreadCount > 0) {
        setUnreadCount(cachedUnreadCount);
      }
    }
  };

  // Mark messages as visited when clicking the messages link
  const handleMessagesClick = () => {
    if (user) {
      localStorage.setItem(`header-messages-visited-${user.id}`, 'true');
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Fetch unread count on mount and periodically (only when page is visible)
  useEffect(() => {
    if (!user) return;

    console.log('🚀 Header mounted for user:', user.role, 'ID:', user.id);
    // Clear visited flag on mount to ensure we fetch unread count
    clearMessagesVisitedFlag(user.id);
    fetchUnreadCount(true); // Force refresh on mount

    // Reduced frequency: every 2 minutes instead of 30 seconds
    const interval = setInterval(() => {
      // Only fetch if page is visible to reduce server load
      if (!document.hidden) {
        fetchUnreadCount();
      }
    }, 120000); // 2 minutes

    // Listen for page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, fetch fresh data
        fetchUnreadCount(true); // Force refresh
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

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
              className="h-16 w-auto"
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
            
            {/* Customer Navigation */}
            {customerNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`relative inline-flex items-center text-gray-700 hover:text-orange-600 transition-colors pr-12 ${
                  location.pathname.startsWith('/membership') ? 'text-orange-600 font-medium' : ''
                }`}
              >
                {item.name}
                {item.badge && (
                  <span className="absolute -top-4 right-4 bg-orange-100 text-orange-800 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {item.badge}
                  </span>
                )}
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
            
            {/* Messages - Show for all logged in users */}
            {user && (
              <Link
                to="/messages"
                onClick={handleMessagesClick}
                className="relative flex items-center text-gray-700 hover:text-orange-600"
                title={user.role === 'admin' ? 'Support Messages' : 'Messages'}
              >
                <MessageCircle className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
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
                    
                    {/* Customer-specific menu items */}
                    {user.role === 'customer' && (
                      <Link
                        to="/membership/plans"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        👑 Membership Plans
                      </Link>
                    )}
                    
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
              
              {/* Customer Navigation - Mobile */}
              {customerNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between text-gray-700 hover:text-orange-600 transition-colors ${
                    location.pathname.startsWith('/membership') ? 'text-orange-600 font-medium' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                  {item.badge && (
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
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