import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, Filter } from 'lucide-react';

const ServicesPage = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Services' },
    { id: 'maintenance', name: 'Home Repairs' },
    { id: 'painting', name: 'Painting' },
    { id: 'electrical', name: 'Electrical' },
    { id: 'plumbing', name: 'Plumbing' },
    { id: 'flooring', name: 'Flooring' },
    { id: 'installation', name: 'Appliance Installation' },
    { id: 'assembly', name: 'Furniture Assembly' },
    { id: 'moving', name: 'Moving Services' },
    { id: 'renovation', name: 'Renovation' },
    { id: 'security', name: 'Safety & Security' },
    { id: 'cleaning', name: 'Cleaning' }
  ];

  const services = [
    {
      id: 1,
      number: '01',
      name: 'Home Repairs',
      category: 'maintenance',
      description: 'Complete home repair solutions for all your property needs',
      image: '/images/home-repairs.jpg',
      serviceTypes: [
        'General repairs',
        'Fixture installation',
        'Hardware replacement',
        'Door and window repairs',
        'Wall patching',
        'Minor structural repairs'
      ]
    },
    {
      id: 2,
      number: '02',
      name: 'Painting Services',
      category: 'painting',
      description: 'Professional interior and exterior painting services',
      image: '/images/interior-painting.jpg',
      serviceTypes: [
        'Interior painting',
        'Exterior painting',
        'Wall preparation',
        'Color consultation',
        'Texture application',
        'Paint touch-ups'
      ]
    },
    {
      id: 3,
      number: '03',
      name: 'Electrical Services',
      category: 'electrical',
      description: 'Safe and reliable electrical installation and repair services',
      image: '/images/electrical-services.jpg',
      serviceTypes: [
        'Wiring installation',
        'Circuit breaker repair',
        'Outlet installation',
        'Light fixture installation',
        'Electrical panel upgrade',
        'Safety inspections'
      ]
    },
    {
      id: 4,
      number: '04',
      name: 'Plumbing Services',
      category: 'plumbing',
      description: 'Expert plumbing repairs and installations',
      image: '/images/plumbing-services.jpg',
      serviceTypes: [
        'Pipe repair and replacement',
        'Faucet installation',
        'Toilet repair',
        'Water heater service',
        'Drain cleaning',
        'Emergency plumbing'
      ]
    },
    {
      id: 5,
      number: '05',
      name: 'Carpentry Services',
      category: 'maintenance',
      description: 'Professional carpentry and woodwork services',
      image: '/images/carpentry-services.jpg',
      serviceTypes: [
        'Custom furniture',
        'Cabinet installation',
        'Shelving solutions',
        'Door installation',
        'Trim work',
        'Furniture repair'
      ]
    },
    {
      id: 6,
      number: '06',
      name: 'Flooring Services',
      category: 'flooring',
      description: 'Complete flooring installation and repair services',
      image: '/images/flooring-services.jpg',
      serviceTypes: [
        'Hardwood installation',
        'Tile installation',
        'Carpet installation',
        'Laminate flooring',
        'Floor refinishing',
        'Floor repair'
      ]
    },
    {
      id: 7,
      number: '07',
      name: 'Appliance Installation',
      category: 'installation',
      description: 'Professional appliance installation and setup services',
      image: '/images/appliance-installation.jpg',
      serviceTypes: [
        'Kitchen appliance installation',
        'Washing machine setup',
        'Dryer installation',
        'Dishwasher installation',
        'Refrigerator setup',
        'Appliance repair'
      ]
    },
    {
      id: 8,
      number: '08',
      name: 'Furniture Assembly',
      category: 'assembly',
      description: 'Expert furniture assembly and installation services',
      image: '/images/furniture-assembly.jpg',
      serviceTypes: [
        'IKEA furniture assembly',
        'Office furniture setup',
        'Bedroom furniture assembly',
        'Living room furniture',
        'Custom furniture installation',
        'Furniture disassembly'
      ]
    },
    {
      id: 9,
      number: '09',
      name: 'Moving Services',
      category: 'moving',
      description: 'Comprehensive moving and relocation services',
      image: '/images/moving-services.jpg',
      serviceTypes: [
        'Residential moving',
        'Office relocation',
        'Packing services',
        'Furniture moving',
        'Storage solutions',
        'Moving consultation'
      ]
    },
    {
      id: 10,
      number: '10',
      name: 'Renovation',
      category: 'renovation',
      description: 'Complete renovation and remodeling services',
      image: '/images/renovation.jpg',
      serviceTypes: [
        'Kitchen renovation',
        'Bathroom remodeling',
        'Room additions',
        'Interior renovation',
        'Basement finishing',
        'Home modernization'
      ]
    },
    {
      id: 11,
      number: '11',
      name: 'Safety and Security',
      category: 'security',
      description: 'Home security and safety system installation',
      image: '/images/safety-security.jpg',
      serviceTypes: [
        'Security system installation',
        'Camera setup',
        'Door lock installation',
        'Alarm system setup',
        'Safety inspections',
        'Security consultation'
      ]
    },
    {
      id: 12,
      number: '12',
      name: 'Cleaning Services',
      category: 'cleaning',
      description: 'Comprehensive cleaning solutions for your property',
      image: '/images/cleaning-services.jpg',
      serviceTypes: [
        'Regular house cleaning',
        'Deep cleaning',
        'Post-construction cleanup',
        'Window cleaning',
        'Carpet cleaning',
        'Move-in/move-out cleaning'
      ]
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
      
      {/* Hero Section - New Modern Style */}
      <section className="relative overflow-hidden">
        {/* Background with geometric patterns */}
        <div className="absolute inset-0 bg-orange-600">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"></div>
          {/* Geometric shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full opacity-20 transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-700 rounded-full opacity-30 transform -translate-x-24 translate-y-24"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white opacity-5 rounded-full"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-block px-4 py-2 bg-orange-500 bg-opacity-30 rounded-full text-orange-100 text-sm font-medium mb-4 backdrop-blur-sm">
                Professional Services
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            >
              Transform Your
              <span className="block text-orange-200">Property Today</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xl text-orange-100 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Expert maintenance and repair services delivered by certified professionals. 
              Quality work, competitive prices, guaranteed satisfaction.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                to="/order-request"
                className="group bg-white text-orange-600 px-8 py-4 rounded-xl hover:bg-orange-50 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <span className="flex items-center">
                  Get Started Now
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
              
              <Link
                to="/contact"
                className="text-white border-2 border-orange-300 px-8 py-4 rounded-xl hover:bg-orange-500 hover:border-orange-500 transition-all duration-300 font-semibold backdrop-blur-sm"
              >
                Consult Expert
              </Link>
            </motion.div>
            
            {/* Stats or features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-orange-200 text-sm">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-orange-200 text-sm">Support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-orange-200 text-sm">Satisfaction</div>
              </div>
            </motion.div>
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
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Service Number */}
              <div className="px-6 pt-6">
                <div className="text-4xl font-bold text-gray-300 mb-4">{service.number}</div>
              </div>

              {/* Service Image */}
              <div className="px-6 mb-4">
                <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center" style={{display: 'none'}}>
                    <span className="text-orange-600 font-semibold">Service Image</span>
                  </div>
                </div>
              </div>

              {/* Service Content */}
              <div className="px-6 pb-6">
                {/* Service Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 font-roboto">{service.name}</h3>

                {/* Service Types List */}
                <ul className="space-y-2">
                  {service.serviceTypes.map((type, idx) => (
                    <li key={idx} className="text-gray-700 flex items-center font-roboto text-sm">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></span>
                      {type}
                    </li>
                  ))}
                </ul>

                {/* View Details Button */}
                <Link
                  to={`/services/${service.id}`}
                  className="block w-full bg-orange-600 text-white text-center py-3 rounded-lg hover:bg-orange-700 transition-colors mt-6 font-medium"
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