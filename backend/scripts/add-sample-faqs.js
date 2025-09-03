const mongoose = require('mongoose');
require('dotenv').config();

// Import the FAQ model
const FAQ = require('../models/FAQ');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance');
    console.log('📄 MongoDB Connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const addSampleFAQs = async () => {
  try {
    await connectDB();

    // Check if FAQs already exist
    const existingFAQs = await FAQ.find();
    console.log(`📋 Found ${existingFAQs.length} existing FAQs`);

    if (existingFAQs.length === 0) {
      console.log('➕ Adding sample FAQs...');

      const sampleFAQs = [
        {
          question: 'How do I book a service?',
          answer: 'You can book a service by visiting our Services page, selecting the service you need, and clicking "Book Now". Fill out the booking form with your details and preferred time slot.',
          category: 'booking',
          keywords: ['book', 'service', 'booking', 'schedule'],
          isActive: true,
          helpful: { yes: 15, no: 2 },
          views: 120
        },
        {
          question: 'What are your service hours?',
          answer: 'We provide services Monday to Sunday from 8:00 AM to 10:00 PM. Emergency services are available 24/7 for urgent repairs.',
          category: 'general',
          keywords: ['hours', 'time', 'schedule', 'emergency'],
          isActive: true,
          helpful: { yes: 8, no: 1 },
          views: 85
        },
        {
          question: 'How much do your services cost?',
          answer: 'Service costs vary depending on the type and complexity of work. We provide free quotes before starting any work. Basic repairs start from SGD 80.',
          category: 'pricing',
          keywords: ['cost', 'price', 'fee', 'quote'],
          isActive: true,
          helpful: { yes: 22, no: 3 },
          views: 200
        },
        {
          question: 'Do you provide warranty for your work?',
          answer: 'Yes, we provide a 6-month warranty on all our repair work and a 1-year warranty on installations. Parts may have different warranty periods.',
          category: 'services',
          keywords: ['warranty', 'guarantee', 'repair', 'installation'],
          isActive: true,
          helpful: { yes: 18, no: 1 },
          views: 150
        },
        {
          question: 'How can I pay for services?',
          answer: 'We accept cash, bank transfer, PayNow, and major credit cards. Payment is typically due upon completion of work.',
          category: 'billing',
          keywords: ['payment', 'pay', 'cash', 'card', 'paynow'],
          isActive: true,
          helpful: { yes: 12, no: 0 },
          views: 95
        },
        {
          question: 'What if I need to cancel or reschedule?',
          answer: 'You can cancel or reschedule up to 24 hours before your appointment without any charges. Same-day changes may incur a small fee.',
          category: 'booking',
          keywords: ['cancel', 'reschedule', 'change', 'appointment'],
          isActive: true,
          helpful: { yes: 10, no: 2 },
          views: 70
        },
        {
          question: 'Do you offer emergency services?',
          answer: 'Yes! We provide 24/7 emergency services for urgent repairs like water leaks, electrical issues, and security problems. Emergency service rates may apply.',
          category: 'services',
          keywords: ['emergency', 'urgent', '24/7', 'leak', 'electrical'],
          isActive: true,
          helpful: { yes: 25, no: 1 },
          views: 180
        },
        {
          question: 'What areas do you service?',
          answer: 'We provide services throughout Singapore, including all HDB estates, condominiums, and landed properties. Some remote areas may have additional travel charges.',
          category: 'general',
          keywords: ['area', 'location', 'singapore', 'hdb', 'condo'],
          isActive: true,
          helpful: { yes: 14, no: 0 },
          views: 110
        }
      ];

      const createdFAQs = await FAQ.insertMany(sampleFAQs);
      console.log(`✅ ${createdFAQs.length} sample FAQs added successfully!`);
    } else {
      console.log('📋 FAQs already exist in database');
    }

    // List all FAQs
    const allFAQs = await FAQ.find({ isActive: true }).select('question category');
    console.log('\n📖 Current FAQs in database:');
    allFAQs.forEach((faq, index) => {
      console.log(`${index + 1}. ${faq.question} (${faq.category})`);
    });

    console.log(`\n🔗 You can now view FAQs at: http://localhost:3000/faq`);

  } catch (error) {
    console.error('❌ Error adding FAQs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
};

// Run the script
addSampleFAQs();
