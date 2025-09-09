import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, CreditCard, Settings, BarChart3 } from 'lucide-react';

const CustomerSubscriptionNav = () => {
  const location = useLocation();
  
  const navItems = [
    {
      name: 'Billing History',
      href: '/subscription/billing-history',
      icon: FileText,
      description: 'View payment history and invoices'
    },
    {
      name: 'Payment Methods',
      href: '/customer/payment-methods',
      icon: CreditCard,
      description: 'Manage payment methods'
    },
    {
      name: 'Subscription Settings',
      href: '/customer/subscription-settings',
      icon: Settings,
      description: 'Update plan and preferences'
    },
    {
      name: 'Usage Analytics',
      href: '/customer/analytics',
      icon: BarChart3,
      description: 'View usage statistics'
    }
  ];

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustomerSubscriptionNav;
