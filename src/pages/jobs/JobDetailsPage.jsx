import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, X, Clock, AlertCircle, User, MessageSquare, FileText, 
  CheckCircle, DollarSign, MapPin, Calendar, Phone, Camera, Video
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchJobDetails = useCallback(async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      setJob(response.job);
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      toast.error('Failed to load job details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [jobId, navigate]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const updatePaymentStatus = useCallback(async (reference) => {
    try {
      // Check if job is available
      if (!job || !job._id) {
        toast.error('Job data not loaded. Please refresh the page.');
        return;
      }
      
      // First try with the reference
      let response;
      if (reference) {
        try {
          response = await api.post('/hitpay/update-payment-status', {
            reference: reference,
            status: 'completed'
          });
        } catch (error) {
          // If reference fails, try updating by job ID
          response = await api.post('/hitpay/update-job-payment-status', {
            jobId: job._id,
            status: 'completed'
          });
        }
      } else {
        // No reference available, use job ID directly
        response = await api.post('/hitpay/update-job-payment-status', {
          jobId: job._id,
          status: 'completed'
        });
      }
      
      if (response?.success) {
        toast.success('Payment completed successfully!');
        // Refresh job data to get updated status
        setTimeout(() => {
          fetchJobDetails();
        }, 1000);
      } else {
        toast.error('Payment update failed. Please try again.');
      }
    } catch (error) {
      toast.error(`Failed to update payment status: ${error.message}`);
    }
  }, [fetchJobDetails, job]);

  // Handle payment success redirect
  useEffect(() => {
    // Only process payment success if job data is loaded
    if (!job) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment'); // Check for 'payment=success'
    const status = urlParams.get('status'); // Also check for 'status=completed'
    const reference = urlParams.get('reference');
    
    // Check for both possible success indicators
    if ((paymentStatus === 'success' || status === 'completed') && reference) {
      updatePaymentStatus(reference);
      // Clean up URL
      const url = new URL(window.location);
      url.search = '';
      window.history.replaceState({}, '', url);
    }
  }, [updatePaymentStatus, job]);

  const handleQuoteResponse = async (jobId, response) => {
    try {
      await api.customer.respondToQuote(jobId, { response });
      
      // Update the job status locally
      setJob(prev => ({ ...prev, status: response }));
      
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

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/hitpay/job-payment', {
        jobId: job._id,
        amount: job.totalAmount,
        description: `Payment for job: ${job.description || 'Property maintenance service'}`
      });

      // The response data might be directly on response or in response.data
      const responseData = response.data || response;

      if (responseData && responseData.payment_url) {
        // Redirect to HitPay payment page
        window.location.href = responseData.payment_url;
      } else {
        toast.error('Payment URL not received from server');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      assigned: User,
      in_discussion: MessageSquare,
      quote_sent: FileText,
      quote_accepted: CheckCircle,
      quote_rejected: X,
      paid: DollarSign,
      in_progress: Clock,
      completed: CheckCircle,
      cancelled: X
    };
    return icons[status.toLowerCase()] || Clock;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'ASSIGNED': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'IN_DISCUSSION': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'QUOTE_SENT': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'QUOTE_ACCEPTED': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'QUOTE_REJECTED': return 'bg-red-50 text-red-700 border-red-200';
      case 'PAID': return 'bg-green-50 text-green-700 border-green-200';
      case 'IN_PROGRESS': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'PENDING': return 'Waiting for admin review';
      case 'ASSIGNED': return 'Assigned to vendor';
      case 'IN_DISCUSSION': return 'Discussing details with vendor';
      case 'QUOTE_SENT': return 'Quote sent for approval';
      case 'QUOTE_ACCEPTED': return 'Quote accepted, vendor can start work';
      case 'QUOTE_REJECTED': return 'Quote rejected, discuss new quote with vendor';
      case 'PAID': return 'Payment completed, work scheduled';
      case 'IN_PROGRESS': return 'Work in progress';
      case 'COMPLETED': return 'Work completed successfully';
      case 'CANCELLED': return 'Job cancelled';
      default: return 'Unknown status';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="text-center bg-white p-8 rounded-xl shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h2>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(job.status);

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Page Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-orange-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="flex items-center space-x-3">
              <StatusIcon className="w-6 h-6 text-orange-100" />
              <div>
                <h1 className="text-2xl font-bold text-white">{job.title}</h1>
                <p className="text-orange-100">#{job.jobNumber}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium border bg-white ${getStatusColor(job.status).replace('bg-', 'bg-white ')}`}>
              {job.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Banner */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${getStatusColor(job.status)}`}>
                <StatusIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-xl text-gray-900">{job.status.replace('_', ' ')}</p>
                <p className="text-gray-600">{getStatusDescription(job.status)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-orange-600">
                ${job.totalAmount || job.vendorQuote?.amount || 'TBD'}
              </p>
              <p className="text-sm text-gray-500">Total Amount</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Job Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-orange-600" />
                Job Details
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Description</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">{job.description || 'No description provided'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-2">Category</label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-900 capitalize">{job.category}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-2">Created Date</label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-900">{new Date(job.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                {job.estimatedBudget && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-2">Your Estimated Budget</label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900">
                        ${job.estimatedBudget} <span className="text-gray-500 text-sm">(for reference only)</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Service Location */}
            {job.location && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-orange-600" />
                  Service Location
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-900 font-medium">{job.location.address}</p>
                      <p className="text-gray-600">
                        {job.location.city}
                        {job.location.state && `, ${job.location.state}`}
                        {job.location.zipCode && ` ${job.location.zipCode}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scheduled Time */}
            {job.requestedTimeSlot && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                  Scheduled Time
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-gray-900 font-medium">
                        {new Date(job.requestedTimeSlot.date).toLocaleDateString()}
                      </p>
                      {job.requestedTimeSlot.startTime && job.requestedTimeSlot.endTime && (
                        <p className="text-gray-600">
                          {job.requestedTimeSlot.startTime} - {job.requestedTimeSlot.endTime}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Uploaded Files */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-orange-600" />
                Uploaded Files
                <span className="text-sm text-gray-500 ml-2 font-normal">
                  (Images: {job.images?.length || 0}, Videos: {job.videos?.length || 0})
                </span>
              </h3>
              
              {/* Images */}
              {job.images && job.images.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Camera className="w-4 h-4 mr-1" />
                    Photos ({job.images.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {job.images.map((imageName, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`/uploads/order-attachments/${imageName}`}
                          alt={`Order attachment ${index + 1}`}
                          className="w-full h-28 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-80 transition-all hover:shadow-md"
                          onClick={() => handleImageClick(`/uploads/order-attachments/${imageName}`)}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjEzTTEyIDE3SDEyLjAxTTIxIDEyQzIxIDE2Ljk3MDYgMTYuOTcwNiAyMSAxMiAyMUM3LjAyOTQ0IDIxIDMgMTYuOTcwNiAzIDEyQzMgNy4wMjk0NCA3LjAyOTQ0IDMgMTIgM0MxNi45NzA2IDMgMjEgNy4wMjk0NCAyMSAxMloiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                            e.target.className = 'w-full h-28 object-contain rounded-xl border border-gray-200 bg-gray-50';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-xl flex items-center justify-center">
                          <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to view full size
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {job.videos && job.videos.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Video className="w-4 h-4 mr-1" />
                    Videos ({job.videos.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {job.videos.map((videoName, index) => (
                      <div key={index} className="relative">
                        <video
                          src={`/uploads/order-attachments/${videoName}`}
                          className="w-full h-36 object-cover rounded-xl border border-gray-200"
                          controls
                          preload="metadata"
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-lg">
                          {videoName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No files message */}
              {(!job.images || job.images.length === 0) && (!job.videos || job.videos.length === 0) && (
                <div className="text-center py-12">
                  <div className="text-gray-300 mb-3">
                    <Camera className="w-16 h-16 mx-auto" />
                  </div>
                  <p className="text-gray-500">No files were uploaded with this order</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Assigned Vendor */}
            {job.vendorId ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2 text-orange-600" />
                  Assigned Vendor
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {job.vendorId.firstName?.[0] || 'V'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-lg">
                        {job.vendorId.firstName} {job.vendorId.lastName}
                      </p>
                      {job.vendorId.email && (
                        <p className="text-gray-600 text-sm mt-1">{job.vendorId.email}</p>
                      )}
                      {job.vendorId.phone && (
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-1" />
                          {job.vendorId.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2 text-orange-600" />
                  Vendor Assignment
                </h3>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="flex items-center text-amber-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span>No vendor assigned yet</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing & Quote */}
            {(job.totalAmount || job.status === 'QUOTE_SENT' || job.status === 'QUOTE_ACCEPTED') && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-orange-600" />
                  Pricing & Quote
                </h3>
                
                {job.totalAmount ? (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-orange-800 font-medium">Vendor Quote:</span>
                      <span className="text-3xl font-bold text-orange-600">${job.totalAmount.toLocaleString()}</span>
                    </div>
                    
                    {job.status === 'QUOTE_SENT' && (
                      <div className="mt-4">
                        <p className="text-sm text-orange-600 mb-4">
                          ⏳ Waiting for your approval of this quote
                        </p>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleQuoteResponse(job._id, 'QUOTE_ACCEPTED')}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-sm font-medium shadow-md"
                          >
                            ✅ Accept Quote
                          </button>
                          <button
                            onClick={() => handleQuoteResponse(job._id, 'QUOTE_REJECTED')}
                            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                          >
                            ❌ Reject Quote
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {job.status === 'QUOTE_ACCEPTED' && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm text-green-600">
                          ✅ Quote accepted - Ready for payment
                        </p>
                        
                        <div className="bg-white rounded-lg p-4 border border-orange-300">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-orange-800 font-medium">Total Amount:</span>
                            <span className="text-xl font-bold text-orange-600">${job.totalAmount?.toLocaleString() || '0'}</span>
                          </div>
                          <button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-5 h-5 mr-2" />
                                Pay Now with HitPay
                              </>
                            )}
                          </button>
                          <p className="text-xs text-orange-600 mt-2 text-center">
                            Secure payment powered by HitPay
                          </p>
                        </div>
                        
                        {job.payment && job.payment.status === 'PAID' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-700 font-medium flex items-center">
                              ✅ Payment Completed
                            </p>
                            <p className="text-green-600 text-sm mt-1">
                              Work can now begin. The vendor has been notified.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {job.status === 'QUOTE_REJECTED' && (
                      <p className="text-sm text-red-600 mt-2">
                        ❌ Quote rejected - You can discuss a new quote with the vendor
                      </p>
                    )}
                  </div>
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
            )}

            {/* Payment Section */}
            {job.totalAmount && job.totalAmount > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-orange-600" />
                  Payment
                </h3>
                
                <div className="bg-white rounded-lg p-4 border border-orange-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-orange-800 font-medium">Total Amount:</span>
                    <span className="text-2xl font-bold text-orange-600">${job.totalAmount.toLocaleString()}</span>
                  </div>
                  
                  {job.status !== 'PAID' ? (
                    <>
                      <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-5 h-5 mr-2" />
                            Pay Now with HitPay
                          </>
                        )}
                      </button>
                      <p className="text-xs text-orange-600 mt-2 text-center">
                        Secure payment powered by HitPay
                      </p>
                    </>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-700 font-medium flex items-center">
                        ✅ Payment Completed
                      </p>
                      <p className="text-green-600 text-sm mt-1">
                        Payment has been processed successfully.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Information */}
            {job.payment && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-orange-600" />
                  Payment Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Status</span>
                    <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                      job.payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                      job.payment.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {job.payment.status}
                    </span>
                  </div>
                  {job.payment.method && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Method</span>
                      <span className="text-gray-900">{job.payment.method}</span>
                    </div>
                  )}
                  {job.payment.paidAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Paid On</span>
                      <span className="text-gray-900">
                        {new Date(job.payment.paidAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {job.payment.paidAmount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Amount</span>
                      <span className="text-gray-900 font-semibold">${job.payment.paidAmount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status History */}
        {job.statusHistory && job.statusHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-600" />
              Status History
            </h3>
            <div className="space-y-4">
              {job.statusHistory.slice().reverse().map((status, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">
                        {status.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(status.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {status.notes && (
                      <p className="text-sm text-gray-600 mt-2">{status.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailsPage;