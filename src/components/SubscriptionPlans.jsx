import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const SubscriptionPlans = ({ onSubscriptionSelect }) => {
  const [plans, setPlans] = useState([]);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('MONTHLY');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/subscriptions/tiers');
      if (response.data.success) {
        setPlans(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (propertyType) => {
    setSubscribing(true);
    try {
      const response = await api.post('/hitpay/create-subscription', {
        propertyType,
        billingCycle: selectedBillingCycle
      });

      if (response.data.success) {
        // Redirect to HitPay payment page
        window.location.href = response.data.data.paymentUrl;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to create subscription');
    } finally {
      setSubscribing(false);
    }
  };

  const getBillingCycleText = () => {
    return selectedBillingCycle === 'YEARLY' ? 'per year' : 'per month';
  };

  const getPrice = (plan) => {
    return selectedBillingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Property Maintenance Plan
        </h1>
        <p className="text-lg text-gray-600">
          Professional property maintenance services tailored to your needs
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSelectedBillingCycle('MONTHLY')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedBillingCycle === 'MONTHLY'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedBillingCycle('YEARLY')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedBillingCycle === 'YEARLY'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Save {plans[0]?.yearlyPercentageDiscount || 17}%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price = getPrice(plan);
          const originalYearlyPrice = plan.monthlyPrice * 12;
          const savings = selectedBillingCycle === 'YEARLY' 
            ? originalYearlyPrice - plan.yearlyPrice 
            : 0;

          return (
            <div
              key={plan._id}
              className="relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
            >
              {/* Most Popular Badge */}
              {plan.propertyType === 'CONDOMINIUM' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                {/* Plan Name */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.displayName}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${price}
                  </span>
                  <span className="text-gray-600 ml-1">
                    {getBillingCycleText()}
                  </span>
                  
                  {/* Yearly Savings */}
                  {selectedBillingCycle === 'YEARLY' && savings > 0 && (
                    <div className="text-sm text-green-600 mt-1">
                      Save ${savings} annually
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-6">
                  {plan.description}
                </p>

                {/* Services List */}
                <div className="text-left mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Included Services:</h4>
                  <ul className="space-y-1">
                    {plan.services?.slice(0, 4).map((service, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {service}
                      </li>
                    ))}
                    {plan.services?.length > 4 && (
                      <li className="text-sm text-gray-500">
                        +{plan.services.length - 4} more services
                      </li>
                    )}
                  </ul>
                </div>

                {/* Subscribe Button */}
                <button
                  onClick={() => handleSubscribe(plan.propertyType)}
                  disabled={subscribing}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan.propertyType === 'CONDOMINIUM'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {subscribing ? 'Processing...' : 'Choose Plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Why Choose HitPay for Payments?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Secure & Trusted
            </div>
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Instant Processing
            </div>
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Multiple Payment Methods
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
