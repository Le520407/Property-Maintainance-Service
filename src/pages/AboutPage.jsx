import React from 'react';
import { motion } from 'framer-motion';
import { Users, Award, Shield, Clock, Phone, Mail, MapPin } from 'lucide-react';

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
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-600 text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About Swift Fix Pro
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              We are committed to providing property owners with the most professional and reliable maintenance services, keeping your property in optimal condition at all times.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4">
                Swift Fix Pro was established in 2020, born from founder John Smith's deep understanding of the property management industry and unwavering pursuit of service quality.
                Over the past few years, we have grown from a small local service provider to an industry-leading property maintenance platform.
              </p>
              <p className="text-gray-600 mb-4">
                Our mission is to provide property owners with convenient, reliable, and efficient maintenance solutions through technological innovation and quality service.
                We believe that every property deserves the best care.
              </p>
              <p className="text-gray-600">
                Through our platform, customers can easily find professional maintenance service providers, receive transparent pricing and high-quality services.
                We are committed to being your most trusted property maintenance partner.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600"
                alt="Our Story"
                className="rounded-lg shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
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
                className="text-center p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-full mb-4">
                  <value.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our professional team is dedicated to providing you with the highest quality property maintenance services, with each member having rich industry experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="mb-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                <p className="text-orange-600 mb-3">{member.position}</p>
                <p className="text-gray-600">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We are always ready to help you. If you have any questions or need consultation, please feel free to contact us anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-full mb-4">
                <Phone size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Phone Consultation</h3>
              <p className="text-gray-600">+65 9123 4567</p>
              <p className="text-gray-600">Monday to Sunday 8:00-22:00</p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-full mb-4">
                <Mail size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Consultation</h3>
              <p className="text-gray-600">service@swiftfixpro.sg</p>
              <p className="text-gray-600">Response within 24 hours</p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-full mb-4">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Company Address</h3>
              <p className="text-gray-600">Singapore</p>
              <p className="text-gray-600">Marina Bay Financial Centre</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 