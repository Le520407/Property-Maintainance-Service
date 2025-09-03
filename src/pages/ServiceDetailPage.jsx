import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Clock, CheckCircle, Shield, Award } from 'lucide-react';
import ImageService from '../services/ImageService';

const ServiceDetailPage = () => {
  const { id } = useParams();

  // Services data matching the structure from ServicesPage.jsx
  const services = [
    {
      id: 1,
      number: "01",
      name: "Home Repairs",
      category: "maintenance",
      description: "Complete home repair solutions for all your property needs",
      image: ImageService.getImageUrl("home-repairs.jpg"),
      rating: 4.8,
      reviews: 156,
      completedJobs: 1250,
      warranty: "12 months",
      responseTime: "Same day",
      detailedDescription: "Our comprehensive home maintenance service covers all aspects of keeping your property in top condition. From routine inspections to emergency repairs, our skilled technicians ensure your home remains safe, comfortable, and well-maintained year-round.",
      serviceTypes: [
        "General repairs",
        "Fixture installation",
        "Hardware replacement",
        "Door and window repairs",
        "Wall patching",
        "Minor structural repairs"
      ],
      process: [
        {
          step: 1,
          title: "Property Assessment",
          description: "Thorough inspection of your property to identify maintenance needs"
        },
        {
          step: 2,
          title: "Maintenance Plan",
          description: "Create a customized maintenance schedule based on your property's needs"
        },
        {
          step: 3,
          title: "Service Execution",
          description: "Perform all necessary maintenance tasks with quality materials"
        },
        {
          step: 4,
          title: "Follow-up",
          description: "Schedule regular check-ups to maintain optimal property condition"
        }
      ]
    },
    {
      id: 2,
      number: "02",
      name: "Painting Services",
      category: "painting",
      description: "Professional interior and exterior painting services",
      image: ImageService.getImageUrl("interior-painting.jpg"),
      rating: 4.9,
      reviews: 203,
      completedJobs: 890,
      warranty: "24 months",
      responseTime: "2-3 days",
      detailedDescription: "Transform your space with our professional painting services. We use only premium quality paints and employ skilled painters who pay attention to every detail, ensuring a flawless finish that enhances your property's beauty and value.",
      serviceTypes: [
        "Interior painting",
        "Exterior painting",
        "Wall preparation",
        "Color consultation",
        "Texture application",
        "Paint touch-ups"
      ],
      process: [
        {
          step: 1,
          title: "Color Consultation",
          description: "Expert advice on color selection and paint types"
        },
        {
          step: 2,
          title: "Surface Preparation",
          description: "Proper cleaning, sanding, and priming of surfaces"
        },
        {
          step: 3,
          title: "Professional Painting",
          description: "Application of premium paint with professional techniques"
        },
        {
          step: 4,
          title: "Quality Inspection",
          description: "Final inspection and touch-ups for perfect results"
        }
      ]
    },
    {
      id: 3,
      number: "03",
      name: "Electrical Services",
      category: "electrical",
      description: "Safe and reliable electrical installation and repair services",
      image: ImageService.getImageUrl("electrical-services.jpg"),
      rating: 4.8,
      reviews: 189,
      completedJobs: 750,
      warranty: "18 months",
      responseTime: "Same day",
      detailedDescription: "Our certified electricians provide safe and reliable electrical services for your home or business. From simple repairs to complex installations, we ensure all work meets safety standards and local codes.",
      serviceTypes: [
        "Wiring installation",
        "Circuit breaker repair",
        "Outlet installation",
        "Light fixture installation",
        "Electrical panel upgrade",
        "Safety inspections"
      ],
      process: [
        {
          step: 1,
          title: "Safety Assessment",
          description: "Comprehensive electrical safety evaluation"
        },
        {
          step: 2,
          title: "Work Planning",
          description: "Detailed plan for electrical work and safety measures"
        },
        {
          step: 3,
          title: "Professional Installation",
          description: "Expert installation following all safety protocols"
        },
        {
          step: 4,
          title: "Testing & Certification",
          description: "Thorough testing and safety certification"
        }
      ]
    },
    {
      id: 4,
      number: "04",
      name: "Plumbing Services",
      category: "plumbing",
      description: "Expert plumbing repairs and installations",
      image: ImageService.getImageUrl("plumbing-services.jpg"),
      rating: 4.7,
      reviews: 234,
      completedJobs: 980,
      warranty: "12 months",
      responseTime: "1 hour",
      detailedDescription: "Professional plumbing services for all your water and drainage needs. Our experienced plumbers handle everything from minor leaks to major installations with efficiency and expertise.",
      serviceTypes: [
        "Pipe repair and replacement",
        "Faucet installation",
        "Toilet repair",
        "Water heater service",
        "Drain cleaning",
        "Emergency plumbing"
      ],
      process: [
        {
          step: 1,
          title: "Problem Diagnosis",
          description: "Accurate identification of plumbing issues"
        },
        {
          step: 2,
          title: "Solution Planning",
          description: "Develop the most effective repair or installation plan"
        },
        {
          step: 3,
          title: "Professional Service",
          description: "Execute plumbing work with quality materials"
        },
        {
          step: 4,
          title: "System Testing",
          description: "Test all connections and ensure proper operation"
        }
      ]
    },
    {
      id: 5,
      number: "05",
      name: "Carpentry Services",
      category: "maintenance",
      description: "Professional carpentry and woodwork services",
      image: ImageService.getImageUrl("carpentry-services.jpg"),
      rating: 4.9,
      reviews: 167,
      completedJobs: 540,
      warranty: "36 months",
      responseTime: "2-3 days",
      detailedDescription: "Expert carpentry services for all your woodworking needs. From custom furniture to built-in storage solutions, our skilled carpenters deliver quality craftsmanship that stands the test of time.",
      serviceTypes: [
        "Custom furniture",
        "Cabinet installation",
        "Shelving solutions",
        "Door installation",
        "Trim work",
        "Furniture repair"
      ],
      process: [
        {
          step: 1,
          title: "Design Consultation",
          description: "Discuss your vision and take detailed measurements"
        },
        {
          step: 2,
          title: "Material Selection",
          description: "Choose quality wood and hardware for your project"
        },
        {
          step: 3,
          title: "Precision Crafting",
          description: "Expert woodworking with attention to detail"
        },
        {
          step: 4,
          title: "Professional Installation",
          description: "Careful installation and final quality check"
        }
      ]
    },
    {
      id: 6,
      number: "06",
      name: "Flooring Services",
      category: "flooring",
      description: "Complete flooring installation and repair services",
      image: ImageService.getImageUrl("flooring-services.jpg"),
      rating: 4.8,
      reviews: 198,
      completedJobs: 620,
      warranty: "24 months",
      responseTime: "3-5 days",
      detailedDescription: "Transform your space with our professional flooring services. We work with all types of flooring materials and provide expert installation, repair, and refinishing services.",
      serviceTypes: [
        "Hardwood installation",
        "Tile installation",
        "Carpet installation",
        "Laminate flooring",
        "Floor refinishing",
        "Floor repair"
      ],
      process: [
        {
          step: 1,
          title: "Floor Assessment",
          description: "Evaluate existing conditions and requirements"
        },
        {
          step: 2,
          title: "Material Selection",
          description: "Help choose the best flooring for your needs"
        },
        {
          step: 3,
          title: "Professional Installation",
          description: "Expert installation with proper techniques"
        },
        {
          step: 4,
          title: "Final Inspection",
          description: "Quality check and maintenance guidance"
        }
      ]
    },
    {
      id: 7,
      number: "07",
      name: "Appliance Installation",
      category: "installation",
      description: "Professional appliance installation and setup services",
      image: ImageService.getImageUrl("appliance-installation.jpg"),
      rating: 4.7,
      reviews: 145,
      completedJobs: 425,
      warranty: "6 months",
      responseTime: "Same day",
      detailedDescription: "Safe and proper installation of all your home appliances. Our technicians ensure correct setup, proper connections, and full functionality testing for your peace of mind.",
      serviceTypes: [
        "Kitchen appliance installation",
        "Washing machine setup",
        "Dryer installation",
        "Dishwasher installation",
        "Refrigerator setup",
        "Appliance repair"
      ],
      process: [
        {
          step: 1,
          title: "Pre-Installation Check",
          description: "Verify space and utility requirements"
        },
        {
          step: 2,
          title: "Professional Setup",
          description: "Careful installation with proper connections"
        },
        {
          step: 3,
          title: "System Testing",
          description: "Complete functionality and safety testing"
        },
        {
          step: 4,
          title: "User Training",
          description: "Instructions on proper operation and maintenance"
        }
      ]
    },
    {
      id: 8,
      number: "08",
      name: "Furniture Assembly",
      category: "assembly",
      description: "Expert furniture assembly and installation services",
      image: ImageService.getImageUrl("furniture-assembly.jpg"),
      rating: 4.6,
      reviews: 187,
      completedJobs: 890,
      warranty: "3 months",
      responseTime: "Next day",
      detailedDescription: "Professional furniture assembly service that saves you time and ensures your furniture is properly assembled. We handle all types of furniture with the right tools and expertise.",
      serviceTypes: [
        "IKEA furniture assembly",
        "Office furniture setup",
        "Bedroom furniture assembly",
        "Living room furniture",
        "Custom furniture installation",
        "Furniture disassembly"
      ],
      process: [
        {
          step: 1,
          title: "Package Inspection",
          description: "Check all parts and hardware are included"
        },
        {
          step: 2,
          title: "Professional Assembly",
          description: "Expert assembly with proper tools and techniques"
        },
        {
          step: 3,
          title: "Quality Check",
          description: "Ensure stability and proper function"
        },
        {
          step: 4,
          title: "Placement & Setup",
          description: "Position furniture and clean up assembly area"
        }
      ]
    },
    {
      id: 9,
      number: "09",
      name: "Moving Services",
      category: "moving",
      description: "Comprehensive moving and relocation services",
      image: ImageService.getImageUrl("moving-services.jpg"),
      rating: 4.5,
      reviews: 156,
      completedJobs: 320,
      warranty: "Insurance covered",
      responseTime: "1-2 days",
      detailedDescription: "Stress-free moving services with experienced movers who handle your belongings with care. From packing to transport, we make your move smooth and efficient.",
      serviceTypes: [
        "Residential moving",
        "Office relocation",
        "Packing services",
        "Furniture moving",
        "Storage solutions",
        "Moving consultation"
      ],
      process: [
        {
          step: 1,
          title: "Moving Assessment",
          description: "Evaluate items and plan the most efficient move"
        },
        {
          step: 2,
          title: "Packing & Preparation",
          description: "Careful packing with quality materials"
        },
        {
          step: 3,
          title: "Safe Transport",
          description: "Secure loading and careful transportation"
        },
        {
          step: 4,
          title: "Unpacking & Setup",
          description: "Careful unpacking and placement at destination"
        }
      ]
    },
    {
      id: 10,
      number: "10",
      name: "Renovation",
      category: "renovation",
      description: "Complete renovation and remodeling services",
      image: ImageService.getImageUrl("renovation.jpg"),
      rating: 4.9,
      reviews: 89,
      completedJobs: 150,
      warranty: "5 years",
      responseTime: "1-2 weeks",
      detailedDescription: "Complete renovation services that transform your space. From design consultation to final touches, we manage every aspect of your renovation project with attention to detail and quality.",
      serviceTypes: [
        "Kitchen renovation",
        "Bathroom remodeling",
        "Room additions",
        "Interior renovation",
        "Basement finishing",
        "Home modernization"
      ],
      process: [
        {
          step: 1,
          title: "Design Consultation",
          description: "Collaborate on design and create detailed plans"
        },
        {
          step: 2,
          title: "Project Planning",
          description: "Develop timeline, permits, and material selection"
        },
        {
          step: 3,
          title: "Construction Phase",
          description: "Execute renovation with quality workmanship"
        },
        {
          step: 4,
          title: "Final Inspection",
          description: "Quality check and project completion walkthrough"
        }
      ]
    },
    {
      id: 11,
      number: "11",
      name: "Safety and Security",
      category: "security",
      description: "Home security and safety system installation",
      image: ImageService.getImageUrl("safety-security.jpg"),
      rating: 4.8,
      reviews: 134,
      completedJobs: 380,
      warranty: "12 months",
      responseTime: "Same day",
      detailedDescription: "Protect your property and loved ones with our comprehensive security solutions. From alarm systems to safety assessments, we provide peace of mind through reliable security measures.",
      serviceTypes: [
        "Security system installation",
        "Camera setup",
        "Door lock installation",
        "Alarm system setup",
        "Safety inspections",
        "Security consultation"
      ],
      process: [
        {
          step: 1,
          title: "Security Assessment",
          description: "Evaluate your property's security needs"
        },
        {
          step: 2,
          title: "System Design",
          description: "Create a customized security solution"
        },
        {
          step: 3,
          title: "Professional Installation",
          description: "Install and configure security systems"
        },
        {
          step: 4,
          title: "Training & Support",
          description: "Provide system training and ongoing support"
        }
      ]
    },
    {
      id: 12,
      number: "12",
      name: "Cleaning Services",
      category: "cleaning",
      description: "Comprehensive cleaning solutions for your property",
      image: ImageService.getImageUrl("cleaning-services.jpg"),
      rating: 4.7,
      reviews: 245,
      completedJobs: 1200,
      warranty: "24 hours",
      responseTime: "Next day",
      detailedDescription: "Professional cleaning services that keep your space spotless and healthy. We use eco-friendly products and provide flexible scheduling to meet your needs.",
      serviceTypes: [
        "Regular house cleaning",
        "Deep cleaning",
        "Post-construction cleanup",
        "Window cleaning",
        "Carpet cleaning",
        "Move-in/move-out cleaning"
      ],
      process: [
        {
          step: 1,
          title: "Cleaning Assessment",
          description: "Evaluate cleaning needs and preferences"
        },
        {
          step: 2,
          title: "Custom Plan",
          description: "Create a cleaning schedule that works for you"
        },
        {
          step: 3,
          title: "Professional Cleaning",
          description: "Thorough cleaning with eco-friendly products"
        },
        {
          step: 4,
          title: "Quality Inspection",
          description: "Final inspection to ensure satisfaction"
        }
      ]
    }
  ];

  // Find the current service
  const currentService = services.find(service => service.id === parseInt(id));

  if (!currentService) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h1>
          <Link to="/services" className="text-orange-600 hover:text-orange-700">
            ← Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner with Service Image and Orange Theme */}
      <section className="relative h-96 overflow-hidden">
        {/* Orange Background with geometric patterns */}
        <div className="absolute inset-0 bg-orange-600">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"></div>
          {/* Geometric shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full opacity-20 transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-700 rounded-full opacity-30 transform -translate-x-24 translate-y-24"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white opacity-5 rounded-full"></div>
        </div>
        
        {/* Service Image in Front */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-10"
          style={{
            backgroundImage: `url(${currentService.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-black bg-opacity-40 z-20"></div>
        
        {/* Content */}
        <div className="relative z-30 h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-white">
              {/* Back Button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6"
              >
                <Link
                  to="/services"
                  className="inline-flex items-center text-white hover:text-orange-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Services
                </Link>
              </motion.div>
              
              {/* Service Info */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="inline-block px-3 py-1 bg-orange-600 bg-opacity-80 rounded-full text-sm font-medium mb-4">
                  {currentService.number}
                </span>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {currentService.name}
                </h1>
                <p className="text-xl text-gray-200 mb-6 max-w-2xl">
                  {currentService.description}
                </p>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span>{currentService.rating} ({currentService.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center">
                    <Award className="w-4 h-4 mr-1" />
                    <span>{currentService.completedJobs}+ Jobs Completed</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    <span>{currentService.warranty} Warranty</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{currentService.responseTime} Response</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Combined Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content - All Sections Combined */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Overview Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Service Overview</h2>
                
                {/* Service Description */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">About This Service</h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    {currentService.detailedDescription}
                  </p>
                </div>

                {/* Service Types */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">What's Included</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {currentService.serviceTypes.map((type, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Why Choose Us</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <Shield className="w-6 h-6 text-orange-600 mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Licensed & Insured</h4>
                        <p className="text-gray-600 text-sm">Fully licensed professionals with comprehensive insurance coverage</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Award className="w-6 h-6 text-orange-600 mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold text-gray-900">Quality Guarantee</h4>
                        <p className="text-gray-600 text-sm">100% satisfaction guarantee on all our services</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Process Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Process</h2>
                <div className="space-y-6">
                  {currentService.process.map((step, index) => (
                    <div key={index} className="flex">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold mr-4 text-lg">
                        {step.step}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Booking Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Book This Service</h2>
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <p className="text-gray-600 mb-6 text-lg">Ready to get started? Contact us to schedule your service appointment and get a free quote.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Link
                      to="/booking"
                      className="block w-full bg-orange-600 text-white text-center py-4 rounded-lg hover:bg-orange-700 transition-colors font-semibold text-lg"
                    >
                      Book Now
                    </Link>
                    <Link
                      to="/contact"
                      className="block w-full border-2 border-orange-600 text-orange-600 text-center py-4 rounded-lg hover:bg-orange-50 transition-colors font-semibold text-lg"
                    >
                      Get Free Quote
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Service Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jobs Completed:</span>
                    <span className="font-semibold">{currentService.completedJobs}+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Warranty:</span>
                    <span className="font-semibold">{currentService.warranty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time:</span>
                    <span className="font-semibold">{currentService.responseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="font-semibold">{currentService.rating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reviews:</span>
                    <span className="font-semibold">{currentService.reviews}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Link
                    to={`/booking?service=${currentService.id}`}
                    className="block w-full bg-orange-600 text-white text-center py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold mb-3"
                  >
                    Book This Service
                  </Link>
                  <Link
                    to="/contact"
                    className="block w-full border border-gray-300 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Ask Questions
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
