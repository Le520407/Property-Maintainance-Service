import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, X, Clock, AlertCircle, User, MessageSquare, FileText, 
  CheckCircle, DollarSign, MapPin, Calendar, Phone, Camera, Video,
  Package, TrendingUp, Shield, History, Send
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
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
  };

  const handleQuoteResponse = async (jobId, response) => {
    try {
      const result = await api.customer.respondToQuote(jobId, { response });
      
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
      case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'ASSIGNED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_DISCUSSION': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'QUOTE_SENT': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'QUOTE_ACCEPTED': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'QUOTE_REJECTED': return 'bg-red-50 text-red-700 border-red-200';
      case 'PAID': return 'bg-green-50 text-green-700 border-green-200';
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-200';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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
    <div className="min-h-screen bg-gray-50 pt-8">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="flex items-center space-x-3">
              <StatusIcon className="w-6 h-6 text-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <p className="text-gray-600">#{job.jobNumber}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(job.status)}`}>
              {job.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Banner */}
        <div className={`rounded-lg p-4 mb-6 border-l-4 ${getStatusColor(job.status)} border-l-current`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">{job.status.replace('_', ' ')}</p>
              <p className="text-sm opacity-90">{getStatusDescription(job.status)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                ${job.totalAmount || job.vendorQuote?.amount || 'TBD'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Job Details */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Description</label>
                  <p className="text-gray-900">{job.description || 'No description provided'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Category</label>
                    <p className="text-gray-900 capitalize">{job.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Created Date</label>
                    <p className="text-gray-900">{new Date(job.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {job.estimatedBudget && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Your Estimated Budget</label>
                    <p className="text-gray-900">
                      ${job.estimatedBudget} <span className="text-gray-500 text-sm">(for reference only)</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Service Location */}
            {job.location && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Location</h3>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-900">{job.location.address}</p>
                    <p className="text-gray-600">
                      {job.location.city}
                      {job.location.state && `, ${job.location.state}`}
                      {job.location.zipCode && ` ${job.location.zipCode}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Scheduled Time */}
            {job.requestedTimeSlot && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Time</h3>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-gray-900">
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
            )}

            {/* Uploaded Files */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Uploaded Files
                <span className="text-xs text-gray-500 ml-2">
                  (Images: {job.images?.length || 0}, Videos: {job.videos?.length || 0})
                </span>
              </h3>
              
              {/* Images */}
              {job.images && job.images.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Camera className="w-4 h-4 mr-1" />
                    Photos ({job.images.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {job.images.map((imageName, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`/uploads/order-attachments/${imageName}`}
                          alt={`Order attachment ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(`/uploads/order-attachments/${imageName}`)}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjEzTTEyIDE3SDEyLjAxTTIxIDEyQzIxIDE2Ljk3MDYgMTYuOTcwNiAyMSAxMiAyMUM3LjAyOTQ0IDIxIDMgMTYuOTcwNiAzIDEyQzMgNy4wMjk0NCA3LjAyOTQ0IDMgMTIgM0MxNi45NzA2IDMgMjEgNy4wMjk0NCAyMSAxMloiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                            e.target.className = 'w-full h-24 object-contain rounded-lg border border-gray-200 bg-gray-100';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
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
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Video className="w-4 h-4 mr-1" />
                    Videos ({job.videos.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {job.videos.map((videoName, index) => (
                      <div key={index} className="relative">
                        <video
                          src={`/uploads/order-attachments/${videoName}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          controls
                          preload="metadata"
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {videoName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No files message */}
              {(!job.images || job.images.length === 0) && (!job.videos || job.videos.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <Camera className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-500 text-sm">No files were uploaded with this order</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Assigned Vendor */}
            {job.vendorId ? (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Vendor</h3>
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {job.vendorId.firstName?.[0] || 'V'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {job.vendorId.firstName} {job.vendorId.lastName}
                    </p>
                    {job.vendorId.email && (
                      <p className="text-gray-600 text-sm">{job.vendorId.email}</p>
                    )}
                    {job.vendorId.phone && (
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-1" />
                        {job.vendorId.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Assignment</h3>
                <div className="flex items-center text-yellow-700">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>No vendor assigned yet</span>
                </div>
              </div>
            )}

            {/* Pricing & Quote */}
            {(job.totalAmount || job.status === 'QUOTE_SENT' || job.status === 'QUOTE_ACCEPTED') && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pricing & Quote
                </h3>
                
                {job.totalAmount ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
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
            )}

            {/* Payment Information */}
            {job.payment && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium px-2 py-1 rounded text-sm ${
                      job.payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                      job.payment.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {job.payment.status}
                    </span>
                  </div>
                  {job.payment.method && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method</span>
                      <span className="text-gray-900">{job.payment.method}</span>
                    </div>
                  )}
                  {job.payment.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid On</span>
                      <span className="text-gray-900">
                        {new Date(job.payment.paidAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status History */}
        {job.statusHistory && job.statusHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status History</h3>
            <div className="space-y-4">
              {job.statusHistory.slice().reverse().map((status, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {status.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(status.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {status.notes && (
                      <p className="text-sm text-gray-600 mt-1">{status.notes}</p>
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