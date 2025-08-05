require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Service = require('../models/Service');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📄 MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function seed() {
  try {
    await connectDB();
    
    console.log('🌱 Seeding database...');

    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      email: 'admin@propertycare.sg',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      fullName: 'Admin User',
      phone: '+65 9999 9999',
      city: 'Singapore',
      country: 'Singapore',
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    // Create sample customer
    const customerPassword = await bcrypt.hash('customer123', 12);
    const customer = await User.create({
      email: 'customer@example.com',
      password: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      phone: '+65 8888 8888',
      city: 'Singapore',
      country: 'Singapore',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      totalSpent: 250.0,
      totalBookings: 3
    });

    // Create sample technician
    const techPassword = await bcrypt.hash('tech123', 12);
    const technician = await User.create({
      email: 'tech@example.com',
      password: techPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      fullName: 'Jane Smith',
      phone: '+65 7777 7777',
      city: 'Singapore',
      country: 'Singapore',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      skills: ['Plumbing', 'Electrical', 'Aircon Repair'],
      experience: 5,
      hourlyRate: 45.0,
      rating: 4.5,
      totalReviews: 23,
      completedJobs: 67,
      subscriptionPlan: 'PREMIUM'
    });

    // Create more technicians
    const techPassword2 = await bcrypt.hash('tech456', 12);
    await User.create({
      email: 'mike@techservice.sg',
      password: techPassword2,
      firstName: 'Mike',
      lastName: 'Johnson',
      fullName: 'Mike Johnson',
      phone: '+65 6666 6666',
      city: 'Singapore',
      country: 'Singapore',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      skills: ['Painting', 'Carpentry', 'General Maintenance'],
      experience: 3,
      hourlyRate: 35.0,
      rating: 4.2,
      totalReviews: 15,
      completedJobs: 45,
      subscriptionPlan: 'BASIC'
    });

    // Create services
    const services = [
      {
        name: 'Plumbing Repair',
        description: 'Fix leaks, unclog drains, and general plumbing maintenance',
        category: 'Plumbing',
        basePrice: 50.0,
        duration: 120
      },
      {
        name: 'Electrical Installation',
        description: 'Install fixtures, outlets, and electrical components',
        category: 'Electrical',
        basePrice: 75.0,
        duration: 180
      },
      {
        name: 'Aircon Servicing',
        description: 'Clean and maintain air conditioning units',
        category: 'HVAC',
        basePrice: 60.0,
        duration: 90
      },
      {
        name: 'Painting Service',
        description: 'Interior and exterior painting services',
        category: 'Painting',
        basePrice: 100.0,
        duration: 240
      },
      {
        name: 'General Cleaning',
        description: 'Deep cleaning services for homes and offices',
        category: 'Cleaning',
        basePrice: 40.0,
        duration: 120
      },
      {
        name: 'Carpentry Work',
        description: 'Custom furniture and woodwork services',
        category: 'Carpentry',
        basePrice: 80.0,
        duration: 200
      }
    ];

    await Service.insertMany(services);

    console.log('✅ Database seeded successfully!');
    console.log('👤 Admin: admin@propertycare.sg / admin123');
    console.log('👤 Customer: customer@example.com / customer123');
    console.log('👤 Technician: tech@example.com / tech123');
    console.log('👤 Technician: mike@techservice.sg / tech456');
    console.log(`📊 Created ${services.length} services`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();