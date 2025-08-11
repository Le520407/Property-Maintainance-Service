import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Calendar, 
  DollarSign, 
  Users, 
  Package,
  Star,
  TrendingUp,
  FileText,
  MessageSquare,
  Building,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Dashboard Components
const CustomerDashboard = () => {
  const stats = [
    { title: 'Total Orders', value: '12', icon: Package, color: 'bg-blue-500' },
    { title: 'Pending', value: '3', icon: Calendar, color: 'bg-yellow-500' },
    { title: 'Completed', value: '9', icon: Star, color: 'bg-green-500' },
    { title: 'Total Spent', value: '$2,450', icon: DollarSign, color: 'bg-purple-500' }
  ];

  const recentOrders = [
    { id: 1, service: 'Plumbing Repair', status: 'Completed', date: '2024-01-15', amount: '$350' },
    { id: 2, service: 'Electrical Inspection', status: 'In Progress', date: '2024-01-18', amount: '$200' },
    { id: 3, service: 'Cleaning Service', status: 'Pending', date: '2024-01-20', amount: '$150' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customer Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color} text-white`}>
                <stat.icon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Service</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Amount</th>
                <th className="text-left py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{order.service}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3">{order.date}</td>
                  <td className="py-3">{order.amount}</td>
                  <td className="py-3">
                    <button className="text-blue-600 hover:underline">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const VendorDashboard = () => {
  const stats = [
    { title: 'Total Revenue', value: 'SGD 8,450', icon: DollarSign, color: 'bg-green-500' },
    { title: 'Monthly Orders', value: '28', icon: Package, color: 'bg-blue-500' },
    { title: 'Customer Rating', value: '4.8', icon: Star, color: 'bg-yellow-500' },
    { title: 'Active Customers', value: '45', icon: Users, color: 'bg-purple-500' },
    { title: 'Monthly Commission', value: 'SGD 1,267', icon: TrendingUp, color: 'bg-indigo-500' },
    { title: 'Completion Rate', value: '94%', icon: CheckCircle, color: 'bg-emerald-500' }
  ];

  const subscriptionInfo = {
    plan: 'Professional',
    status: 'Active',
    nextBilling: '2024-02-15',
    features: ['Advanced CRM', 'Detailed Analytics', 'Custom Quote Templates', 'Priority Support']
  };

  const recentJobs = [
    { id: 1, customer: 'John Smith', service: 'Plumbing Repair', status: 'In Progress', amount: 'SGD 350', commission: 'SGD 52.50' },
    { id: 2, customer: 'Sarah Johnson', service: 'Electrical Inspection', status: 'Completed', amount: 'SGD 200', commission: 'SGD 30.00' },
    { id: 3, customer: 'Mike Wilson', service: 'Cleaning Service', status: 'Pending', amount: 'SGD 150', commission: 'SGD 22.50' }
  ];

  const upcomingTraining = [
    { title: 'Customer Service Skills', date: '2024-01-25', duration: '2 hours', type: 'Online Course' },
    { title: 'Financial Management Basics', date: '2024-01-30', duration: '3 hours', type: 'Online Course' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
      
      {/* Subscription Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-md"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Subscription Status</h2>
            <p className="text-orange-50">Current Plan: {subscriptionInfo.plan}</p>
            <p className="text-orange-50">Next Billing: {subscriptionInfo.nextBilling}</p>
          </div>
          <div className="text-right">
            <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-sm font-medium">
              {subscriptionInfo.status}
            </span>
          </div>
        </div>
      </motion.div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color} text-white`}>
                <stat.icon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Customer</th>
                  <th className="text-left py-3">Service</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Amount</th>
                  <th className="text-left py-3">Commission</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{job.customer}</td>
                    <td className="py-3">{job.service}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 font-medium">{job.amount}</td>
                    <td className="py-3 text-green-600 font-medium">{job.commission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Training */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Training</h2>
          <div className="space-y-4">
            {upcomingTraining.map((training, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{training.title}</h3>
                    <p className="text-sm text-gray-600">{training.date} • {training.duration}</p>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
                      {training.type}
                    </span>
                  </div>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                    Join
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium">Schedule Work</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium">Create Quote</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageSquare className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium">Customer Communication</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const stats = [
    { title: 'Total Users', value: '1,234', icon: Users, color: 'bg-blue-500' },
    { title: 'Total Vendors', value: '89', icon: Building, color: 'bg-green-500' },
    { title: 'Monthly Revenue', value: '$45,680', icon: DollarSign, color: 'bg-purple-500' },
    { title: 'Pending Review', value: '12', icon: FileText, color: 'bg-yellow-500' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color} text-white`}>
                <stat.icon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/admin/banners"
              className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 block transition-colors"
            >
              Banner Management
            </Link>
            <Link
              to="/admin/blogs"
              className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 block transition-colors"
            >
              Blog Management
            </Link>
            <Link
              to="/admin/faqs"
              className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 block transition-colors"
            >
              FAQ Management
            </Link>
            <Link
              to="/admin/pricing"
              className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 block transition-colors"
            >
              Pricing Management
            </Link>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              Review Vendor Applications
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              View System Reports
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              Manage User Accounts
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Server Status</span>
              <span className="text-green-600">Normal</span>
            </div>
            <div className="flex justify-between">
              <span>Database Connection</span>
              <span className="text-green-600">Normal</span>
            </div>
            <div className="flex justify-between">
              <span>Payment System</span>
              <span className="text-green-600">Normal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Back to Site', href: '/', icon: ArrowLeft, external: true },
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings }
  ];

  const handleLogout = () => {
    logout();
  };

  // Show different dashboards based on user role
  const getDashboardContent = () => {
    if (!user) return <div>Please login first</div>;
    
    switch (user.role) {
      case 'customer':
        return <CustomerDashboard />;
      case 'vendor':
        return <VendorDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <CustomerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <a href="/" className="block mb-6">
              <h1 className="text-xl font-bold text-gray-900 hover:text-orange-600 transition-colors">Swift Fix Pro</h1>
            </a>
            
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href && !item.external;
                
                if (item.external) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className="flex items-center px-4 py-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100"
                    >
                      <item.icon size={20} className="mr-3" />
                      {item.name}
                    </a>
                  );
                }
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon size={20} className="mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg w-full"
              >
                <LogOut size={20} className="mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={getDashboardContent()} />
            <Route path="/profile" element={<div>Profile Page</div>} />
            <Route path="/settings" element={<div>Settings Page</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 