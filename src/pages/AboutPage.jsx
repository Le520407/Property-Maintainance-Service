import React from 'react';
import { motion } from 'framer-motion';
import { Users, Award, Shield, Clock, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';

const AboutPage = () => {
  const stats = [
    { number: '5000+', label: 'Satisfied Customers' },
    { number: '100+', label: 'Professional Team' },
    { number: '24/7', label: 'Service Support' },
    { number: '98%', label: 'Customer Satisfaction' }
  ];

  const values = [
    {
      icon: Shield,
      title: 'Quality Assurance',
      description: 'We commit to providing the highest quality services and products, ensuring your property gets the best protection.'
    },
    {
      icon: Clock,
      title: 'Timely Response',
      description: 'Quick response to your needs, providing 24/7 round-the-clock service support.'
    },
    {
      icon: Users,
      title: 'Professional Team',
      description: 'Experienced professional team providing you with the highest quality maintenance services.'
    },
    {
      icon: Award,
      title: 'Integrity',
      description: 'Built on integrity, transparent pricing with no hidden fees.'
    }
  ];

  const team = [
    {
      name: 'John Smith',
      position: 'Founder & CEO',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
      description: 'With 15 years of property management experience, dedicated to providing the highest quality service to clients.'
    },
    {
      name: 'Sarah Johnson',
      position: 'Technical Director',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300',
      description: 'Focuses on technological innovation, ensuring platform stability and user experience.'
    },
    {
      name: 'Michael Chen',
      position: 'Operations Director',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      description: 'Responsible for daily operations management, ensuring service quality meets the highest standards.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Hero Section - Matching HomePage Style */}
      <section className="relative overflow-hidden">
        {/* Background with geometric patterns */}
        <div className="absolute inset-0 bg-orange-600">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"></div>
          {/* Geometric shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full opacity-20 transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-700 rounded-full opacity-30 transform -translate-x-24 translate-y-24"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white opacity-5 rounded-full"></div>
          <div className="absolute top-1/4 right-1/3 w-48 h-48 bg-orange-400 rounded-full opacity-10 transform rotate-45"></div>
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
                About Our Company
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            >
              About
              <span className="block text-orange-200">Swift Fix Pro</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xl text-orange-100 max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              We are committed to providing property owners with the most professional and reliable 
              maintenance services, keeping your property in optimal condition at all times.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <a
                href="#story"
                className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center text-lg"
              >
                Our Story
              </a>
              <a
                href="/contact"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors text-lg"
              >
                Contact Us
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-3 group-hover:scale-110 transition-transform">
                    {stat.number}
                  </div>
                  <div className="text-gray-700 font-medium">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Story Section */}
      <section id="story" className="py-20 bg-gradient-to-br from-gray-50 to-orange-50/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 md:order-1"
            >
              <span className="inline-block px-4 py-2 bg-orange-500 bg-opacity-10 rounded-full text-orange-600 text-sm font-medium mb-6">
                Our Journey
              </span>
              <h2 className="text-4xl font-bold mb-8 text-gray-900">Our Story</h2>
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p className="text-lg">
                  Swift Fix Pro was established in 2020, born from founder John Smith's deep understanding of the property management industry and unwavering pursuit of service quality.
                  Over the past few years, we have grown from a small local service provider to an industry-leading property maintenance platform.
                </p>
                <p className="text-lg">
                  Our mission is to provide property owners with convenient, reliable, and efficient maintenance solutions through technological innovation and quality service.
                  We believe that every property deserves the best care.
                </p>
                <p className="text-lg">
                  Through our platform, customers can easily find professional maintenance service providers, receive transparent pricing and high-quality services.
                  We are committed to being your most trusted property maintenance partner.
                </p>
              </div>
              
              {/* Achievement highlights */}
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="text-2xl font-bold text-orange-600 mb-2">2020</div>
                  <div className="text-gray-700">Company Founded</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="text-2xl font-bold text-orange-600 mb-2">5000+</div>
                  <div className="text-gray-700">Projects Completed</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative order-1 md:order-2"
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600"
                  alt="Our Story"
                  className="rounded-2xl shadow-2xl"
                />
                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-200 rounded-full opacity-20"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-orange-100 rounded-full opacity-30"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Values Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Geometric Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-100 rounded-full opacity-30"></div>
          <div className="absolute top-1/2 left-1/3 w-6 h-6 bg-orange-500 rotate-45 opacity-30"></div>
          <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-orange-400 rounded-full opacity-20"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-orange-500 bg-opacity-10 rounded-full text-orange-600 text-sm font-medium mb-6">
              What Drives Us
            </span>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core values guide every decision and action we take, ensuring we always provide the highest quality service to our customers.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 h-full border border-gray-100 group-hover:border-orange-200">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <value.icon size={28} />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                  
                  {/* Decorative bottom accent */}
                  <div className="mt-6 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-16"
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-2xl">
              <h3 className="text-2xl font-bold mb-4">Ready to Experience the Difference?</h3>
              <p className="text-orange-100 mb-6 text-lg">
                Join thousands of satisfied customers who trust Swift Fix Pro with their property maintenance needs
              </p>
              <button className="bg-white text-orange-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors duration-300 shadow-lg hover:shadow-xl">
                Get Started Today
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Team Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50/30 relative overflow-hidden">
        {/* Geometric Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-24 h-24 bg-orange-200 rounded-full opacity-20"></div>
          <div className="absolute bottom-20 left-10 w-32 h-32 bg-orange-100 rounded-full opacity-30"></div>
          <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-orange-500 rotate-45 opacity-40"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-orange-500 bg-opacity-10 rounded-full text-orange-600 text-sm font-medium mb-6">
              Meet Our Experts
            </span>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our professional team is dedicated to providing you with the highest quality property maintenance services, with each member having rich industry experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group-hover:border-orange-200">
                  <div className="relative mb-6">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Professional badge */}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                    {member.name}
                  </h3>
                  <div className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-4">
                    {member.position}
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {member.description}
                  </p>
                  
                  {/* Decorative element */}
                  <div className="mt-6 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Geometric Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 rounded-full opacity-20"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-100 rounded-full opacity-30"></div>
          <div className="absolute top-1/2 right-1/3 w-6 h-6 bg-orange-500 rotate-45 opacity-30"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-orange-500 bg-opacity-10 rounded-full text-orange-600 text-sm font-medium mb-6">
              Get In Touch
            </span>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Contact Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We are always ready to help you. If you have any questions or need consultation, please feel free to contact us anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Phone,
                title: "Phone Consultation",
                primary: "+65 8861 31966",
                secondary: "Monday to Friday: 9:00 AM - 6:00 PM",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: Mail,
                title: "Email Consultation",
                primary: "sales@swiftfixpro.com",
                secondary: "Response within 24 hours",
                color: "from-orange-500 to-orange-600"
              },
              {
                icon: MapPin,
                title: "Company Address",
                primary: "Singapore",
                secondary: "Marina Bay Financial Centre",
                color: "from-green-500 to-green-600"
              }
            ].map((contact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="text-center p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 h-full border border-gray-100 group-hover:border-orange-200">
                  <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${contact.color} text-white rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <contact.icon size={28} />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                    {contact.title}
                  </h3>
                  <p className="text-gray-800 font-medium mb-2">
                    {contact.primary}
                  </p>
                  <p className="text-gray-600">
                    {contact.secondary}
                  </p>
                  
                  {/* Decorative bottom accent */}
                  <div className="mt-6 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-16"
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-2xl">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-orange-100 mb-6 text-lg">
                Contact us today for a free consultation and let us take care of all your property maintenance needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-orange-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors duration-300 shadow-lg hover:shadow-xl">
                  Get Free Quote
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-orange-600 transition-colors duration-300">
                  Schedule Consultation
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 