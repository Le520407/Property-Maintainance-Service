import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, Filter, Star, Clock, MapPin } from 'lucide-react';

const ServicesPage = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Services' },
    { id: 'plumbing', name: 'Plumbing' },
    { id: 'electrical', name: 'Electrical' },
    { id: 'cleaning', name: 'Cleaning' },
    { id: 'maintenance', name: 'Maintenance' }
  ];

  const services = [
    {
      id: 1,
      name: 'Plumbing Repair',
      category: 'plumbing',
      description: 'Professional plumbing repair and maintenance services',
      price: 'SGD 80',
      duration: '2-4 hours',
      rating: 4.8,
      reviews: 156,
      features: ['24/7 Emergency Service', 'Licensed Technicians', 'Warranty Included'],
      location: 'Singapore'
    },
    {
      id: 2,
      name: 'Electrical Installation',
      category: 'electrical',
      description: 'Safe and reliable electrical installation services',
      price: 'SGD 120',
      duration: '3-5 hours',
      rating: 4.9,
      reviews: 203,
      features: ['Certified Electricians', 'Safety Compliant', 'Quality Guaranteed'],
      location: 'Singapore'
    },
    {
      id: 3,
      name: 'Air Conditioning Service',
      category: 'maintenance',
      description: 'AC cleaning, repair and maintenance services',
      price: 'SGD 150',
      duration: '2-3 hours',
      rating: 4.7,
      reviews: 189,
      features: ['Professional Cleaning', 'Filter Replacement', 'Performance Check'],
      location: 'Singapore'
    },
    {
      id: 4,
      name: 'House Cleaning',
      category: 'cleaning',
      description: 'Comprehensive house cleaning services',
      price: 'SGD 60',
      duration: '2-4 hours',
      rating: 4.6,
      reviews: 142,
      features: ['Eco-friendly Products', 'Flexible Scheduling', 'Satisfaction Guaranteed'],
      location: 'Singapore'
    },
    {
      id: 5,
      name: 'Carpentry Work',
      category: 'maintenance',
      description: 'Professional carpentry and woodwork services',
      price: 'SGD 100',
      duration: '4-6 hours',
      rating: 4.8,
      reviews: 98,
      features: ['Custom Solutions', 'Quality Materials', 'Expert Craftsmanship'],
      location: 'Singapore'
    },
    {
      id: 6,
      name: 'Pest Control',
      category: 'maintenance',
      description: 'Effective pest control and prevention services',
      price: 'SGD 200',
      duration: '1-2 hours',
      rating: 4.9,
      reviews: 234,
      features: ['Safe Chemicals', 'Follow-up Service', 'Prevention Tips'],
      location: 'Singapore'
    }
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* ✅ Hero Section - full width like homepage */}
      <section className="relative bg-gradient-to-r from-orange-600 to-orange-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              Our Services
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-xl text-orange-100 max-w-2xl mx-auto"
            >
              Professional property maintenance services tailored to your needs
            </motion.p>
          </div>
        </div>
      </section>

      {/* ✅ Content Container */}
      <div className="container mx-auto px-4 py-12">

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                  <span className="text-2xl font-bold text-orange-600">{service.price}</span>
                </div>

                <p className="text-gray-600 mb-4">{service.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm text-gray-600">
                      {service.rating} ({service.reviews} reviews)
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {service.duration}
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  {service.location}
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                  <ul className="space-y-1">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={`/services/${service.id}`}
                  className="block w-full bg-orange-600 text-white text-center py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* No results */}
        {filteredServices.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No services found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-orange-600 rounded-lg p-8 text-center text-white"
        >
          <h3 className="text-2xl font-bold mb-4">Need a Custom Service?</h3>
          <p className="text-orange-100 mb-6">
            Can't find what you're looking for? Contact us for custom solutions tailored to your specific needs.
          </p>
          <Link
            to="/contact"
            className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Contact Us
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default ServicesPage; 