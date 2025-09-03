import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  User, 
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const BookingPage = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const services = [
    { id: 'plumbing', name: '管道维修', specialty: 'Emergency available', certification: 'Licensed' },
    { id: 'electrical', name: '电气维修', specialty: 'Safety certified', certification: 'Qualified' },
    { id: 'cleaning', name: '清洁服务', specialty: 'Eco-friendly', certification: 'Insured' },
    { id: 'gardening', name: '园艺维护', specialty: 'Plant care expert', certification: 'Experienced' },
    { id: 'painting', name: '油漆装饰', specialty: 'Premium paints', certification: 'Professional' },
    { id: 'hvac', name: '空调维修', specialty: 'All brands', certification: 'Certified tech' }
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const onSubmit = async (data) => {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error('请填写完整的预订信息');
      return;
    }

    setIsSubmitting(true);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Booking data:', { ...data, service: selectedService, date: selectedDate, time: selectedTime });
    toast.success('预订成功！我们会尽快与您联系确认。');
    setIsSubmitted(true);
    setIsSubmitting(false);
    reset();
    
    // 3秒后重置提交状态
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">预订成功！</h2>
          <p className="text-gray-600 mb-4">感谢您的预订，我们会尽快与您联系确认服务详情。</p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
          >
            继续预订
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              预订服务
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              选择您需要的服务，我们会安排专业团队为您提供优质服务
            </p>
          </motion.div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Service Selection */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white p-8 rounded-lg shadow-lg"
              >
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <FileText className="mr-2" />
                  选择服务
                </h2>

                <div className="space-y-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedService === service.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{service.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {service.specialty} | {service.certification}
                          </p>
                        </div>
                        {selectedService === service.id && (
                          <CheckCircle className="text-orange-500" size={20} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Date and Time Selection */}
                <div className="mt-8 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择日期 *
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getMinDate()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择时间 *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 border rounded-lg text-sm transition-colors ${
                            selectedTime === time
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white p-8 rounded-lg shadow-lg"
              >
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <User className="mr-2" />
                  联系信息
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        姓名 *
                      </label>
                      <input
                        type="text"
                        {...register('name', { required: '请输入姓名' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="请输入您的姓名"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        电话 *
                      </label>
                      <input
                        type="tel"
                        {...register('phone', { 
                          required: '请输入电话号码',
                          pattern: {
                            value: /^1[3-9]\d{9}$/,
                            message: '请输入有效的手机号码'
                          }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="请输入您的电话号码"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      {...register('email', {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: '请输入有效的邮箱地址'
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="请输入您的邮箱地址（可选）"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      服务地址 *
                    </label>
                    <textarea
                      {...register('address', { required: '请输入服务地址' })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="请输入详细的服务地址"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      服务描述
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="请详细描述您的服务需求..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        提交中...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        确认预订
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>

            {/* Booking Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-12 bg-orange-50 p-6 rounded-lg"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <AlertCircle className="mr-2 text-orange-600" />
                预订须知
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p className="mb-2"><strong>服务时间：</strong>周一至周日 8:00-18:00</p>
                  <p className="mb-2"><strong>预约确认：</strong>我们会在2小时内与您联系确认</p>
                </div>
                <div>
                  <p className="mb-2"><strong>质量保证：</strong>所有服务提供质量保障</p>
                  <p className="mb-2"><strong>取消政策：</strong>提前24小时取消不收取费用</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookingPage; 