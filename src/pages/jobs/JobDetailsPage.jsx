import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  DollarSign,
  Clock,
  MessageSquare,
  CreditCard,
  Star,
  CheckCircle,
  AlertCircle,
  Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import JobChat from '../../components/communication/JobChat';
import JobProgressTracker from '../../components/jobs/JobProgressTracker';
import FeedbackRatingModal from '../../components/jobs/FeedbackRatingModal';
import toast from 'react-hot-toast';

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const isCustomer = user?.role === 'customer';
  const isVendor = user?.role === 'vendor' || user?.role === 'technician';

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      // Try to fetch from API
      try {
        const response = await api.get(`/jobs/${jobId}`);
        setJob(response.data.job || response.data);
      } catch (apiError) {
        console.log('Jobs API not available, using sample data');
        
        // Generate sample job data
        const sampleJob = {
          _id: jobId,
          jobNumber: `JOB-${jobId.slice(-6).toUpperCase()}`,
          title: 'Kitchen Sink Repair',
          description: 'Kitchen sink has been leaking from under the basin. Need professional plumber to fix the issue.',
          category: 'Plumbing',
          status: isCustomer ? 'ACCEPTED' : 'IN_PROGRESS',
          priority: 'MEDIUM',
          totalAmount: 250,
          estimatedBudget: 250,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          
          // Customer info
          customerId: isVendor ? {
            _id: 'customer_123',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@email.com',
            phone: '+65 9123 4567'
          } : {
            _id: user._id,
            firstName: user.firstName || 'Current',
            lastName: user.lastName || 'Customer',
            email: user.email,
            phone: user.phone || '+65 9123 4567'
          },
          
          // Vendor info
          vendorId: isCustomer ? {
            _id: 'vendor_456',
            firstName: 'Mike',
            lastName: 'Wilson',
            email: 'mike.wilson@plumber.com',
            phone: '+65 8765 4321',
            companyName: 'Wilson Plumbing Services',
            rating: 4.8,
            completedJobs: 127
          } : {
            _id: user._id,
            firstName: user.firstName || 'Current',
            lastName: user.lastName || 'Vendor',
            email: user.email,
            phone: user.phone || '+65 8765 4321',
            companyName: user.companyName || 'My Services',
            rating: 4.8,
            completedJobs: 127
          },
          
          location: {
            address: '123 Orchard Road, #05-12, Singapore 238858',
            city: 'Singapore',
            postalCode: '238858',
            coordinates: { lat: 1.3048, lng: 103.8318 }
          },
          
          preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          preferredTime: '14:00',
          
          // Quote information
          vendorQuote: {
            amount: 250,
            description: 'Professional sink repair including parts and labor',
            breakdown: [
              { item: 'Faucet replacement parts', quantity: 1, unitPrice: 80 },
              { item: 'Labor (2 hours)', quantity: 2, unitPrice: 85 }
            ],
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            includes: ['Professional service', 'Quality parts', 'Cleanup', '6-month warranty'],
            terms: 'Payment upon completion. 6-month warranty on parts and labor.'
          },
          
          // Additional fields
          requirements: 'Please bring drop cloths and cleaning supplies',
          images: [],
          materials: ['Faucet parts', 'Pipe sealant', 'Basic tools'],
          
          // Payment info
          paymentStatus: 'PAID',
          paymentMethod: 'Credit Card',
          paymentDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        };
        
        setJob(sampleJob);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleJobUpdate = (updatedJob) => {
    setJob(prev => ({ ...prev, ...updatedJob }));
  };

  const handleFeedbackSubmitted = (feedback) => {
    setJob(prev => ({ 
      ...prev, 
      status: 'CLOSED',
      customerFeedback: feedback 
    }));
    setShowFeedbackModal(false);
    toast.success('Thank you for your feedback!');
  };

  const handleQuoteResponse = async (jobId, response) => {
    try {
      console.log('Responding to quote:', { jobId, response });
      
      const result = await api.customer.respondToQuote(jobId, { response });
      
      setJob(prev => ({ 
        ...prev, 
        status: response 
      }));
      
      if (response === 'QUOTE_ACCEPTED') {
        toast.success('Quote accepted! The vendor can now start work.');
      } else {
        toast.success('Quote rejected. You can discuss with the vendor for a new quote.');
      }
      
    } catch (error) {
      console.error('Error responding to quote:', error);
      toast.error(`Failed to ${response === 'QUOTE_ACCEPTED' ? 'accept' : 'reject'} quote: ${error.response?.data?.message || error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': 
      case 'CLOSED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'QUOTE_ACCEPTED':
      case 'ACCEPTED':
      case 'PAID':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'QUOTE_SENT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'QUOTE_REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ASSIGNED': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PENDING': 
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED': 
        return 'bg-red-100 text-red-800 border-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canShowProgress = job && (job.status === 'PAID' || job.status === 'IN_PROGRESS' || job.status === 'COMPLETED' || job.status === 'CLOSED');
  const canShowFeedback = job && isCustomer && (job.status === 'COMPLETED' || job.status === 'CLOSED');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600 mt-2">Job #{job.jobNumber}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(job.status)}`}>
                {job.status.replace('_', ' ')}
              </span>
              
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Job Details
              </button>
              
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'chat'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Messages
              </button>
              
              {canShowProgress && (
                <button
                  onClick={() => setActiveTab('progress')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'progress'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Progress
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'details' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Job Details</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700">{job.description}</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Category</h3>
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-700">{job.category}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Priority</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        job.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {job.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Location</h3>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-1" />
                      <span className="text-gray-700">{job.location.address}</span>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Preferred Date</h3>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-700">
                          {new Date(job.preferredDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Preferred Time</h3>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-700">{job.preferredTime}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quote Details */}
                  {job.vendorQuote && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Quote Details</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="text-2xl font-bold text-green-600">${job.vendorQuote.amount}</span>
                        </div>
                        
                        {job.vendorQuote.breakdown && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Breakdown:</h4>
                            <div className="space-y-1">
                              {job.vendorQuote.breakdown.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-700">
                                    {item.item} × {item.quantity}
                                  </span>
                                  <span className="text-gray-900">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-600">
                          <p className="mb-2">{job.vendorQuote.description}</p>
                          <p>Valid until: {new Date(job.vendorQuote.validUntil).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <div className="bg-white rounded-lg shadow-md h-[600px]">
                <JobChat
                  job={job}
                  onJobUpdate={handleJobUpdate}
                  hideHeader={true}
                />
              </div>
            )}

            {activeTab === 'progress' && canShowProgress && (
              <JobProgressTracker
                job={job}
                onJobUpdate={handleJobUpdate}
                onShowFeedback={() => setShowFeedbackModal(true)}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isCustomer ? 'Service Provider' : 'Customer'} Details
              </h3>
              
              {isCustomer ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {job.vendorId.firstName} {job.vendorId.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{job.vendorId.companyName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-3 text-yellow-400" />
                    <div>
                      <p className="font-medium text-gray-900">{job.vendorId.rating}/5</p>
                      <p className="text-sm text-gray-600">{job.vendorId.completedJobs} completed jobs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-3 text-gray-400" />
                    <a
                      href={`tel:${job.vendorId.phone}`}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      {job.vendorId.phone}
                    </a>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-3 text-gray-400" />
                    <a
                      href={`mailto:${job.vendorId.email}`}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      {job.vendorId.email}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {job.customerId.firstName} {job.customerId.lastName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-3 text-gray-400" />
                    <a
                      href={`tel:${job.customerId.phone}`}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      {job.customerId.phone}
                    </a>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-3 text-gray-400" />
                    <a
                      href={`mailto:${job.customerId.email}`}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      {job.customerId.email}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Information */}
            {(job.totalAmount || job.status === 'QUOTE_SENT' || job.status === 'QUOTE_ACCEPTED' || job.status === 'PAID') && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pricing & Quote
                </h3>
                
                <div className="space-y-4">
                  {job.totalAmount ? (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-800 font-medium">Vendor Quote:</span>
                          <span className="text-2xl font-bold text-blue-600">${job.totalAmount.toLocaleString()}</span>
                        </div>
                        {job.status === 'QUOTE_SENT' && (
                          <div className="mt-4">
                            <p className="text-sm text-blue-600 mb-3">
                              ⏳ Waiting for your approval of this quote
                            </p>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleQuoteResponse(job._id, 'QUOTE_ACCEPTED')}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              >
                                ✅ Accept Quote
                              </button>
                              <button
                                onClick={() => handleQuoteResponse(job._id, 'QUOTE_REJECTED')}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                              >
                                ❌ Reject Quote
                              </button>
                            </div>
                          </div>
                        )}
                        {job.status === 'QUOTE_ACCEPTED' && (
                          <p className="text-sm text-green-600 mt-2">
                            ✅ Quote accepted - Vendor can now start work
                          </p>
                        )}
                        {job.status === 'QUOTE_REJECTED' && (
                          <p className="text-sm text-red-600 mt-2">
                            ❌ Quote rejected - You can discuss a new quote with the vendor
                          </p>
                        )}
                      </div>
                      
                      {job.estimatedBudget && job.totalAmount !== job.estimatedBudget && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Your estimated budget:</span>
                          <span>${job.estimatedBudget}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Vendor Quote:</span>
                        <span className="text-gray-500">Pending</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        The vendor is reviewing your request and will provide a quote soon.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('chat')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </button>
                
                {canShowFeedback && !job.customerFeedback && (
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Leave Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Modal */}
        <FeedbackRatingModal
          job={job}
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onSubmitted={handleFeedbackSubmitted}
        />
      </div>
    </div>
  );
};

export default JobDetailsPage;