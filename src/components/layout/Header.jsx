import { Menu, MessageCircle, User, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { cachedApi } from '../../utils/globalCache';
import { useAuth } from '../../contexts/AuthContext';
// import { useCart } from '../../contexts/CartContext'; // Hidden temporarily - cart disabled
import { useLanguage } from '../../contexts/LanguageContext';

// Global function to clear messages visited flag (can be called from anywhere)
export const clearMessagesVisitedFlag = (userId) => {
  if (userId) {
    localStorage.removeItem(`header-messages-visited-${userId}`);
  }
};

const Header = () => {
  const { user, logout } = useAuth();
  // const { cartItems } = useCart(); // Hidden temporarily - cart disabled
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
    { name: 'Events', href: '/events' },
    { name: 'Membership', href: user?.role === 'customer' ? '/membership/plans' : user?.role === 'vendor' ? '/vendor/membership' : '/membership/plans' },
    { name: 'FAQ', href: '/faq' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
  ];

  // Admin navigation items (only show for admin users)
  const adminNavigation = user?.role === 'admin' ? [
    { name: 'Admin Panel', href: '/dashboard', isDropdown: true, items: [
      { name: 'Homepage Management', href: '/admin/homepage' },
      { name: 'Order Management', href: '/admin/orders' },
      { name: 'User Management', href: '/admin/users' },
      { name: 'Event Management', href: '/admin/events' },
      { name: 'CEA Verification', href: '/admin/cea-verification' },
      // { name: 'Announcement Management', href: '/admin/announcements' }, // Hidden temporarily
      { name: 'FAQ Management', href: '/admin/faqs' },
    ]}
  ] : [];

  // Cache for API responses
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [cachedUnreadCount, setCachedUnreadCount] = useState(0);
  const CACHE_DURATION = 300000; // 5 minute cache to reduce API calls
  
  // Fetch unread messages count with caching
  const fetchUnreadCount = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Check if user has visited messages page - if so, don't bother fetching
    const hasVisitedMessages = localStorage.getItem(`header-messages-visited-${user.id}`) === 'true';
    
    if (hasVisitedMessages && !forceRefresh) {
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
      // Use cached API call to prevent excessive requests
      const response = await cachedApi.getConversations(user.id, user.role, forceRefresh);
      
      const conversations = response.conversations || [];
      const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      
      // Update cache
      setCachedUnreadCount(totalUnread);
      setLastFetchTime(now);
      setUnreadCount(totalUnread);
      
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        if (cachedUnreadCount !== null) {
          setUnreadCount(cachedUnreadCount);
        }
        return;
      }
      
      // Use cached data on error if available
      if (cachedUnreadCount > 0) {
        setUnreadCount(cachedUnreadCount);
      }
    }
  }, [user, lastFetchTime, cachedUnreadCount]);

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

    // Clear visited flag on mount to ensure we fetch unread count
    clearMessagesVisitedFlag(user.id);
    fetchUnreadCount(true); // Force refresh on mount

    // Increased frequency: every 5 minutes instead of 2 minutes to reduce server load
    const interval = setInterval(() => {
      // Only fetch if page is visible to reduce server load
      if (!document.hidden) {
        fetchUnreadCount();
      }
    }, 300000); // 5 minutes

    // Listen for page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, fetch fresh data with debounce
        setTimeout(() => {
          fetchUnreadCount(true); // Force refresh after short delay
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchUnreadCount]);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Swift Fix Pro"
              className="h-20 w-auto border-0"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Regular Navigation */}
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-lg font-medium text-gray-700 hover:text-orange-600 transition-colors ${
                  location.pathname === item.href ? 'text-orange-600 font-semibold' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Admin Navigation Dropdown */}
            {adminNavigation.map((item) => (
              <div key={item.name} className="relative group">
                <button className="flex items-center text-lg font-medium text-gray-700 hover:text-orange-600 transition-colors">
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

            {/* Cart - Hidden temporarily */}
            {/* <Link to="/cart" className="relative flex items-center text-gray-700 hover:text-orange-600">
              <ShoppingCart className="w-6 h-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link> */}

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
                            {(user.role === 'vendor' || user.role === 'technician') ? 'Membership' : user.role === 'admin' ? 'Access Level' : 'Account'}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {(user.role === 'vendor' || user.role === 'technician') ? 'Professional Plan' : 
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
                      {(user.role === 'vendor' || user.role === 'technician') && user.status === 'ACTIVE' && (
                        <p className="text-xs text-gray-500 mt-1">Next billing: Feb 15, 2025</p>
                      )}
                      {user.status === 'PENDING' && (
                        <p className="text-xs text-yellow-600 mt-1">Account pending approval</p>
                      )}
                    </div>
                    
                    <Link
                      to={(user.role === 'vendor' || user.role === 'technician') ? '/vendor-dashboard' : '/dashboard'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                      }}
                    >
                      {t('dashboard')} {(user.role === 'vendor' || user.role === 'technician') && '(Vendor)'} {user.role === 'referral' && '(Agent)'}
                    </Link>
                    
                    {/* Customer-specific menu items */}
                    {user.role === 'customer' && (
                      <>
                        <Link
                          to="/membership/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Manage Subscription
                        </Link>
                      </>
                    )}
                    
                    {user.role === 'customer' && (
                      <>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                          }}
                        >
                          {t('profile')}
                        </Link>
                        <Link
                          to="/referral"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                          }}
                        >
                          Referrals
                        </Link>
                      </>
                    )}
                    
                    {user.role !== 'vendor' && user.role !== 'customer' && (
                      <>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                          }}
                        >
                          {t('profile')}
                        </Link>
                        <Link
                          to={user.role === 'referral' ? '/referral-dashboard' : '/referral'}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          {user.role === 'referral' ? 'Referral Dashboard' : 'Referrals'}
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
                
                {/* Register Button */}
                <Link
                  to="/register-selection"
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
                  className={`text-lg font-medium text-gray-700 hover:text-orange-600 transition-colors ${
                    location.pathname === item.href ? 'text-orange-600 font-semibold' : ''
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
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>
                  
                  {/* Mobile Register Button */}
                  <Link
                    to="/register-selection"
                    className="block bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
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