import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Star, 
  Tag,
  Calendar,
  Filter,
  Package,
  ArrowRight,
  Info
} from 'lucide-react';

const PricingPage = () => {
  const [pricingPlans, setPricingPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  // 分类选项
  const categoryOptions = [
    { value: '', label: 'All Services' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'subscription', label: 'Subscription Plans' }
  ];

  // 计费周期标签
  const billingPeriodLabels = {
    'hour': 'Per Hour',
    'day': 'Per Day',
    'week': 'Per Week',
    'month': 'Per Month',
    'year': 'Per Year',
    'one-time': 'One-time'
  };

  // 获取价格方案数据
  useEffect(() => {
    const fetchPricingPlans = async () => {
      try {
        const response = await fetch('/api/cms/pricing');
        if (response.ok) {
          const data = await response.json();
          setPricingPlans(data);
          setFilteredPlans(data);
        }
      } catch (error) {
        console.error('Error fetching pricing plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPricingPlans();
  }, []);

  // 筛选价格方案
  useEffect(() => {
    let filtered = pricingPlans;

    if (selectedCategory) {
      filtered = filtered.filter(plan => plan.category === selectedCategory);
    }

    // 按受欢迎程度和价格排序
    filtered.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return a.order - b.order;
    });

    setFilteredPlans(filtered);
  }, [pricingPlans, selectedCategory]);

  // 计算折扣价格
  const calculateDiscountPrice = (plan) => {
    if (plan.discount?.percentage && plan.discount.validUntil) {
      const now = new Date();
      const validUntil = new Date(plan.discount.validUntil);
      if (now <= validUntil) {
        return plan.price * (1 - plan.discount.percentage / 100);
      }
    }
    return null;
  };

  // 检查折扣是否有效
  const isDiscountValid = (plan) => {
    if (!plan.discount?.percentage) return false;
    if (!plan.discount.validUntil) return true;
    return new Date() <= new Date(plan.discount.validUntil);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-orange-200" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Transparent Pricing
              </h1>
              <p className="text-xl text-orange-100 max-w-2xl mx-auto">
                Professional property maintenance services with clear, upfront pricing. No hidden fees.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 筛选区域 */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Filter by service:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-sm text-gray-600">
                {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 价格方案 */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {filteredPlans.length > 0 ? (
              <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
                {filteredPlans.map((plan, index) => {
                  const discountPrice = calculateDiscountPrice(plan);
                  const hasValidDiscount = isDiscountValid(plan);

                  return (
                    <motion.div
                      key={plan._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white rounded-lg shadow-lg overflow-hidden relative hover:shadow-xl transition-shadow ${
                        plan.isPopular ? 'ring-2 ring-orange-500 transform scale-105' : ''
                      }`}
                    >
                      {/* 热门标签 */}
                      {plan.isPopular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center">
                            <Star className="w-4 h-4 mr-1" />
                            Most Popular
                          </div>
                        </div>
                      )}

                      {/* 折扣标签 */}
                      {hasValidDiscount && (
                        <div className="absolute top-4 right-4">
                          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                            <Tag className="w-3 h-3 mr-1" />
                            {plan.discount.percentage}% OFF
                          </div>
                        </div>
                      )}

                      <div className="p-8">
                        {/* 方案头部 */}
                        <div className="text-center mb-6">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Package className="w-5 h-5 text-orange-600" />
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                              {categoryOptions.find(cat => cat.value === plan.category)?.label}
                            </span>
                          </div>
                          
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {plan.name}
                          </h3>
                          
                          <p className="text-gray-600 mb-4">
                            {plan.description}
                          </p>

                          {/* 价格 */}
                          <div className="mb-6">
                            <div className="flex items-center justify-center gap-2">
                              {hasValidDiscount && discountPrice ? (
                                <>
                                  <span className="text-3xl font-bold text-orange-600">
                                    {plan.currency} {discountPrice.toFixed(2)}
                                  </span>
                                  <span className="text-lg text-gray-500 line-through">
                                    {plan.currency} {plan.price}
                                  </span>
                                </>
                              ) : (
                                <span className="text-3xl font-bold text-gray-900">
                                  {plan.currency} {plan.price}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {billingPeriodLabels[plan.billingPeriod]}
                            </div>
                            
                            {/* 价格范围 */}
                            {(plan.priceRange?.min || plan.priceRange?.max) && (
                              <div className="text-xs text-gray-400 mt-2">
                                Range: {plan.currency} {plan.priceRange.min || '0'} - {plan.currency} {plan.priceRange.max || '∞'}
                              </div>
                            )}
                          </div>

                          {/* 折扣信息 */}
                          {hasValidDiscount && plan.discount.description && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                              <div className="flex items-center justify-center text-red-800 text-sm">
                                <Info className="w-4 h-4 mr-1" />
                                {plan.discount.description}
                              </div>
                              {plan.discount.validUntil && (
                                <div className="flex items-center justify-center text-red-600 text-xs mt-1">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Valid until {new Date(plan.discount.validUntil).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 功能列表 */}
                        {plan.features && plan.features.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3">What's included:</h4>
                            <ul className="space-y-2">
                              {plan.features.map((feature, featureIndex) => (
                                <li key={featureIndex} className="flex items-start">
                                  {feature.included ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                  )}
                                  <div>
                                    <span className={feature.included ? 'text-gray-700' : 'text-gray-500 line-through'}>
                                      {feature.name}
                                    </span>
                                    {feature.description && (
                                      <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 包含项目 */}
                        {plan.inclusions && plan.inclusions.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Includes:</h4>
                            <ul className="space-y-1">
                              {plan.inclusions.map((inclusion, inclusionIndex) => (
                                <li key={inclusionIndex} className="flex items-center text-sm text-gray-600">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                  {inclusion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 不包含项目 */}
                        {plan.exclusions && plan.exclusions.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Not included:</h4>
                            <ul className="space-y-1">
                              {plan.exclusions.map((exclusion, exclusionIndex) => (
                                <li key={exclusionIndex} className="flex items-center text-sm text-gray-500">
                                  <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                                  {exclusion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* CTA按钮 */}
                        <div className="space-y-3">
                          <Link
                            to="/booking"
                            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                              plan.isPopular
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                          >
                            Book Now
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                          
                          <Link
                            to="/contact"
                            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                          >
                            Get Quote
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              // 无结果状态
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Plans Available</h3>
                <p className="text-gray-600 mb-6">
                  {selectedCategory
                    ? `No pricing plans found for "${categoryOptions.find(cat => cat.value === selectedCategory)?.label}".`
                    : "No pricing plans are available at the moment."
                  }
                </p>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    View All Plans
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 为什么选择我们 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose Our Services?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Transparent Pricing</h3>
                <p className="text-gray-600">
                  No hidden fees or surprise charges. What you see is what you pay.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Quality Guarantee</h3>
                <p className="text-gray-600">
                  100% satisfaction guarantee with professional workmanship and quality materials.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Flexible Scheduling</h3>
                <p className="text-gray-600">
                  Book services at your convenience with flexible timing options.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="py-16 bg-orange-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Choose the perfect plan for your needs or contact us for a custom quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking"
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              Book Service Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
            >
              Get Custom Quote
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;