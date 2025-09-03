import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone Consultation',
      details: ['+65 9123 4567', 'Monday to Sunday 8:00-22:00'],
      color: 'bg-orange-600'
    },
    {
      icon: Mail,
      title: 'Email Consultation',
      details: ['service@swiftfixpro.sg', 'Response within 24 hours'],
      color: 'bg-orange-600'
    },
    {
      icon: MapPin,
      title: 'Company Address',
      details: ['Singapore', 'Marina Bay Financial Centre'],
      color: 'bg-orange-600'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      details: ['Monday to Friday: 9:00-18:00', 'Saturday to Sunday: 10:00-16:00'],
      color: 'bg-orange-600'
    }
  ];

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Contact form data:', data);
    toast.success('Message sent! We will reply to you as soon as possible.');
    setIsSubmitted(true);
    setIsSubmitting(false);
    reset();
    
    // Reset submission status after 3 seconds
    setTimeout(() => setIsSubmitted(false), 3000);
  };

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
                Get In Touch
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            >
              Contact
              <span className="block text-orange-200">Swift Fix Pro</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xl text-orange-100 max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              We are always ready to help you. If you have any questions or need consultation, 
              please feel free to contact us anytime. Our expert team is here to assist you.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <a
                href="#contact-form"
                className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center text-lg"
              >
                <Send className="mr-2 w-5 h-5" />
                Send Message
              </a>
              <a
                href="tel:+6591234567"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors text-lg inline-flex items-center"
              >
                <Phone className="mr-2 w-5 h-5" />
                Call Now
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Info Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50/30 relative overflow-hidden">
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
              Contact Information
            </span>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Get In Touch With Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose your preferred way to contact us. We're here to help you with all your property maintenance needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="text-center p-8 rounded-2xl bg-white hover:bg-white hover:shadow-xl transition-all duration-300 h-full border border-gray-100 group-hover:border-orange-200">
                  <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${info.color.replace('bg-', 'from-')} ${info.color.replace('bg-', 'to-').replace('600', '700')} text-white rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <info.icon size={28} />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                    {info.title}
                  </h3>
                  {info.details.map((detail, i) => (
                    <p key={i} className="text-gray-600 mb-2 leading-relaxed">
                      {detail}
                    </p>
                  ))}
                  
                  {/* Decorative bottom accent */}
                  <div className="mt-6 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Contact Form and Map Section */}
      <section id="contact-form" className="py-20 bg-white relative overflow-hidden">
        {/* Geometric Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-24 h-24 bg-orange-200 rounded-full opacity-20"></div>
          <div className="absolute bottom-20 left-10 w-32 h-32 bg-orange-100 rounded-full opacity-30"></div>
          <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-orange-500 rotate-45 opacity-40"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Enhanced Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-10 rounded-2xl shadow-2xl border border-gray-100"
            >
              <div className="mb-8">
                <span className="inline-block px-4 py-2 bg-orange-500 bg-opacity-10 rounded-full text-orange-600 text-sm font-medium mb-4">
                  Send Us a Message
                </span>
                <h2 className="text-3xl font-bold mb-4 text-gray-900">Let's Start a Conversation</h2>
                <p className="text-gray-600">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>
              
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Message Sent Successfully!</h3>
                  <p className="text-gray-600 text-lg">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        {...register('name', { required: 'Please enter your name' })}
                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg transition-colors"
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-2">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        {...register('phone', { 
                          required: 'Please enter your phone number',
                          pattern: {
                            value: /^\+65\s?\d{8}$/,
                            message: 'Please enter a valid Singapore phone number'
                          }
                        })}
                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg transition-colors"
                        placeholder="+65 9123 4567"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-2">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Please enter your email address',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Please enter a valid email address'
                        }
                      })}
                      className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg transition-colors"
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-2">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Subject *
                    </label>
                    <select
                      {...register('subject', { required: 'Please select a subject' })}
                      className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg transition-colors"
                    >
                      <option value="">Choose a subject</option>
                      <option value="service">Service Inquiry</option>
                      <option value="product">Product Inquiry</option>
                      <option value="booking">Service Booking</option>
                      <option value="complaint">Complaint & Suggestion</option>
                      <option value="cooperation">Business Cooperation</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.subject && (
                      <p className="text-red-500 text-sm mt-2">{errors.subject.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Your Message *
                    </label>
                    <textarea
                      {...register('message', { 
                        required: 'Please enter your message',
                        minLength: {
                          value: 10,
                          message: 'Message must be at least 10 characters'
                        }
                      })}
                      rows={6}
                      className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg transition-colors resize-none"
                      placeholder="Please describe your needs or questions in detail..."
                    />
                    {errors.message && (
                      <p className="text-red-500 text-sm mt-2">{errors.message.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-8 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send size={22} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Enhanced Map and Additional Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Enhanced Map */}
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-3">
                    Our Location
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Visit Our Office</h3>
                  <p className="text-gray-600">
                    Come visit us at our modern office in the heart of Singapore's business district.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 h-64 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-600/30"></div>
                  <div className="relative text-center">
                    <MapPin className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                    <p className="text-orange-800 font-medium text-lg">Interactive Map</p>
                    <p className="text-orange-700 text-sm">Map integration coming soon</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Marina Bay Financial Centre</p>
                      <p className="text-gray-600">Singapore 018989</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced FAQ */}
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-3">
                    Quick Help
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h3>
                  <p className="text-gray-600">
                    Find quick answers to common questions about our services.
                  </p>
                </div>
                
                <div className="space-y-6">
                  {[
                    {
                      question: "How to book a service?",
                      answer: "You can book services through our website, phone, or email. We will arrange a professional team to provide services at the agreed time."
                    },
                    {
                      question: "How are service fees calculated?",
                      answer: "Service fees are calculated based on service type, workload, and material costs. We provide detailed quotes to ensure transparent pricing."
                    },
                    {
                      question: "Do you provide emergency services?",
                      answer: "Yes, we provide 24/7 emergency services. For urgent situations, we will prioritize handling."
                    }
                  ].map((faq, index) => (
                    <div key={index} className="border-l-4 border-orange-500 pl-6 py-4 bg-orange-50/50 rounded-r-xl">
                      <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                        {faq.question}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 text-center">
                  <a
                    href="/faq"
                    className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                  >
                    View All FAQs
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Additional Contact Options */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 rounded-2xl text-white shadow-xl">
                <h3 className="text-2xl font-bold mb-4">Need Immediate Assistance?</h3>
                <p className="text-orange-100 mb-6">
                  For urgent matters, contact us directly through these channels:
                </p>
                <div className="space-y-4">
                  <a
                    href="tel:+6591234567"
                    className="flex items-center gap-3 text-white hover:text-orange-200 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    <span className="font-medium">+65 9123 4567</span>
                  </a>
                  <a
                    href="mailto:service@swiftfixpro.sg"
                    className="flex items-center gap-3 text-white hover:text-orange-200 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span className="font-medium">service@swiftfixpro.sg</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage; 