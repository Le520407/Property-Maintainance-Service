import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Calendar, CreditCard, Eye, Search, Filter, Clock, CheckCircle, X, User } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // Try primary endpoint first, then fallback
      let response;
      try {
        response = await api.get('/jobs/my-orders');
      } catch (error) {
        console.log('Primary endpoint failed, trying fallback...');
        response = await api.get('/customer/jobs');
      }

      setJobs(response.jobs || response.data?.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const getJobStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      'ASSIGNED': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: User },
      'IN_PROGRESS': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
      'COMPLETED': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      'CANCELLED': { color: 'bg-red-100 text-red-800 border-red-200', icon: X },
      'QUOTE_SENT': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Package },
      'QUOTE_ACCEPTED': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      'QUOTE_REJECTED': { color: 'bg-red-100 text-red-800 border-red-200', icon: X }
    };

    const config = statusConfig[status] || statusConfig['PENDING'];
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      (job.jobNumber && job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.title && job.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.service?.name && job.service.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg p-6">
                    <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-28">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Jobs</h1>
            <p className="text-gray-600">Track and manage all your service jobs</p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by job number, title, or service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="sm:w-48">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="QUOTE_SENT">Quote Sent</option>
                    <option value="QUOTE_ACCEPTED">Quote Accepted</option>
                    <option value="QUOTE_REJECTED">Quote Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Jobs List */}
          {filteredJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-12 text-center"
            >
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6">You haven't booked any services yet.</p>
              <button
                onClick={() => navigate('/services')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                Browse Services
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Job Header */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Job #{job.jobNumber || 'N/A'}
                      </h3>
                      <p className="text-lg font-medium text-gray-800 mb-2">
                        {job.title || job.service?.name || 'Service Job'}
                      </p>
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(job.createdAt)}
                        </span>
                        <span className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-1" />
                          ${job.totalAmount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 mt-3 lg:mt-0">
                      {getJobStatusBadge(job.status)}
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {job.category && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Category</p>
                          <p className="font-medium text-gray-900 capitalize">{job.category}</p>
                        </div>
                      )}
                      {job.priority && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Priority</p>
                          <p className="font-medium text-gray-900 capitalize">{job.priority}</p>
                        </div>
                      )}
                      {job.vendor && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Assigned Vendor</p>
                          <p className="font-medium text-gray-900">{job.vendor.firstName} {job.vendor.lastName}</p>
                        </div>
                      )}
                    </div>
                    
                    {job.description && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-1">Description</p>
                        <p className="text-gray-700 text-sm">{job.description}</p>
                      </div>
                    )}

                    {job.location && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-1">Location</p>
                        <p className="text-gray-700 text-sm">
                          {typeof job.location === 'string' 
                            ? job.location 
                            : `${job.location.address || ''} ${job.location.city || ''} ${job.location.state || ''} ${job.location.zipCode || ''}`.trim()
                          }
                        </p>
                      </div>
                    )}

                    {job.items && job.items.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">Items/Services</p>
                        <div className="space-y-2">
                          {job.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">{item.name || item.service || 'Service Item'}</span>
                              <span className="font-medium text-gray-900">
                                {item.quantity && `${item.quantity}x `}${item.price ? `$${item.price.toFixed(2)}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <button
                      onClick={() => navigate(`/jobs/${job._id}`)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    
                    {job.status === 'QUOTE_SENT' && (
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                          Accept Quote
                        </button>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                          Reject Quote
                        </button>
                      </div>
                    )}
                    
                    {['PENDING', 'ASSIGNED'].includes(job.status) && (
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                        Cancel Job
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
