import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Calendar,
  ArrowLeft,
  CheckCircle,
  Shield,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const ServiceDetailPage = () => {
  const { id } = useParams();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock service data
  const service = {
    id: parseInt(id),
    name: 'Plumbing Repair Service',
    price: 200,
    duration: '2-4 hours',
    rating: 4.8,
    reviews: 156,
    description: 'Professional plumbing repair services including pipe unclogging, leak repair, and pipe replacement. Our expert team has extensive experience to quickly solve various plumbing issues.',
    features: [
      '24-hour emergency service',
      'Professional tools and equipment',
      'Warranty service',
      'Transparent pricing',
      'Professional team',
      'Quick response'
    ],
    process: [
      {
        step: 1,
        title: 'Schedule Service',
        description: 'Book via phone or online, describe the issue'
      },
      {
        step: 2,
        title: 'On-site Inspection',
        description: 'Professional technician visits for assessment'
      },
      {
        step: 3,
        title: 'Confirm Quote',
        description: 'Review detailed quote and approve work'
      },
      {
        step: 4,
        title: 'Complete Service',
        description: 'Finish repairs and customer inspection'
      }
    ],
    vendor: {
      name: 'Professional Plumbing Repair Company',
      rating: 4.9,
      reviews: 234,
      experience: '8 years',
      location: 'Chaoyang District, Beijing',
      phone: '400-123-4567',
      description: 'Specializing in plumbing services for 8 years with professional team and advanced equipment. Served thousands of customers with excellent reviews.'
    },
    reviews: [
      {
        id: 1,
        user: 'Mr. Zhang',
        rating: 5,
        date: '2024-01-15',
        comment: 'Very professional service, technician solved the problem quickly.'
      },
      {
        id: 2,
        user: 'Ms. Li',
        rating: 5,
        date: '2024-01-10',
        comment: 'Reasonable price and good service attitude. Recommended!'
      },
      {
        id: 3,
        user: 'Mr. Wang',
        rating: 4,
        date: '2024-01-05',
        comment: 'Fast response and professional skills. Trustworthy.'
      }
    ]
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'process', name: 'Process' },
    { id: 'vendor', name: 'Vendor' },
    { id: 'reviews', name: 'Reviews' }
  ];

  const handleBooking = () => {
    toast.success('Redirecting to booking page...');
    // Here would be actual booking redirection
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link to="/services" className="flex items-center text-gray-600 hover:text-blue-600">
            <ArrowLeft size={16} className="mr-2" />
            Back to Services
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{service.name}</h1>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={`${
                          i < Math.floor(service.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 ml-2">
                    {service.rating} ({service.reviews} reviews)
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    ¥{service.price}
                  </div>
                  <div className="text-sm text-gray-500">Starting price</div>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Clock className="text-blue-500 mr-3" size={20} />
                  <span className="text-gray-600">Duration: {service.duration}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="text-blue-500 mr-3" size={20} />
                  <span className="text-gray-600">Service Area: Beijing</span>
                </div>
              </div>
            </motion.div>

            {/* Service Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Service Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {service.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="text-green-500 mr-3" size={20} />
                    <span className="text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Service Details Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg"
            >
              {/* Tab Navigation */}
              <div className="border-b">
                <div className="flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        selectedTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {selectedTab === 'overview' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Service Overview</h3>
                    <div className="space-y-4">
                      <p className="text-gray-600 leading-relaxed">
                        We provide professional plumbing services including:
                      </p>
                      <ul className="space-y-2 text-gray-600">
                        <li>• Pipe unclogging</li>
                        <li>• Leak detection and repair</li>
                        <li>• Pipe replacement and installation</li>
                        <li>• Sewer cleaning</li>
                        <li>• Pipe maintenance</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedTab === 'process' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Service Process</h3>
                    <div className="space-y-6">
                      {service.process.map((step) => (
                        <div key={step.step} className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-4">
                            {step.step}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{step.title}</h4>
                            <p className="text-gray-600 mt-1">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTab === 'vendor' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Vendor Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{service.vendor.name}</h4>
                        <div className="flex items-center">
                          <div className="flex items-center mr-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={`${
                                  i < Math.floor(service.vendor.rating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {service.vendor.rating} ({service.vendor.reviews})
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <User className="text-blue-500 mr-3" size={20} />
                          <span className="text-gray-600">Experience: {service.vendor.experience}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="text-blue-500 mr-3" size={20} />
                          <span className="text-gray-600">{service.vendor.location}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600">{service.vendor.description}</p>
                      
                      <div className="flex items-center">
                        <Phone className="text-blue-500 mr-3" size={20} />
                        <span className="text-gray-600">{service.vendor.phone}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'reviews' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
                    <div className="space-y-6">
                      {service.reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{review.user}</span>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          <div className="flex items-center mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={`${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-600">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Booking Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h3 className="text-xl font-semibold mb-4">Book Now</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold">¥{service.price} starting</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{service.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-semibold">Within 2 hours</span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Book Now
              </button>

              <div className="mt-4 text-center">
                <Link to="/contact" className="text-blue-600 hover:underline text-sm">
                  Need consultation? Contact Us
                </Link>
              </div>
            </div>

            {/* Service Guarantee */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="mr-2 text-green-500" />
                Service Guarantee
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">Professional Team</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">Service Warranty</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">Transparent Pricing</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">Quick Response</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Phone className="mr-2 text-blue-500" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone className="text-gray-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">{service.vendor.phone}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="text-gray-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">{service.vendor.location}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="text-gray-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">24-hour service</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;