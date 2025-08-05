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
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Dashboard Components
const CustomerDashboard = () => {
  const stats = [
    { title: '总订单', value: '12', icon: Package, color: 'bg-blue-500' },
    { title: '待处理', value: '3', icon: Calendar, color: 'bg-yellow-500' },
    { title: '已完成', value: '9', icon: Star, color: 'bg-green-500' },
    { title: '总消费', value: '¥2,450', icon: DollarSign, color: 'bg-purple-500' }
  ];

  const recentOrders = [
    { id: 1, service: '管道维修', status: '已完成', date: '2024-01-15', amount: '¥350' },
    { id: 2, service: '电气检查', status: '进行中', date: '2024-01-18', amount: '¥200' },
    { id: 3, service: '清洁服务', status: '待确认', date: '2024-01-20', amount: '¥150' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">客户仪表盘</h1>
      
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
        <h2 className="text-xl font-semibold mb-4">最近订单</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">服务</th>
                <th className="text-left py-3">状态</th>
                <th className="text-left py-3">日期</th>
                <th className="text-left py-3">金额</th>
                <th className="text-left py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{order.service}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === '已完成' ? 'bg-green-100 text-green-800' :
                      order.status === '进行中' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3">{order.date}</td>
                  <td className="py-3">{order.amount}</td>
                  <td className="py-3">
                    <button className="text-blue-600 hover:underline">查看详情</button>
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
    { title: '总收入', value: 'SGD 8,450', icon: DollarSign, color: 'bg-green-500' },
    { title: '本月订单', value: '28', icon: Package, color: 'bg-blue-500' },
    { title: '客户评分', value: '4.8', icon: Star, color: 'bg-yellow-500' },
    { title: '活跃客户', value: '45', icon: Users, color: 'bg-purple-500' },
    { title: '本月佣金', value: 'SGD 1,267', icon: TrendingUp, color: 'bg-indigo-500' },
    { title: '完成率', value: '94%', icon: CheckCircle, color: 'bg-emerald-500' }
  ];

  const subscriptionInfo = {
    plan: '专业版',
    status: '活跃',
    nextBilling: '2024-02-15',
    features: ['高级CRM', '详细分析', '自定义报价模板', '优先支持']
  };

  const recentJobs = [
    { id: 1, customer: '张先生', service: '管道维修', status: '进行中', amount: 'SGD 350', commission: 'SGD 52.50' },
    { id: 2, customer: '李女士', service: '电气检查', status: '已完成', amount: 'SGD 200', commission: 'SGD 30.00' },
    { id: 3, customer: '王先生', service: '清洁服务', status: '待确认', amount: 'SGD 150', commission: 'SGD 22.50' }
  ];

  const upcomingTraining = [
    { title: '客户服务技巧', date: '2024-01-25', duration: '2小时', type: '在线课程' },
    { title: '财务管理基础', date: '2024-01-30', duration: '3小时', type: '在线课程' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">供应商仪表盘</h1>
      
      {/* Subscription Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-md"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">订阅状态</h2>
            <p className="text-blue-100">当前计划: {subscriptionInfo.plan}</p>
            <p className="text-blue-100">下次账单: {subscriptionInfo.nextBilling}</p>
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
          <h2 className="text-xl font-semibold mb-4">最近工作</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">客户</th>
                  <th className="text-left py-3">服务</th>
                  <th className="text-left py-3">状态</th>
                  <th className="text-left py-3">金额</th>
                  <th className="text-left py-3">佣金</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{job.customer}</td>
                    <td className="py-3">{job.service}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        job.status === '已完成' ? 'bg-green-100 text-green-800' :
                        job.status === '进行中' ? 'bg-blue-100 text-blue-800' :
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
          <h2 className="text-xl font-semibold mb-4">即将到来的培训</h2>
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
                    加入
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">快速操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium">安排工作</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium">创建报价</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageSquare className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium">客户沟通</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium">查看报告</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const stats = [
    { title: '总用户', value: '1,234', icon: Users, color: 'bg-blue-500' },
    { title: '总供应商', value: '89', icon: Building, color: 'bg-green-500' },
    { title: '本月收入', value: '¥45,680', icon: DollarSign, color: 'bg-purple-500' },
    { title: '待审核', value: '12', icon: FileText, color: 'bg-yellow-500' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">管理员仪表盘</h1>
      
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
          <h2 className="text-xl font-semibold mb-4">快速操作</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              审核供应商申请
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              查看系统报告
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              管理用户账户
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">系统状态</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>服务器状态</span>
              <span className="text-green-600">正常</span>
            </div>
            <div className="flex justify-between">
              <span>数据库连接</span>
              <span className="text-green-600">正常</span>
            </div>
            <div className="flex justify-between">
              <span>支付系统</span>
              <span className="text-green-600">正常</span>
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
    { name: '仪表盘', href: '/dashboard', icon: Home },
    { name: '个人资料', href: '/dashboard/profile', icon: User },
    { name: '设置', href: '/dashboard/settings', icon: Settings }
  ];

  const handleLogout = () => {
    logout();
  };

  // 根据用户角色显示不同的仪表盘
  const getDashboardContent = () => {
    if (!user) return <div>请先登录</div>;
    
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-6">Swift Fix Pro</h1>
            
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
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
                退出登录
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={getDashboardContent()} />
            <Route path="/profile" element={<div>个人资料页面</div>} />
            <Route path="/settings" element={<div>设置页面</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 