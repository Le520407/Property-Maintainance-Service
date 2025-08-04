import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Icon */}
          <div className="mb-8">
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={64} className="text-blue-600" />
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, the page you are looking for does not exist or has been moved. Please check the URL or return to the homepage.
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              to="/"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center mx-auto"
            >
              <Home size={20} className="mr-2" />
              Back to Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-800 font-medium inline-flex items-center mx-auto"
            >
              <ArrowLeft size={20} className="mr-2" />
              Go Back
            </button>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">You might want to visit:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/services"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Our Services
              </Link>
              <Link
                to="/products"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Product Store
              </Link>
              <Link
                to="/about"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
