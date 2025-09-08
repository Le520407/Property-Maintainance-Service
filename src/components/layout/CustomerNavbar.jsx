import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Clock,
  User,
  Menu,
  X,
  Crown,
  LogOut,
  Bell
} from 'lucide-react';
import { api } from '../../services/api';

const CustomerNavbar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [membership, setMembership] = useState(null);
  const [notifications] = useState(0);
  const location = useLocation();

  useEffect(() => {
    fetchMembershipStatus();
  }, []);

  const fetchMembershipStatus = async () => {
    try {
      const response = await api.get('/users/membership');
      setMembership(response.membership);
    } catch (error) {
      console.error('Failed to fetch membership:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Book Service', href: '/jobs/create', icon: Calendar },
    { name: 'My Jobs', href: '/jobs', icon: Clock },
    { name: 'Membership', href: '/membership/dashboard', icon: Crown, badge: !membership ? 'New' : null },
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const getMembershipBadge = () => {
    if (!membership) return null;
    
    const colors = {
      BASIC: 'bg-gray-100 text-gray-800',
      PREMIUM: 'bg-purple-100 text-purple-800',
      ELITE: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${
        colors[membership.tier.name] || 'bg-gray-100 text-gray-800'
      }`}>
        {membership.tier.displayName}
      </span>
    );
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-orange-600">
                PropertyFix
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                      isActive(item.href)
                        ? 'border-orange-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                    {item.badge && (
                      <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {item.name === 'Membership' && getMembershipBadge()}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - User menu */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            {/* Membership CTA for non-members */}
            {!membership && (
              <Link
                to="/membership/plans"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                Upgrade to Premium
              </Link>
            )}

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-500">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-400 text-xs text-white text-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="relative group">
              <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'Customer'}
                  </p>
                  {membership && (
                    <p className="text-xs text-gray-500">
                      {membership.tier.displayName} Member
                    </p>
                  )}
                </div>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
                <div className="py-1">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-4 w-4 mr-3" />
                    My Profile
                  </Link>
                  <Link
                    to="/membership"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Crown className="h-4 w-4 mr-3" />
                    Membership
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={onLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-gray-500 p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-3 py-2 text-base font-medium ${
                    isActive(item.href)
                      ? 'text-orange-700 bg-orange-50 border-r-4 border-orange-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            
            {!membership && (
              <Link
                to="/membership/plans"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-base font-medium text-white bg-orange-600 hover:bg-orange-700"
              >
                Upgrade to Premium
              </Link>
            )}
          </div>
          
          {/* Mobile user info */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user?.name || 'Customer'}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {user?.email}
                </div>
                {membership && (
                  <div className="text-xs text-gray-400">
                    {membership.tier.displayName} Member
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                My Profile
              </Link>
              <Link
                to="/membership"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Membership
              </Link>
              <button
                onClick={onLogout}
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full text-left"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default CustomerNavbar;