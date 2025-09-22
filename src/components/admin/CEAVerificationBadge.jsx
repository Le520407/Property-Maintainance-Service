import { AlertTriangle, CheckCircle, Clock, ExternalLink, Shield, XCircle } from 'lucide-react';

import React from 'react';

const CEAVerificationBadge = ({ 
  status, 
  registrationNumber, 
  verificationDate, 
  expiryDate, 
  size = 'md',
  showDetails = false 
}) => {
  const getStatusConfig = (status) => {
    const configs = {
      'PENDING_MANUAL_VERIFICATION': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        text: 'Pending Verification',
        description: 'CEA registration awaiting manual verification'
      },
      'VERIFIED': {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        text: 'CEA Verified',
        description: 'CEA registration verified and active'
      },
      'FAILED': {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        text: 'Verification Failed',
        description: 'CEA registration could not be verified'
      },
      'EXPIRED': {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: AlertTriangle,
        text: 'CEA Expired',
        description: 'CEA registration has expired'
      },
      'SUSPENDED': {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        text: 'CEA Suspended',
        description: 'CEA registration is suspended'
      }
    };

    return configs[status] || configs['PENDING_MANUAL_VERIFICATION'];
  };

  const isExpiryNear = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry >= new Date();
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  if (!showDetails) {
    return (
      <span className={`inline-flex items-center rounded-full font-medium border ${config.color} ${sizeClasses[size]}`}>
        <IconComponent size={iconSizes[size]} className="mr-1" />
        {config.text}
      </span>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <Shield className="mr-2 text-blue-600" size={20} />
          <h4 className="text-sm font-medium text-gray-900">CEA Registration Status</h4>
        </div>
        <span className={`inline-flex items-center rounded-full font-medium border ${config.color} ${sizeClasses[size]}`}>
          <IconComponent size={iconSizes[size]} className="mr-1" />
          {config.text}
        </span>
      </div>
      
      {registrationNumber && (
        <div className="mb-2">
          <span className="text-xs text-gray-500">Registration Number:</span>
          <p className="font-mono text-sm text-gray-900">{registrationNumber}</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-3">
        {verificationDate && (
          <div>
            <span className="block">Verified:</span>
            <span className="text-gray-900">{new Date(verificationDate).toLocaleDateString()}</span>
          </div>
        )}
        {expiryDate && (
          <div>
            <span className="block">Expires:</span>
            <span className={`${isExpiryNear(expiryDate) ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
              {new Date(expiryDate).toLocaleDateString()}
              {isExpiryNear(expiryDate) && (
                <span className="block text-orange-500">Expires soon</span>
              )}
            </span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-600 mb-3">{config.description}</p>
      
      <a 
        href="https://eservices.cea.gov.sg/aceas/public-register/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
      >
        Verify on CEA Website <ExternalLink size={12} className="ml-1" />
      </a>
    </div>
  );
};

export default CEAVerificationBadge;