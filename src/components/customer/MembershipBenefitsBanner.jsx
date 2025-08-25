import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Clock,
  Percent,
  Shield,
  Zap,
  X,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

const MembershipBenefitsBanner = ({ onJobCreate }) => {
  const [benefits, setBenefits] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    try {
      const [benefitsResponse, eligibilityResponse] = await Promise.all([
        api.get('/membership/benefits'),
        api.get('/membership/eligibility')
      ]);

      setBenefits(benefitsResponse.data.benefits);
      setEligibility(eligibilityResponse.data.eligibility);
    } catch (error) {
      console.error('Failed to fetch membership data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || dismissed) return null;

  // Non-member promotion banner
  if (!benefits) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg mb-6 relative"
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-orange-200 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Crown className="h-8 w-8 mr-3" />
            <div>
              <h3 className="font-semibold">Get Priority Service & Save Money!</h3>
              <p className="text-orange-100 text-sm">
                Join our membership program for faster response times and exclusive discounts
              </p>
            </div>
          </div>
          <Link
            to="/membership/plans"
            className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center"
          >
            View Plans
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </motion.div>
    );
  }

  // Member benefits display
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-orange-200 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-orange-100 mr-3">
            <Crown className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Your Membership Benefits Apply</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              {benefits.responseTimeHours && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-orange-500" />
                  {benefits.responseTimeHours}h response
                </div>
              )}
              
              {benefits.materialDiscountPercent > 0 && (
                <div className="flex items-center">
                  <Percent className="h-4 w-4 mr-1 text-green-500" />
                  {benefits.materialDiscountPercent}% discount
                </div>
              )}
              
              {benefits.emergencyServiceAllowed && (
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                  Emergency service
                </div>
              )}
              
              {benefits.prioritySupport && (
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-blue-500" />
                  Priority support
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Eligibility warning */}
        {!eligibility?.allowed && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-amber-800 text-sm font-medium">{eligibility?.reason}</p>
            <Link
              to="/membership/plans"
              className="text-amber-700 hover:text-amber-900 text-xs underline"
            >
              Upgrade your plan
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MembershipBenefitsBanner;