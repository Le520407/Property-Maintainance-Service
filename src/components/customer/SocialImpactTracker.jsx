import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart,
  Users,
  Gift,
  TrendingUp,
  Award,
  Target,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const SocialImpactTracker = ({ subscription }) => {
  const [impactStats, setImpactStats] = useState(null);

  useEffect(() => {
    if (subscription?.socialImpactContribution) {
      setImpactStats(subscription.socialImpactContribution);
    }
  }, [subscription]);

  if (!impactStats) {
    return (
      <div className="text-center py-8">
        <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No social impact data available</p>
      </div>
    );
  }

  const {
    paidServicesCount,
    freeServicesEarned,
    freeServicesUsed,
    totalContribution
  } = impactStats;

  const availableFreeServices = freeServicesEarned - freeServicesUsed;
  const progressToNextFree = paidServicesCount % 10;
  const nextFreeServiceAt = 10 - progressToNextFree;
  const progressPercentage = (progressToNextFree / 10) * 100;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-8 text-white text-center"
      >
        <Heart className="h-16 w-16 mx-auto mb-4 animate-pulse" />
        <h2 className="text-3xl font-bold mb-2">Your Social Impact</h2>
        <p className="text-pink-100 text-lg">
          Thank you for making a difference in our community
        </p>
      </motion.div>

      {/* Impact Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6 text-center"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {paidServicesCount}
          </div>
          <div className="text-sm text-gray-600">Services Used</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6 text-center"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Gift className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {freeServicesEarned}
          </div>
          <div className="text-sm text-gray-600">Free Services Earned</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm p-6 text-center"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {freeServicesUsed}
          </div>
          <div className="text-sm text-gray-600">Families Helped</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm p-6 text-center"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            ${totalContribution?.toFixed(0) || '0'}
          </div>
          <div className="text-sm text-gray-600">Total Contribution</div>
        </motion.div>
      </div>

      {/* Progress to Next Free Service */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Progress to Next Free Service</h3>
          <div className="text-sm text-gray-600">
            {progressToNextFree}/10 services
          </div>
        </div>

        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full relative"
            >
              {progressPercentage > 0 && (
                <div className="absolute right-2 top-0 h-4 w-2 bg-white rounded-full opacity-70" />
              )}
            </motion.div>
          </div>
          
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-600">Current: {progressToNextFree}</span>
            <span className="font-medium text-green-600">
              {nextFreeServiceAt === 10 ? 'Ready!' : `${nextFreeServiceAt} more to go`}
            </span>
          </div>
        </div>

        {nextFreeServiceAt === 0 && availableFreeServices > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">
                You have {availableFreeServices} free service{availableFreeServices > 1 ? 's' : ''} available!
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Available Free Services */}
      {availableFreeServices > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Free Services</h3>
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <Gift className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <div className="text-3xl font-bold text-green-600 mb-2">
              {availableFreeServices}
            </div>
            <div className="text-gray-700 mb-4">
              You have {availableFreeServices} free service{availableFreeServices > 1 ? 's' : ''} ready to use!
            </div>
            <p className="text-sm text-gray-600 mb-6">
              These free services will be donated to families in need on your behalf when you use your subscription services.
            </p>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-sm text-gray-700">
                <strong>How it works:</strong> Every time you use a paid service, we automatically donate 
                your earned free services to families who need maintenance help but cannot afford it.
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Impact Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Impact Journey</h3>
        
        <div className="space-y-4">
          {/* Milestones */}
          {[
            { services: 10, milestone: 'First Impact', achieved: paidServicesCount >= 10, icon: Heart },
            { services: 25, milestone: 'Community Helper', achieved: paidServicesCount >= 25, icon: Users },
            { services: 50, milestone: 'Impact Champion', achieved: paidServicesCount >= 50, icon: Award },
            { services: 100, milestone: 'Social Impact Hero', achieved: paidServicesCount >= 100, icon: Target }
          ].map((milestone, index) => (
            <div 
              key={index} 
              className={`flex items-center p-4 rounded-lg border-2 ${
                milestone.achieved 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                milestone.achieved 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                <milestone.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className={`font-medium ${
                  milestone.achieved ? 'text-green-800' : 'text-gray-600'
                }`}>
                  {milestone.milestone}
                </div>
                <div className="text-sm text-gray-500">
                  {milestone.services} services milestone
                </div>
              </div>
              {milestone.achieved ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowRight className="h-5 w-5 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Thank You Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-8 text-center border border-purple-200"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Thank You for Making a Difference!
        </h3>
        <p className="text-gray-700 text-lg mb-4">
          Your subscription doesn't just maintain your property – it helps build a stronger, 
          more caring community for everyone.
        </p>
        <div className="text-sm text-gray-600">
          Together with other Swift Fix Pro subscribers, you're part of a movement that believes 
          everyone deserves access to quality home maintenance services.
        </div>
      </motion.div>
    </div>
  );
};

export default SocialImpactTracker;