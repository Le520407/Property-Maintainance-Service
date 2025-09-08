import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Building, UserPlus, ArrowRight, Star, ChevronLeft, CheckCircle } from 'lucide-react';

// Import the registration components
import CustomerRegisterPage from './CustomerRegisterPage';
import VendorRegisterPage from './VendorRegisterPage';
import AgentRegisterPage from './AgentRegisterPage';

const RegisterSelectionPage = () => {
  const [selectedUserType, setSelectedUserType] = useState(null);

  const userTypes = [
    {
      id: 'customer',
      title: 'Customer',
      description: 'Book property maintenance services',
      icon: Users,
      color: 'orange'
    },
    {
      id: 'vendor',
      title: 'Vendor',
      description: 'Provide maintenance services',
      icon: Building,
      color: 'orange'
    },
    {
      id: 'agent',
      title: 'Agent',
      description: 'Earn commissions through referrals',
      icon: UserPlus,
      color: 'orange'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header Section */}
      <section className="relative overflow-hidden py-16">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full opacity-20 transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-300 rounded-full opacity-15 transform -translate-x-24 translate-y-24"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Account Type
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select the type of account that best fits your needs
            </p>
          </motion.div>
        </div>
      </section>

      {/* Registration Options */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Account Type</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userTypes.map((type, index) => {
                    const IconComponent = type.icon;
                    
                    return (
                      <motion.tr
                        key={type.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        onClick={() => setSelectedUserType(type.id)}
                        className={`cursor-pointer transition-all duration-200 hover:bg-orange-50 ${
                          selectedUserType === type.id 
                            ? 'bg-orange-100 border-l-4 border-orange-500' 
                            : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-orange-500">
                              <IconComponent className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {type.title}
                              </div>
                              <div className="text-xs text-gray-600">
                                {type.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${
                            selectedUserType === type.id 
                              ? 'bg-orange-500 text-white' 
                              : 'border-2 border-gray-300 hover:border-orange-400'
                          }`}>
                            {selectedUserType === type.id && (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      {selectedUserType && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            {/* Back Button */}
            <div className="mb-8">
              <button
                onClick={() => setSelectedUserType(null)}
                className="inline-flex items-center px-4 py-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Selection
              </button>
            </div>

            {/* Form Container */}
            <div className="max-w-4xl mx-auto">
              {selectedUserType === 'customer' && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <CustomerRegisterPage embedded={true} />
                </motion.div>
              )}

              {selectedUserType === 'vendor' && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <VendorRegisterPage embedded={true} />
                </motion.div>
              )}

              {selectedUserType === 'agent' && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <AgentRegisterPage embedded={true} />
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Trust Indicators */}
      {!selectedUserType && (
        <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join our growing community of satisfied customers, professional vendors, and successful agents.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="mb-4 flex justify-center">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">1000+</div>
              <div className="text-gray-600">Happy Customers</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="mb-4 flex justify-center">
                <Building className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">200+</div>
              <div className="text-gray-600">Verified Vendors</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="mb-4 flex justify-center">
                <UserPlus className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">50+</div>
              <div className="text-gray-600">Active Agents</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="mb-4 flex justify-center">
                <Star className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">4.8</div>
              <div className="text-gray-600">Average Rating</div>
            </motion.div>
          </div>
        </div>
        </section>
      )}

      {/* Call to Action */}
      {!selectedUserType && (
        <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-3xl font-bold text-white mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
                Already have an account? Sign in to access your dashboard and continue where you left off.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-3 bg-white text-orange-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
              >
                Sign In Instead
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default RegisterSelectionPage;
