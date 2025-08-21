import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  CheckCircle, 
  Heart,
  TrendingUp,
  Home,
  Building,
  Building2,
  Store,
  Calendar,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SubscriptionPlans from '../../components/customer/SubscriptionPlans';
import CurrentSubscription from '../../components/customer/CurrentSubscription';
import SocialImpactTracker from '../../components/customer/SocialImpactTracker';

const SubscriptionPage = () => {
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionTiers, setSubscriptionTiers] = useState([]);
  const [socialImpact, setSocialImpact] = useState(null);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      const [tiersRes, currentRes] = await Promise.all([
        api.get('/subscriptions/tiers'),
        api.get('/subscriptions/current')
      ]);

      setSubscriptionTiers(tiersRes.data.data);
      setCurrentSubscription(currentRes.data.data);

      if (!currentRes.data.data) {
        setActiveTab('plans');
      }

    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = () => {
    fetchSubscriptionData();
    setActiveTab('current');
    toast.success('Subscription activated successfully!');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const propertyIcons = {
    HDB: Home,
    CONDOMINIUM: Building,
    LANDED: Building2,
    COMMERCIAL: Store
  };

  const tabs = [
    { id: 'current', label: 'Current Plan', disabled: !currentSubscription },
    { id: 'plans', label: 'Subscription Plans' },
    { id: 'impact', label: 'Social Impact', disabled: !currentSubscription }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Property Maintenance Subscriptions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect maintenance plan for your property type. 
            Every 10 paid subscriptions funds 1 free service for those in need.
          </p>
        </div>

        {/* Impact Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 mb-8 text-white text-center"
        >
          <div className="flex items-center justify-center mb-2">
            <Heart className="h-6 w-6 mr-2" />
            <span className="text-lg font-semibold">Social Impact Pledge</span>
          </div>
          <p className="text-green-100">
            For every 10 paid subscriptions, we provide 1 free maintenance service to families in need
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : tab.disabled
                    ? 'border-transparent text-gray-300 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'current' && currentSubscription && (
            <CurrentSubscription 
              subscription={currentSubscription} 
              onUpdate={fetchSubscriptionData}
            />
          )}

          {activeTab === 'plans' && (
            <SubscriptionPlans 
              tiers={subscriptionTiers}
              currentSubscription={currentSubscription}
              onSubscriptionSuccess={handleSubscriptionSuccess}
            />
          )}

          {activeTab === 'impact' && currentSubscription && (
            <SocialImpactTracker 
              subscription={currentSubscription}
            />
          )}
        </div>

        {/* Features Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What's Included in Every Plan
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: CheckCircle,
                title: 'Regular Inspections',
                description: 'Scheduled property maintenance checks'
              },
              {
                icon: CreditCard,
                title: 'Transparent Pricing',
                description: 'Fixed monthly rates with no hidden fees'
              },
              {
                icon: Heart,
                title: 'Social Impact',
                description: 'Contributing to free services for those in need'
              },
              {
                icon: TrendingUp,
                title: 'Quality Service',
                description: 'Professional maintenance by certified technicians'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SubscriptionPage;