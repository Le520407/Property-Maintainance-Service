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

  // 服务列表数据 - 与ServicesPage.js保持一致
  const serviceList = [
    {
      id: 1,
      name: 'Plumbing Repair',
      category: 'plumbing',
      price: 80,
    duration: '2-4 hours',
    rating: 4.8,
      description: 'Professional plumbing repair and maintenance services including pipe unclogging, leak repair, and pipe replacement. Our expert team has extensive experience to quickly solve various plumbing issues.',
    features: [
        '24/7 Emergency Service',
        'Licensed Technicians', 
        'Warranty Included',
      'Professional tools and equipment',
      'Transparent pricing',
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
        location: 'Singapore',
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
    },
    {
      id: 2,
      name: 'Electrical Installation',
      category: 'electrical',
      price: 120,
      duration: '3-5 hours',
      rating: 4.9,
      description: 'Safe and reliable electrical installation services with certified electricians and safety-compliant procedures. We ensure quality workmanship and safety standards.',
      features: [
        'Certified Electricians',
        'Safety Compliant',
        'Quality Guaranteed',
        'Professional tools and equipment',
        'Transparent pricing',
        'Quick response'
      ],
      process: [
        {
          step: 1,
          title: 'Initial Consultation',
          description: 'Discuss electrical needs and requirements'
        },
        {
          step: 2,
          title: 'Site Assessment',
          description: 'Evaluate electrical system and safety requirements'
        },
        {
          step: 3,
          title: 'Installation Plan',
          description: 'Create detailed installation plan and timeline'
        },
        {
          step: 4,
          title: 'Professional Installation',
          description: 'Complete installation with safety testing'
        }
      ],
      vendor: {
        name: 'Safe Electrical Solutions',
        rating: 4.9,
        reviews: 203,
        experience: '12 years',
        location: 'Singapore',
        phone: '400-123-4568',
        description: 'Certified electrical contractors with 12 years of experience in residential and commercial electrical installations. Committed to safety and quality.'
      },
      reviews: [
        {
          id: 1,
          user: 'Mr. Chen',
          rating: 5,
          date: '2024-01-20',
          comment: 'Excellent electrical work, very professional and safe.'
        },
        {
          id: 2,
          user: 'Ms. Wong',
          rating: 5,
          date: '2024-01-18',
          comment: 'Great service, completed on time and within budget.'
        },
        {
          id: 3,
          user: 'Mr. Tan',
          rating: 4,
          date: '2024-01-12',
          comment: 'Professional team, quality workmanship.'
        }
      ]
    },
    {
      id: 3,
      name: 'Air Conditioning Service',
      category: 'maintenance',
      price: 150,
      duration: '2-3 hours',
      rating: 4.7,
      description: 'Professional AC cleaning, repair and maintenance services to keep your air conditioning system running efficiently and providing clean, cool air.',
      features: [
        'Professional Cleaning',
        'Filter Replacement',
        'Performance Check',
        '24/7 Emergency Service',
        'Warranty Included',
        'Quick response'
      ],
      process: [
        {
          step: 1,
          title: 'System Inspection',
          description: 'Check AC system condition and identify issues'
        },
        {
          step: 2,
          title: 'Cleaning Service',
          description: 'Thorough cleaning of filters and components'
        },
        {
          step: 3,
          title: 'Maintenance Work',
          description: 'Perform necessary repairs and maintenance'
        },
        {
          step: 4,
          title: 'Performance Test',
          description: 'Test system efficiency and functionality'
        }
      ],
      vendor: {
        name: 'Cool Air Solutions',
        rating: 4.7,
        reviews: 189,
        experience: '10 years',
        location: 'Singapore',
        phone: '400-123-4569',
        description: 'Specialized in air conditioning services for 10 years. We provide comprehensive AC maintenance, repair, and installation services.'
      },
      reviews: [
        {
          id: 1,
          user: 'Mr. Lim',
          rating: 5,
          date: '2024-01-22',
          comment: 'Great AC service, system working perfectly now.'
        },
        {
          id: 2,
          user: 'Ms. Goh',
          rating: 4,
          date: '2024-01-19',
          comment: 'Professional cleaning service, very thorough.'
        },
        {
          id: 3,
          user: 'Mr. Ng',
          rating: 5,
          date: '2024-01-15',
          comment: 'Fast and efficient service, highly recommended.'
        }
      ]
    },
    {
      id: 4,
      name: 'House Cleaning',
      category: 'cleaning',
      price: 60,
      duration: '2-4 hours',
      rating: 4.6,
      description: 'Comprehensive house cleaning services using eco-friendly products. We provide flexible scheduling and satisfaction guaranteed cleaning solutions.',
      features: [
        'Eco-friendly Products',
        'Flexible Scheduling',
        'Satisfaction Guaranteed',
        'Professional team',
        'Transparent pricing',
        'Quick response'
      ],
      process: [
        {
          step: 1,
          title: 'Assessment',
          description: 'Evaluate cleaning needs and requirements'
        },
        {
          step: 2,
          title: 'Preparation',
          description: 'Prepare cleaning supplies and equipment'
        },
        {
          step: 3,
          title: 'Cleaning Service',
          description: 'Perform thorough cleaning of all areas'
        },
        {
          step: 4,
          title: 'Quality Check',
          description: 'Inspect and ensure cleaning standards'
        }
      ],
      vendor: {
        name: 'Clean Home Services',
        rating: 4.6,
        reviews: 142,
        experience: '6 years',
        location: 'Singapore',
        phone: '400-123-4570',
        description: 'Professional cleaning service with 6 years of experience. We use eco-friendly products and provide flexible scheduling options.'
      },
      reviews: [
        {
          id: 1,
          user: 'Ms. Tan',
          rating: 5,
          date: '2024-01-25',
          comment: 'Excellent cleaning service, house looks brand new!'
        },
        {
          id: 2,
          user: 'Mr. Lee',
          rating: 4,
          date: '2024-01-23',
          comment: 'Very thorough cleaning, eco-friendly products used.'
        },
        {
          id: 3,
          user: 'Ms. Koh',
          rating: 5,
          date: '2024-01-20',
          comment: 'Professional team, flexible scheduling, highly satisfied.'
        }
      ]
    },
    {
      id: 5,
      name: 'Carpentry Work',
      category: 'maintenance',
      price: 100,
      duration: '4-6 hours',
      rating: 4.8,
      description: 'Professional carpentry and woodwork services with custom solutions, quality materials, and expert craftsmanship for all your woodworking needs.',
      features: [
        'Custom Solutions',
        'Quality Materials',
        'Expert Craftsmanship',
        'Professional team',
        'Warranty service',
        'Quick response'
      ],
      process: [
        {
          step: 1,
          title: 'Design Consultation',
          description: 'Discuss carpentry needs and design requirements'
        },
        {
          step: 2,
          title: 'Material Selection',
          description: 'Choose appropriate materials and finishes'
        },
        {
          step: 3,
          title: 'Fabrication',
          description: 'Expert crafting and assembly of components'
        },
        {
          step: 4,
          title: 'Installation',
          description: 'Professional installation and finishing'
        }
      ],
      vendor: {
        name: 'Master Carpentry Works',
        rating: 4.8,
        reviews: 98,
        experience: '15 years',
        location: 'Singapore',
        phone: '400-123-4571',
        description: 'Master carpenters with 15 years of experience in custom woodwork and carpentry. We specialize in quality craftsmanship and custom solutions.'
      },
      reviews: [
        {
          id: 1,
          user: 'Mr. Ong',
          rating: 5,
          date: '2024-01-28',
          comment: 'Exceptional carpentry work, beautiful craftsmanship!'
        },
        {
          id: 2,
          user: 'Ms. Chua',
          rating: 5,
          date: '2024-01-26',
          comment: 'Custom cabinet work is perfect, highly skilled team.'
        },
        {
          id: 3,
          user: 'Mr. Yeo',
          rating: 4,
          date: '2024-01-24',
          comment: 'Quality materials and expert workmanship.'
        }
      ]
    },
    {
      id: 6,
      name: 'Pest Control',
      category: 'maintenance',
      price: 200,
      duration: '1-2 hours',
      rating: 4.9,
      description: 'Effective pest control and prevention services using safe chemicals and professional techniques. We provide follow-up service and prevention tips.',
      features: [
        'Safe Chemicals',
        'Follow-up Service',
        'Prevention Tips',
        'Professional team',
        'Warranty service',
        'Quick response'
      ],
      process: [
        {
          step: 1,
          title: 'Pest Assessment',
          description: 'Identify pest types and infestation levels'
        },
        {
          step: 2,
          title: 'Treatment Plan',
          description: 'Develop effective treatment strategy'
        },
        {
          step: 3,
          title: 'Safe Treatment',
          description: 'Apply safe and effective pest control'
        },
        {
          step: 4,
          title: 'Prevention Advice',
          description: 'Provide prevention tips and follow-up schedule'
        }
      ],
      vendor: {
        name: 'Safe Pest Control Solutions',
        rating: 4.9,
        reviews: 234,
        experience: '20 years',
        location: 'Singapore',
        phone: '400-123-4572',
        description: 'Leading pest control service with 20 years of experience. We use safe, effective methods and provide comprehensive pest management solutions.'
      },
      reviews: [
        {
          id: 1,
          user: 'Mr. Teo',
          rating: 5,
          date: '2024-01-30',
          comment: 'Excellent pest control service, completely pest-free now!'
        },
        {
          id: 2,
          user: 'Ms. Lim',
          rating: 5,
          date: '2024-01-28',
          comment: 'Safe chemicals used, very effective treatment.'
        },
        {
          id: 3,
          user: 'Mr. Ho',
          rating: 4,
          date: '2024-01-25',
          comment: 'Professional service, good prevention advice provided.'
        }
      ]
    }
  ];

  // 根据id查找对应的服务
  const service = serviceList.find(s => s.id === parseInt(id));

  // 如果找不到服务，显示404页面
  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">服务不存在</h1>
          <p className="text-gray-600 mb-6">抱歉，您查找的服务不存在。</p>
          <Link to="/services" className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors">
            返回服务列表
          </Link>
        </div>
      </div>
    );
  }

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
          <Link to="/services" className="flex items-center text-gray-600 hover:text-orange-600">
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
                    {service.rating} ({service.reviews.length} reviews)
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-600">
                    SGD {service.price}
                  </div>
                  <div className="text-sm text-gray-500">Starting price</div>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Clock className="text-orange-500 mr-3" size={20} />
                  <span className="text-gray-600">Duration: {service.duration}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="text-orange-500 mr-3" size={20} />
                  <span className="text-gray-600">Service Area: Singapore</span>
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
                          ? 'border-orange-500 text-orange-600'
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
                        {service.description}
                      </p>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Service Details:</h4>
                      <ul className="space-y-2 text-gray-600">
                          <li>• Category: {service.category.charAt(0).toUpperCase() + service.category.slice(1)}</li>
                          <li>• Duration: {service.duration}</li>
                          <li>• Rating: {service.rating}/5 ({service.reviews.length} reviews)</li>
                          <li>• Location: {service.vendor.location}</li>
                      </ul>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'process' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Service Process</h3>
                    <div className="space-y-6">
                      {service.process.map((step) => (
                        <div key={step.step} className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mr-4">
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
                          <User className="text-orange-500 mr-3" size={20} />
                          <span className="text-gray-600">Experience: {service.vendor.experience}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="text-orange-500 mr-3" size={20} />
                          <span className="text-gray-600">{service.vendor.location}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600">{service.vendor.description}</p>
                      
                      <div className="flex items-center">
                        <Phone className="text-orange-500 mr-3" size={20} />
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
                  <span className="font-semibold">SGD {service.price} starting</span>
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
                className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Book Now
              </button>

              <div className="mt-4 text-center">
                <Link to="/contact" className="text-orange-600 hover:underline text-sm">
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
                <Phone className="mr-2 text-orange-500" />
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