import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Building, 
  Building2, 
  Store,
  Check,
  CreditCard,
  Star
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import SubscriptionPaymentModal from './SubscriptionPaymentModal';

const SubscriptionPlans = ({ tiers, currentSubscription, onSubscriptionSuccess }) => {
  const [selectedTier, setSelectedTier] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const propertyIcons = {
    HDB: Home,
    CONDOMINIUM: Building,
    LANDED: Building2,
    COMMERCIAL: Store
  };

  const tierColors = {
    HDB: 'green',
    CONDOMINIUM: 'blue',
    LANDED: 'purple',
    COMMERCIAL: 'orange'
  };

  const handleSelectPlan = (tier) => {
    if (currentSubscription?.propertyType === tier.propertyType) {
      toast.info('You are already subscribed to this plan');
      return;
    }
    
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedTier(null);
    onSubscriptionSuccess();
  };

  const isCurrentPlan = (tierType) => {
    return currentSubscription?.propertyType === tierType;
  };

  const getRecommendedTier = () => {
    return tiers.find(tier => tier.propertyType === 'CONDOMINIUM');
  };

  const recommendedTier = getRecommendedTier();

  return (
    <>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Property Maintenance Plan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the plan that matches your property type for optimal maintenance service
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => {
            const IconComponent = propertyIcons[tier.propertyType] || Home;
            const color = tierColors[tier.propertyType] || 'gray';
            const isRecommended = tier.propertyType === recommendedTier?.propertyType;
            const isCurrent = isCurrentPlan(tier.propertyType);

            return (
              <motion.div
                key={tier._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className={`relative bg-white rounded-lg shadow-lg overflow-hidden border-2 ${
                  isCurrent 
                    ? `border-${color}-500` 
                    : isRecommended 
                    ? 'border-orange-300' 
                    : 'border-gray-200'
                } ${isRecommended ? 'transform scale-105' : ''}`}
              >
                {/* Recommended Badge */}
                {isRecommended && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                    <Star className="h-3 w-3 inline mr-1" />
                    Most Popular
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrent && (
                  <div className={`absolute top-0 left-0 bg-${color}-500 text-white px-3 py-1 text-xs font-semibold rounded-br-lg`}>
                    Current Plan
                  </div>
                )}

                <div className="p-6">
                  {/* Icon and Property Type */}
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`h-8 w-8 text-${color}-600`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{tier.displayName}</h3>
                    <p className="text-sm text-gray-500 mt-1">{tier.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-900">${tier.monthlyPrice}</span>
                      <span className="text-gray-500 ml-1">/month</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Billed monthly
                    </div>
                  </div>

                  {/* Services List */}
                  <div className="space-y-3 mb-8">
                    {tier.services?.slice(0, 5).map((service, index) => (
                      <div key={index} className="flex items-center">
                        <Check className={`h-4 w-4 text-${color}-500 mr-3 flex-shrink-0`} />
                        <span className="text-sm text-gray-700">{service}</span>
                      </div>
                    ))}
                    {tier.services?.length > 5 && (
                      <div className="text-sm text-gray-500 pl-7">
                        +{tier.services.length - 5} more services
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleSelectPlan(tier)}
                    disabled={isCurrent}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-all ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : `bg-${color}-600 text-white hover:bg-${color}-700 transform hover:scale-105`
                    }`}
                  >
                    {isCurrent ? (
                      'Current Plan'
                    ) : currentSubscription ? (
                      'Switch Plan'
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 inline mr-2" />
                        Subscribe Now
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Social Impact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Your Subscription Makes a Difference
          </h3>
          <p className="text-lg text-gray-700 mb-6">
            Every subscription contributes to our social impact initiative. 
            For every 10 paid subscriptions, we provide 1 free maintenance service to families in need.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-2">10:1</div>
              <div className="text-sm text-gray-600">Impact Ratio</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
              <div className="text-sm text-gray-600">Transparent</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-2">Local</div>
              <div className="text-sm text-gray-600">Community Focus</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedTier && (
        <SubscriptionPaymentModal
          tier={selectedTier}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedTier(null);
          }}
          onSuccess={handlePaymentSuccess}
          currentSubscription={currentSubscription}
        />
      )}
    </>
  );
};

export default SubscriptionPlans;