import { CheckCircle, CreditCard, Lock, Shield } from 'lucide-react';

import React from 'react';
import { motion } from 'framer-motion';

const ComplianceBadges = ({ 
  showLabels = true, 
  size = 'medium', 
  variant = 'default',
  className = '' 
}) => {
  const badges = [
    {
      id: 'ssl',
      name: 'SSL Secured',
      icon: Lock,
      color: 'orange',
      verified: true
    },
    {
      id: 'iso27001',
      name: 'ISO 27001',
      icon: Shield,
      color: 'orange',
      verified: true
    },
    {
      id: 'pci-dss',
      name: 'PCI DSS',
      icon: CreditCard,
      color: 'orange',
      verified: true
    },
    {
      id: 'gdpr',
      name: 'GDPR Compliant',
      icon: Shield,
      color: 'orange',
      verified: true
    }
  ];

  const sizeClasses = {
    small: {
      container: 'w-8 h-8',
      icon: 16,
      text: 'text-xs'
    },
    medium: {
      container: 'w-12 h-12',
      icon: 20,
      text: 'text-sm'
    },
    large: {
      container: 'w-16 h-16',
      icon: 24,
      text: 'text-base'
    }
  };

  const currentSize = sizeClasses[size];

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {badges.map((badge) => {
          const IconComponent = badge.icon;
          return (
            <motion.div
              key={badge.id}
              className={`
                ${currentSize.container} 
                bg-${badge.color}-100 
                border border-${badge.color}-200 
                rounded-full 
                flex items-center justify-center
                hover:bg-${badge.color}-200 
                transition-colors
                cursor-help
              `}
              whileHover={{ scale: 1.1 }}
              title={`${badge.name} - Verified`}
            >
              <IconComponent 
                size={currentSize.icon} 
                className={`text-${badge.color}-600`} 
              />
              {badge.verified && (
                <CheckCircle 
                  size={8} 
                  className={`absolute -top-1 -right-1 text-${badge.color}-600 bg-white rounded-full`} 
                />
              )}
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {badges.map((badge, index) => {
        const IconComponent = badge.icon;
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              bg-${badge.color}-50 
              border border-${badge.color}-200 
              rounded-lg p-4 
              text-center 
              hover:shadow-md 
              transition-shadow
              relative
            `}
          >
            <div className="flex justify-center mb-2">
              <div className={`
                ${currentSize.container} 
                bg-${badge.color}-100 
                rounded-full 
                flex items-center justify-center
              `}>
                <IconComponent 
                  size={currentSize.icon} 
                  className={`text-${badge.color}-600`} 
                />
              </div>
            </div>
            
            {showLabels && (
              <div className="flex items-center justify-center">
                <span className={`
                  ${currentSize.text} 
                  font-medium 
                  text-${badge.color}-900
                `}>
                  {badge.name}
                </span>
                {badge.verified && (
                  <CheckCircle 
                    size={12} 
                    className={`ml-1 text-${badge.color}-600`} 
                  />
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default ComplianceBadges;
