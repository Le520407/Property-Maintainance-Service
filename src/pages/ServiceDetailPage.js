import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Calendar,
  ArrowLeft,
  CheckCircle,
  Shield,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const ServiceDetailPage = () => {
  const { id } = useParams();
  const [selectedTab, setSelectedTab] = useState('overview');

  // 模拟服务数据
  const service = {
    id: parseInt(id),
    name: '管道维修服务',
    price: 200,
    duration: '2-4小时',
    rating: 4.8,
    reviews: 156,
    description: '专业管道维修服务，包括管道疏通、漏水修复、管道更换等。我们的专业团队拥有丰富的经验，能够快速解决各种管道问题。',
    features: [
      '24小时紧急服务',
      '专业工具设备',
      '质保期服务',
      '透明定价',
      '专业团队',
      '快速响应'
    ],
    process: [
      {
        step: 1,
        title: '预约服务',
        description: '通过电话或在线预约，描述问题'
      },
      {
        step: 2,
        title: '上门检查',
        description: '专业师傅上门检查，确定问题'
      },
      {
        step: 3,
        title: '报价确认',
        description: '提供详细报价，客户确认后开始工作'
      },
      {
        step: 4,
        title: '完成服务',
        description: '完成维修工作，客户验收'
      }
    ],
    vendor: {
      name: '专业管道维修公司',
      rating: 4.9,
      reviews: 234,
      experience: '8年',
      location: '北京市朝阳区',
      phone: '400-123-4567',
      description: '专业从事管道维修服务8年，拥有专业团队和先进设备，服务过数千客户，获得广泛好评。'
    },
    reviews: [
      {
        id: 1,
        user: '张先生',
        rating: 5,
        date: '2024-01-15',
        comment: '服务很专业，师傅技术很好，很快就解决了问题。'
      },
      {
        id: 2,
        user: '李女士',
        rating: 5,
        date: '2024-01-10',
        comment: '价格合理，服务态度很好，推荐！'
      },
      {
        id: 3,
        user: '王先生',
        rating: 4,
        date: '2024-01-05',
        comment: '响应速度快，技术专业，值得信赖。'
      }
    ]
  };

  const tabs = [
    { id: 'overview', name: '服务概览' },
    { id: 'process', name: '服务流程' },
    { id: 'vendor', name: '供应商信息' },
    { id: 'reviews', name: '用户评价' }
  ];

  const handleBooking = () => {
    toast.success('正在跳转到预订页面...');
    // 这里可以跳转到预订页面
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link to="/services" className="flex items-center text-gray-600 hover:text-blue-600">
            <ArrowLeft size={16} className="mr-2" />
            返回服务列表
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{service.name}</h1>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={`${
                          i < Math.floor(service.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 ml-2">
                    {service.rating} ({service.reviews} 条评价)
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    ¥{service.price}
                  </div>
                  <div className="text-sm text-gray-500">起价</div>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Clock className="text-blue-500 mr-3" size={20} />
                  <span className="text-gray-600">服务时长: {service.duration}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="text-blue-500 mr-3" size={20} />
                  <span className="text-gray-600">服务区域: 北京市</span>
                </div>
              </div>
            </motion.div>

            {/* Service Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold mb-4">服务特点</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {service.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="text-green-500 mr-3" size={20} />
                    <span className="text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Service Details Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg"
            >
              {/* Tab Navigation */}
              <div className="border-b">
                <div className="flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        selectedTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {selectedTab === 'overview' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">服务概览</h3>
                    <div className="space-y-4">
                      <p className="text-gray-600 leading-relaxed">
                        我们提供专业的管道维修服务，包括但不限于：
                      </p>
                      <ul className="space-y-2 text-gray-600">
                        <li>• 管道疏通服务</li>
                        <li>• 漏水检测与修复</li>
                        <li>• 管道更换与安装</li>
                        <li>• 下水道清理</li>
                        <li>• 管道维护保养</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedTab === 'process' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">服务流程</h3>
                    <div className="space-y-6">
                      {service.process.map((step) => (
                        <div key={step.step} className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-4">
                            {step.step}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{step.title}</h4>
                            <p className="text-gray-600 mt-1">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTab === 'vendor' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">供应商信息</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{service.vendor.name}</h4>
                        <div className="flex items-center">
                          <div className="flex items-center mr-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={`${
                                  i < Math.floor(service.vendor.rating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {service.vendor.rating} ({service.vendor.reviews})
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <User className="text-blue-500 mr-3" size={20} />
                          <span className="text-gray-600">经验: {service.vendor.experience}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="text-blue-500 mr-3" size={20} />
                          <span className="text-gray-600">{service.vendor.location}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600">{service.vendor.description}</p>
                      
                      <div className="flex items-center">
                        <Phone className="text-blue-500 mr-3" size={20} />
                        <span className="text-gray-600">{service.vendor.phone}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'reviews' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">用户评价</h3>
                    <div className="space-y-6">
                      {service.reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{review.user}</span>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          <div className="flex items-center mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={`${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-600">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Booking Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h3 className="text-xl font-semibold mb-4">立即预订</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">服务价格</span>
                  <span className="font-semibold">¥{service.price} 起</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">服务时长</span>
                  <span className="font-semibold">{service.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">响应时间</span>
                  <span className="font-semibold">2小时内</span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                立即预订
              </button>

              <div className="mt-4 text-center">
                <Link to="/contact" className="text-blue-600 hover:underline text-sm">
                  需要咨询？联系我们
                </Link>
              </div>
            </div>

            {/* Service Guarantee */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="mr-2 text-green-500" />
                服务保障
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">专业团队</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">质保服务</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">透明定价</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">快速响应</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Phone className="mr-2 text-blue-500" />
                联系信息
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone className="text-gray-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">{service.vendor.phone}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="text-gray-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">{service.vendor.location}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="text-gray-500 mr-3" size={16} />
                  <span className="text-sm text-gray-600">24小时服务</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage; 