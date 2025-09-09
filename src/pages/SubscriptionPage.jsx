import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Star, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp,
  Award,
  Headphones,
  FileText,
  BarChart3,
  Settings,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SubscriptionPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('professional');

  const plans = [
    {
      id: 'basic',
      name: '基础版',
      price: '免费',
      period: '永久',
      description: '适合刚开始的技术员',
      features: [
        '基础工作跟踪',
        '客户管理（最多50个）',
        '简单报价模板',
        '基础报告',
        '邮件支持'
      ],
      limitations: [
        '最多同时处理5个工作',
        '无高级分析',
        '无自定义品牌'
      ],
      color: 'border-gray-300',
      bgColor: 'bg-gray-50',
      buttonColor: 'bg-gray-600 hover:bg-gray-700'
    },
    {
      id: 'professional',
      name: '专业版',
      price: 'SGD 29',
      period: '/月',
      description: '适合成长中的技术员',
      features: [
        '高级CRM系统',
        '详细分析和报告',
        '自定义报价模板',
        '无限客户管理',
        '工作调度优化',
        '移动应用访问',
        '优先客户支持',
        '技能培训课程'
      ],
      limitations: [
        '最多同时处理20个工作',
        '无团队管理功能'
      ],
      color: 'border-orange-500',
      bgColor: 'bg-orange-50',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
      popular: true
    },
    {
      id: 'enterprise',
      name: '企业版',
      price: 'SGD 99',
      period: '/月',
      description: '适合团队和大型企业',
      features: [
        '团队管理（最多10人）',
        '高级分析仪表板',
        'API访问',
        '自定义集成',
        '专属客户经理',
        '高级培训课程',
        '合同管理',
        '财务报告',
        '24/7电话支持',
        '白标解决方案'
      ],
      limitations: [
        '无限制工作数量',
        '无限制团队成员'
      ],
      color: 'border-purple-500',
      bgColor: 'bg-purple-50',
      buttonColor: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: '收入增长',
      description: '通过平台获得更多客户，平均收入增长40%'
    },
    {
      icon: Award,
      title: '专业认证',
      description: '获得行业认可的技能认证和徽章'
    },
    {
      icon: Users,
      title: '社区支持',
      description: '加入技术员社区，分享经验和最佳实践'
    },
    {
      icon: Shield,
      title: '保险保障',
      description: '工作责任保险和意外伤害保障'
    }
  ];

  const trainingCourses = [
    {
      title: '客户服务技巧',
      duration: '2小时',
      level: '初级',
      certificate: true
    },
    {
      title: '财务管理基础',
      duration: '3小时',
      level: '中级',
      certificate: true
    },
    {
      title: '数字营销策略',
      duration: '4小时',
      level: '高级',
      certificate: true
    },
    {
      title: '团队管理',
      duration: '5小时',
      level: '高级',
      certificate: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            选择适合您的计划
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-orange-100 max-w-2xl mx-auto"
          >
            从基础工具到企业级解决方案，我们为每个阶段的技术员提供支持
          </motion.p>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${plan.bgColor} border-2 ${plan.color} rounded-lg p-8 ${
                  plan.popular ? 'ring-4 ring-orange-200' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      最受欢迎
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <h4 className="font-semibold text-gray-900">包含功能:</h4>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.limitations && (
                  <div className="space-y-2 mb-8">
                    <h4 className="font-semibold text-gray-900">限制:</h4>
                    {plan.limitations.map((limitation, idx) => (
                      <div key={idx} className="flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                        <span className="text-gray-600 text-sm">{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className={`w-full ${plan.buttonColor} text-white py-3 px-6 rounded-lg font-semibold transition-colors`}
                >
                  {plan.id === 'basic' ? '开始使用' : '选择计划'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">为什么选择我们？</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              我们不仅提供工具，更致力于帮助技术员成长和成功
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">技能培训课程</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              提升您的专业技能和商业知识，获得行业认可的认证
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trainingCourses.map((course, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{course.title}</h3>
                  {course.certificate && (
                    <Award className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>时长: {course.duration}</p>
                  <p>级别: {course.level}</p>
                </div>
                <button className="w-full mt-4 bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors">
                  开始学习
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Billing Management Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Subscription Management
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Manage your subscription, view billing history, and update your plan preferences
            </p>
          </motion.div>
          
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-lg shadow-md text-center"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing History</h3>
              <p className="text-gray-600 mb-4">
                View all your payment transactions, invoices, and billing details
              </p>
              <Link
                to="/subscription/billing-history"
                className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View History
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-lg shadow-md text-center"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Plan</h3>
              <p className="text-gray-600 mb-4">
                Upgrade, downgrade, or cancel your subscription with prorated billing
              </p>
              <Link
                to="/subscription/manage"
                className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Manage Plan
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-md text-center"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Analytics</h3>
              <p className="text-gray-600 mb-4">
                Track your service usage and optimize your subscription plan
              </p>
              <Link
                to="/customer/dashboard"
                className="inline-flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Analytics
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-orange-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              准备好开始您的成功之旅了吗？
            </h2>
            <p className="text-orange-100 mb-8 max-w-2xl mx-auto">
              加入东南亚最受信任的维护服务网络，与我们一起成长
            </p>
            <div className="space-x-4">
              <Link
                to="/register"
                className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                立即注册
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
              >
                联系我们
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionPage; 