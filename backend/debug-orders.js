const mongoose = require("mongoose");
const Order = require("./models/Order");
const User = require("./models/User");
const PointsTransaction = require("./models/PointsTransaction");
require("dotenv").config();

async function debugOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    console.log("\n=== All Orders Status ===");
    const allOrders = await Order.find({})
      .populate("customer", "firstName lastName email")
      .sort({ createdAt: -1 });
    
    console.log(`Found ${allOrders.length} total orders`);
    
    allOrders.forEach((order, index) => {
      console.log(`\n--- Order ${index + 1}: ${order.orderNumber} ---`);
      console.log(`Customer: ${order.customer.firstName} ${order.customer.lastName} (${order.customer.email})`);
      console.log(`Total: $${order.total}`);
      console.log(`Status: ${order.status}`);
      console.log(`Payment Status: ${order.paymentStatus}`);
    });

    console.log("\n=== T3 User Details ===");
    const t3User = await User.findOne({ email: "t3@gmail.com" });
    if (t3User) {
      console.log(`Name: ${t3User.firstName} ${t3User.lastName}`);
      console.log(`Points Balance: ${t3User.pointsBalance}`);
      console.log(`Has Completed First Order: ${t3User.hasCompletedFirstOrder}`);
      
      const t3Orders = await Order.find({ customer: t3User._id });
      console.log(`T3 Orders: ${t3Orders.length}`);
      t3Orders.forEach((order, idx) => {
        console.log(`  ${idx + 1}. ${order.orderNumber} - ${order.status}/${order.paymentStatus} - $${order.total}`);
      });
    }

    console.log("\n=== Jia Le (Referrer) Details ===");
    const referrer = await User.findOne({ email: "le520735@gmail.com" });
    if (referrer) {
      console.log(`Name: ${referrer.firstName} ${referrer.lastName}`);
      console.log(`Points Balance: ${referrer.pointsBalance}`);
      console.log(`Referral User Type: ${referrer.referralUserType}`);
      
      const pointsTransactions = await PointsTransaction.find({ user: referrer._id });
      console.log(`Points Transactions: ${pointsTransactions.length}`);
    }

  } catch (error) {
    console.error("Debug error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

debugOrders();
