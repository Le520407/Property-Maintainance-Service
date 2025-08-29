import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  UserCheck, 
  Clock, 
  MapPin, 
  DollarSign,
  Calendar,
  Phone,
  Mail,
  FileText,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Wrench,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Grid,
  List,
  BarChart3,
  TrendingUp,
  Package,
  Plus,
  Download,
  MoreHorizontal,
  X,
  Trash2,
  Camera,
  Video
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const OrderManagement = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [zoomedImage, setZoomedImage] = useState(null);
  const [stats, setStats] = useState({
    pendingOrders: 0,
    assignedOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0
  });
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    dateRange: '',
    assignmentStatus: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 12
  });

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    IN_DISCUSSION: 'bg-purple-100 text-purple-800',
    QUOTE_SENT: 'bg-indigo-100 text-indigo-800',
    QUOTE_ACCEPTED: 'bg-green-100 text-green-800',
    PAID: 'bg-emerald-100 text-emerald-800',
    IN_PROGRESS: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-200 text-green-900',
    CANCELLED: 'bg-red-100 text-red-800',
    REJECTED: 'bg-gray-100 text-gray-800'
  };


  // Status filters
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_DISCUSSION', label: 'In Discussion' },
    { value: 'QUOTE_SENT', label: 'Quote Sent' },
    { value: 'QUOTE_ACCEPTED', label: 'Quote Accepted' },
    { value: 'PAID', label: 'Paid' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];


  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'budget_desc', label: 'Highest Budget' },
    { value: 'budget_asc', label: 'Lowest Budget' }
  ];

  useEffect(() => {
    fetchJobs();
    fetchVendors();
  }, [filters, pagination.page]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/jobs?${queryParams}`);
      setJobs(response.jobs);
      setPagination(prev => ({
        ...prev,
        pages: response.pagination.pages,
        total: response.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await api.get('/admin/vendors');
      setVendors(response.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchRecommendedVendors = async (jobId) => {
    try {
      const response = await api.get(`/jobs/${jobId}/recommended-vendors?limit=10`);
      setVendors(response.recommendedVendors || []);
      
      if (response.recommendedVendors?.length > 0) {
        toast.success(`Found ${response.recommendedVendors.length} recommended vendors!`);
      } else {
        toast.error('No suitable vendors found for this job');
        // Fallback to all vendors
        await fetchVendors();
      }
    } catch (error) {
      console.error('Error fetching recommended vendors:', error);
      toast.error('Failed to get vendor recommendations');
      // Fallback to all vendors
      await fetchVendors();
    }
  };

  const handleAutoAssign = async (job) => {
    try {
      const response = await api.post(`/jobs/${job._id}/auto-assign`);
      
      // Check if response has the expected structure
      if (response?.assignedVendor?.userId) {
        toast.success(`Job auto-assigned to ${response.assignedVendor.userId?.firstName || 'Unknown'} ${response.assignedVendor.userId?.lastName || 'User'}!`);
        if (response.recommendationReason) {
          toast.success(`Reason: ${response.recommendationReason}`);
        }
      } else {
        toast.success('Job auto-assigned successfully!');
        console.warn('Auto-assign response structure:', response);
      }
      
      fetchJobs(); // Refresh the list
      
    } catch (error) {
      console.error('Error auto-assigning job:', error);
      toast.error(error.response?.data?.message || 'Failed to auto-assign job');
    }
  };

  const handleAssignJob = async () => {
    if (!selectedVendor || !selectedJob) {
      toast.error('Please select a vendor');
      return;
    }

    try {
      const assignmentData = {
        vendorId: selectedVendor
      };

      await api.patch(`/jobs/${selectedJob._id}/assign`, assignmentData);
      
      toast.success('Job assigned successfully! 🎉');
      setShowAssignModal(false);
      setSelectedJob(null);
      setSelectedVendor('');
      fetchJobs(); // Refresh the list
      
    } catch (error) {
      console.error('Error assigning job:', error);
      toast.error(error.response?.data?.message || 'Failed to assign job');
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      await api.delete(`/jobs/${jobToDelete._id}`);
      
      toast.success(`Order ${jobToDelete.jobNumber} deleted successfully! 🗑️`);
      setShowDeleteModal(false);
      setJobToDelete(null);
      fetchJobs(); // Refresh the list
      
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error(error.response?.data?.message || 'Failed to delete order');
    }
  };

  const canDeleteJob = (job) => {
    // Allow deletion of any order for now (admin override)
    return true;
    // const deletableStatuses = ['PENDING', 'CANCELLED', 'REJECTED'];
    // return deletableStatuses.includes(job.status);
  };

  const getVendorsForJob = (job, vendorList = vendors) => {
    // Filter vendors by category and location
    return vendorList.filter(vendor => {
      // Check if vendor handles this service category
      const hasCategory = vendor.serviceCategories?.includes(job.category);
      
      // Check if vendor serves this location (simplified)
      const servesLocation = true; // You can implement location-based filtering
      
      // Check if vendor is active and verified
      const isActiveAndVerified = vendor.isActive && vendor.verificationStatus === 'VERIFIED';
      
      return hasCategory && servesLocation && isActiveAndVerified;
    });
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
    
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<Star key={i} className="w-4 h-4 fill-current text-yellow-400" />);
      } else if (i - 0.5 <= roundedRating) {
        stars.push(<Star key={i} className="w-4 h-4 fill-current text-yellow-400 opacity-50" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }
    return stars;
  };

  const JobDetailsModal = ({ job, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <p className="text-sm text-gray-600 mt-1">#{job.jobNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Job Information */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <h3 className="text-lg font-semibold mb-4 text-blue-900 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Job Information
              </h3>
              <div className="space-y-2 text-sm">
                <div><strong>Job ID:</strong> {job.jobNumber}</div>
                <div><strong>Title:</strong> {job.title}</div>
                <div><strong>Category:</strong> {job.category}</div>
                {job.isEmergency && (
                  <div className="flex items-center">
                    <strong className="mr-2">Emergency:</strong>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      EMERGENCY
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <strong className="mr-2">Status:</strong>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
                <div><strong>Description:</strong> {job.description}</div>
                {job.specialInstructions && (
                  <div><strong>Special Instructions:</strong> {job.specialInstructions}</div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
              <h3 className="text-lg font-semibold mb-4 text-green-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Customer Information
              </h3>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {job.customerId?.firstName} {job.customerId?.lastName}</div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  {job.customerId?.email}
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {job.customerContactNumber || job.customerId?.phone}
                </div>
              </div>
            </div>

            {/* Timing */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
              <h3 className="text-lg font-semibold mb-4 text-purple-900 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Timing
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <strong>Requested Date:</strong> {new Date(job.requestedTimeSlot?.date).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <strong>Time:</strong> {job.requestedTimeSlot?.startTime} - {job.requestedTimeSlot?.endTime}
                </div>
                <div><strong>Estimated Duration:</strong> {job.estimatedDuration} hours</div>
              </div>
            </div>
          </div>

          {/* Location & Budget */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-100">
              <h3 className="text-lg font-semibold mb-4 text-orange-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-1" />
                  <div>
                    <div>{job.location?.address}</div>
                    <div>{job.location?.city}, {job.location?.state} {job.location?.zipCode}</div>
                  </div>
                </div>
                {job.accessInstructions && (
                  <div><strong>Access Instructions:</strong> {job.accessInstructions}</div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border border-yellow-100">
              <h3 className="text-lg font-semibold mb-4 text-yellow-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Budget & Pricing
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                  <strong>Customer Budget:</strong> ${job.estimatedBudget?.toFixed(2)}
                </div>
                {job.vendorQuote?.amount && (
                  <>
                    <div><strong>Vendor Quote:</strong> ${job.vendorQuote.amount.toFixed(2)}</div>
                    {job.vendorQuote.description && (
                      <div><strong>Quote Description:</strong> {job.vendorQuote.description}</div>
                    )}
                  </>
                )}
                {job.totalAmount && (
                  <>
                    <div><strong>Final Amount:</strong> ${job.totalAmount.toFixed(2)}</div>
                    <div><strong>Platform Commission (10%):</strong> ${job.commission?.platformAmount?.toFixed(2)}</div>
                    <div><strong>Vendor Amount (90%):</strong> ${job.commission?.vendorAmount?.toFixed(2)}</div>
                  </>
                )}
              </div>
            </div>

            {/* Vendor Information (if assigned) */}
            {job.vendorId && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100">
                <h3 className="text-lg font-semibold mb-4 text-indigo-900 flex items-center">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Assigned Vendor
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {job.vendorId?.firstName} {job.vendorId?.lastName}</div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {job.vendorId?.email}
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {job.vendorId?.phone}
                  </div>
                  {job.vendorDetails?.companyName && (
                    <div><strong>Company:</strong> {job.vendorDetails.companyName}</div>
                  )}
                </div>
              </div>
            )}

            {/* Uploaded Files Section */}
            {(job.images?.length > 0 || job.videos?.length > 0) && (
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-gray-600" />
                  Customer Uploaded Files
                </h3>
                
                {/* Images */}
                {job.images && job.images.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Camera className="w-4 h-4 mr-1" />
                      Photos ({job.images.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {job.images.map((imageName, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={`/uploads/order-attachments/${imageName}`}
                            alt={`Order attachment ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setZoomedImage(`/uploads/order-attachments/${imageName}`)}
                            onError={(e) => {
                              // Fallback if image doesn't exist
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjEzTTEyIDE3SDEyLjAxTTIxIDEyQzIxIDE2Ljk3MDYgMTYuOTcwNiAyMSAxMiAyMUM3LjAyOTQ0IDIxIDMgMTYuOTcwNiAzIDEyQzMgNy4wMjk0NCA3LjAyOTQ0IDMgMTIgM0MxNi45NzA2IDMgMjEgNy4wMjk0NCAyMSAxMloiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                              e.target.className = 'w-full h-20 object-contain rounded-lg border border-gray-200 bg-gray-100';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center pointer-events-none">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to view
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {job.videos && job.videos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Video className="w-4 h-4 mr-1" />
                      Videos ({job.videos.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {job.videos.map((videoName, index) => (
                        <div key={index} className="relative">
                          <video
                            src={`/uploads/order-attachments/${videoName}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            controls
                            preload="metadata"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-24 bg-gray-100 rounded-lg border border-gray-200 items-center justify-center text-gray-500 text-sm hidden">
                            <div className="text-center">
                              <Video className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                              <span>Video not available</span>
                              <div className="text-xs text-gray-400 mt-1">{videoName}</div>
                            </div>
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {videoName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status History */}
        {job.statusHistory && job.statusHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Status History</h3>
            <div className="space-y-2">
              {job.statusHistory.slice().reverse().map((history, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div><strong>{history.status.replace('_', ' ')}:</strong></div>
                  <div>{new Date(history.timestamp).toLocaleString()}</div>
                  {history.notes && <div>- {history.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        </div>

        {/* Footer with Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Created: {new Date(job.createdAt).toLocaleString()}
            </div>
            <div className="flex space-x-3">
              {job.status === 'PENDING' && (
                <button
                  onClick={() => {
                    setSelectedJob(job);
                    setShowAssignModal(true);
                    onClose();
                  }}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Assign to Vendor
                </button>
              )}
              {canDeleteJob(job) && (
                <button
                  onClick={() => {
                    setJobToDelete(job);
                    setShowDeleteModal(true);
                    onClose();
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const AssignmentModal = () => {
    const [modalVendors, setModalVendors] = useState([]);
    const [isLoadingVendors, setIsLoadingVendors] = useState(false);
    
    // Memoize availableVendors to prevent unnecessary re-renders
    const availableVendors = React.useMemo(() => {
      return modalVendors.length > 0 ? getVendorsForJob(selectedJob, modalVendors) : getVendorsForJob(selectedJob);
    }, [selectedJob, modalVendors]);

    // Memoize vendor items with stable IDs to prevent re-renders
    const vendorItems = React.useMemo(() => {
      return availableVendors.map(vendor => ({
        ...vendor,
        stableId: vendor.userId?._id || vendor.userId || vendor._id
      }));
    }, [availableVendors]);

    // Fetch recommended vendors when modal opens
    React.useEffect(() => {
      let isMounted = true;
      
      const fetchVendorsForModal = async () => {
        if (selectedJob && showAssignModal && modalVendors.length === 0 && !isLoadingVendors) {
          setIsLoadingVendors(true);
          try {
            const response = await api.get(`/jobs/${selectedJob._id}/recommended-vendors?limit=10`);
            if (isMounted) {
              setModalVendors(response.recommendedVendors || []);
              
              if (response.recommendedVendors?.length > 0) {
                toast.success(`Found ${response.recommendedVendors.length} recommended vendors!`);
              } else {
                // Fallback to all vendors
                const allVendorsResponse = await api.get('/admin/vendors');
                if (isMounted) {
                  setModalVendors(allVendorsResponse.vendors || []);
                }
                toast.error('No suitable vendors found for this job');
              }
            }
          } catch (error) {
            if (isMounted) {
              console.error('Error fetching recommended vendors:', error);
              toast.error('Failed to get vendor recommendations');
              // Fallback to all vendors
              try {
                const allVendorsResponse = await api.get('/admin/vendors');
                if (isMounted) {
                  setModalVendors(allVendorsResponse.vendors || []);
                }
              } catch (fallbackError) {
                console.error('Error fetching fallback vendors:', fallbackError);
              }
            }
          } finally {
            if (isMounted) {
              setIsLoadingVendors(false);
            }
          }
        }
      };

      fetchVendorsForModal();

      return () => {
        isMounted = false;
      };
    }, [selectedJob?._id, showAssignModal, modalVendors.length, isLoadingVendors]); // Prevent infinite loops and unnecessary re-fetches

    // Reset modal state when modal closes
    React.useEffect(() => {
      if (!showAssignModal) {
        setModalVendors([]);
        setIsLoadingVendors(false);
        setSelectedVendor('');
      }
    }, [showAssignModal]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Assign Vendor</h2>
                <p className="text-sm text-gray-600 mt-1">Find the perfect vendor for this job</p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">

          {/* Job Summary */}
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <h3 className="text-lg font-semibold mb-3 text-blue-900">Job Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{selectedJob?.title}</p>
                  <p className="text-gray-600">{selectedJob?.category}</p>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{selectedJob?.location?.city}</p>
                  <p className="text-gray-600">{selectedJob?.location?.state}</p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">${selectedJob?.estimatedBudget?.toFixed(2)}</p>
                  <p className="text-gray-600">Customer budget</p>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-assign option */}
          <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-lg mb-2 flex items-center">
                  🤖 Smart Auto-Assignment
                </h4>
                <p className="text-blue-100 mb-1">Let our AI find and assign the best vendor automatically</p>
                <p className="text-blue-200 text-sm">• Analyzes vendor ratings, experience & availability</p>
                <p className="text-blue-200 text-sm">• Considers location proximity & service category</p>
              </div>
              <div className="ml-6">
                <button
                  onClick={() => {
                    handleAutoAssign(selectedJob);
                    setShowAssignModal(false);
                  }}
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Auto-Assign
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Vendor Manually
              </label>
              <button
                onClick={async () => {
                  setIsLoadingVendors(true);
                  try {
                    const response = await api.get(`/jobs/${selectedJob._id}/recommended-vendors?limit=10`);
                    setModalVendors(response.recommendedVendors || []);
                    
                    if (response.recommendedVendors?.length > 0) {
                      toast.success(`Found ${response.recommendedVendors.length} recommended vendors!`);
                    } else {
                      toast.error('No suitable vendors found for this job');
                    }
                  } catch (error) {
                    console.error('Error fetching recommended vendors:', error);
                    toast.error('Failed to get vendor recommendations');
                  } finally {
                    setIsLoadingVendors(false);
                  }
                }}
                disabled={isLoadingVendors}
                className="text-sm text-orange-600 hover:text-orange-800 flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingVendors ? 'animate-spin' : ''}`} />
                Get AI Recommendations
              </button>
            </div>
            {vendorItems.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {vendorItems.map((vendor) => {
                  const vendorId = vendor.stableId;
                  const hasAIScore = vendor.totalScore !== undefined;
                  
                  return (
                    <label
                      key={vendor._id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedVendor === vendorId ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                      } ${hasAIScore ? 'border-l-4 border-l-blue-500' : ''}`}
                    >
                      <input
                        type="radio"
                        name="vendor"
                        value={vendorId}
                        checked={selectedVendor === vendorId}
                        onChange={(e) => setSelectedVendor(e.target.value)}
                        className="mr-3 text-orange-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center">
                              <div className="font-medium">
                                {vendor.userId?.firstName || vendor.firstName || 'Unknown'} {vendor.userId?.lastName || vendor.lastName || 'User'}
                              </div>
                              {hasAIScore && (
                                <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  AI Score: {vendor.totalScore.toFixed(0)}/100
                                </div>
                              )}
                            </div>
                            {vendor.companyName && (
                              <div className="text-sm text-gray-600">{vendor.companyName}</div>
                            )}
                            {hasAIScore && vendor.recommendationReason && (
                              <div className="text-sm text-green-600 mt-1">
                                💡 {vendor.recommendationReason}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center">
                              {getRatingStars(vendor.vendorStats?.averageRating || vendor.averageRating || 4.5)}
                              <span className="ml-1 text-sm text-gray-600">
                                ({(vendor.vendorStats?.averageRating || vendor.averageRating || 4.5).toFixed(1)})
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {vendor.vendorStats?.totalJobs || vendor.totalJobsCompleted || 0} jobs completed
                            </div>
                            {hasAIScore && (
                              <div className="text-xs text-blue-600">
                                {vendor.vendorStats?.experienceLevel || 'New'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <div>Categories: {vendor.serviceCategories?.join(', ')}</div>
                          <div>Service Area: {vendor.serviceArea}</div>
                          {hasAIScore && vendor.scoreBreakdown && (
                            <div className="mt-2 text-xs">
                              <div className="grid grid-cols-3 gap-2">
                                <div>Rating: {vendor.scoreBreakdown.rating?.score.toFixed(0)}</div>
                                <div>Experience: {vendor.scoreBreakdown.experience?.score.toFixed(0)}</div>
                                <div>Availability: {vendor.scoreBreakdown.availability?.score.toFixed(0)}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : isLoadingVendors ? (
              /* Vendor Loading Skeleton */
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4">
                    <div className="animate-pulse">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                          <div className="space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                          <div className="h-2 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No available vendors found for this job category and location.</p>
                <button
                  onClick={async () => {
                    setIsLoadingVendors(true);
                    try {
                      const response = await api.get('/admin/vendors');
                      setModalVendors(response.vendors || []);
                      toast.success('All vendors loaded');
                    } catch (error) {
                      console.error('Error fetching vendors:', error);
                      toast.error('Failed to load vendors');
                    } finally {
                      setIsLoadingVendors(false);
                    }
                  }}
                  disabled={isLoadingVendors}
                  className="mt-2 text-orange-600 hover:text-orange-800 text-sm disabled:opacity-50"
                >
                  Load all vendors
                </button>
              </div>
            )}
          </div>

          {/* Assignment Note */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Assignment Process</h4>
                <p className="text-sm text-blue-700 mt-1">
                  The vendor will be notified of this assignment and can accept or reject it. 
                  Once accepted, they will communicate directly with the customer to discuss 
                  scheduling, pricing, and project details.
                </p>
              </div>
            </div>
          </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {vendorItems.length} vendor{vendorItems.length !== 1 ? 's' : ''} available
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignJob}
                  disabled={!selectedVendor}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Assign Job
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Trash2 className="w-5 h-5 mr-2 text-red-600" />
              Delete Order
            </h2>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Are you sure you want to delete this order?
            </h3>
            
            {jobToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm space-y-1">
                  <div><strong>Order:</strong> {jobToDelete.jobNumber}</div>
                  <div><strong>Title:</strong> {jobToDelete.title}</div>
                  <div><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${statusColors[jobToDelete.status]}`}>
                      {jobToDelete.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div><strong>Customer:</strong> {jobToDelete.customerId?.firstName} {jobToDelete.customerId?.lastName}</div>
                </div>
              </div>
            )}
            
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The order and all associated messages will be permanently deleted.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteJob}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Order
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header Section */}
      <section className="relative bg-gradient-to-r from-orange-600 to-orange-800 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Order Management</h1>
              <p className="text-xl text-orange-100 max-w-2xl">
                Efficiently manage customer orders, track progress, and assign vendors with our intelligent system
              </p>
              {jobs.filter(job => job.status === 'PENDING').length > 0 && (
                <div className="flex items-center mt-4 px-4 py-3 bg-orange-800 bg-opacity-80 text-orange-100 rounded-lg backdrop-blur-sm inline-flex">
                  <AlertCircle className="w-5 h-5 mr-3" />
                  <span className="font-semibold">
                    {jobs.filter(job => job.status === 'PENDING').length} order{jobs.filter(job => job.status === 'PENDING').length > 1 ? 's' : ''} pending assignment
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              {jobs.filter(job => job.status === 'PENDING').length > 0 && (
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, status: 'PENDING' }));
                    setCurrentPage(1);
                  }}
                  className="flex items-center px-6 py-3 bg-orange-800 bg-opacity-80 text-white rounded-lg hover:bg-orange-900 transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  View Pending ({jobs.filter(job => job.status === 'PENDING').length})
                </button>
              )}
              
              <button
                onClick={fetchJobs}
                className="flex items-center px-6 py-3 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh
              </button>
              
              <button
                onClick={() => window.print()}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                <Download className="w-5 h-5 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">

        {/* Enhanced Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-orange-600" />
              Filter Orders
            </h2>
            <p className="text-sm text-gray-600 mt-1">Find specific orders using the filters below</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Job title, customer name..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-50 focus:bg-white"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_DISCUSSION">In Discussion</option>
                <option value="QUOTE_SENT">Quote Sent</option>
                <option value="QUOTE_ACCEPTED">Quote Accepted</option>
                <option value="PAID">Paid</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', category: '', search: '', dateRange: '', assignmentStatus: '' })}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </motion.div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-sm border border-yellow-100 hover:shadow-md transition-all duration-200 group"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-1">Pending Orders</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {jobs.filter(job => job.status === 'PENDING').length}
                </p>
                <p className="text-xs text-yellow-600 mt-1">Awaiting assignment</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 group-hover:bg-yellow-200 transition-colors">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-xs text-yellow-700">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>Requires immediate attention</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-all duration-200 group"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Assigned</p>
                <p className="text-3xl font-bold text-blue-900">
                  {jobs.filter(job => ['ASSIGNED', 'IN_DISCUSSION', 'QUOTE_SENT'].includes(job.status)).length}
                </p>
                <p className="text-xs text-blue-600 mt-1">With vendors</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-xs text-blue-700">
                <Users className="w-3 h-3 mr-1" />
                <span>Under vendor review</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-all duration-200 group"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-orange-900">
                  {jobs.filter(job => ['PAID', 'IN_PROGRESS'].includes(job.status)).length}
                </p>
                <p className="text-xs text-orange-600 mt-1">Active work</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors">
                <Wrench className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-xs text-orange-700">
                <Package className="w-3 h-3 mr-1" />
                <span>Work in progress</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-all duration-200 group"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-900">
                  {jobs.filter(job => job.status === 'COMPLETED').length}
                </p>
                <p className="text-xs text-green-600 mt-1">Successfully finished</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-xs text-green-700">
                <BarChart3 className="w-3 h-3 mr-1" />
                <span>Revenue generated</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

        {/* Enhanced View Toggle & Bulk Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900">All Orders</h2>
                <div className="text-sm text-gray-500">
                  {jobs.length} {jobs.length === 1 ? 'order' : 'orders'}
                </div>
                {selectedOrders.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                      {selectedOrders.length} selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // Bulk assign logic would go here
                          toast('Bulk assignment feature coming soon!');
                        }}
                        className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors flex items-center"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Bulk Assign
                      </button>
                      <button
                        onClick={() => {
                          // Bulk export logic would go here
                          toast('Bulk export feature coming soon!');
                        }}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </button>
                      <button
                        onClick={() => setSelectedOrders([])}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const pendingJobs = jobs.filter(job => job.status === 'PENDING');
                      if (pendingJobs.length > 0) {
                        toast(`Auto-assigning ${pendingJobs.length} pending orders...`);
                        // Bulk auto-assign logic would go here
                      } else {
                        toast('No pending orders to assign');
                      }
                    }}
                    className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Auto-assign all pending orders"
                  >
                    🤖 Auto-assign All
                  </button>
                </div>
                
                {/* View Toggle */}
                <div className="flex bg-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="w-4 h-4 mr-2 inline" />
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid className="w-4 h-4 mr-2 inline" />
                    Cards
                  </button>
                </div>
              </div>
            </div>
          </div>

      {/* Orders Content */}
      {loading ? (
        viewMode === 'grid' ? (
          /* Grid Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table Skeleton */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="hidden lg:block">
              <div className="bg-gray-50 px-6 py-3">
                <div className="grid grid-cols-7 gap-4">
                  {['', 'Order Details', 'Customer', 'Location', 'Budget', 'Status', 'Actions'].map((header, index) => (
                    <div key={index} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="animate-pulse grid grid-cols-7 gap-4 items-center">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-2 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-2 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                        <div className="h-2 bg-gray-200 rounded w-10"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      <div className="flex space-x-2">
                        <div className="h-6 w-6 bg-gray-200 rounded"></div>
                        <div className="h-6 w-6 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mobile Skeleton */}
            <div className="lg:hidden divide-y divide-gray-200">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {(filters.search || filters.status) 
                ? "No orders match your current filters. Try adjusting your search criteria."
                : "No orders available at the moment. New orders will appear here when customers submit requests."
              }
            </p>
            {(filters.search || filters.status) && (
              <button
                onClick={() => setFilters({ status: '', category: '', search: '', dateRange: '', assignmentStatus: '' })}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {job.jobNumber} • {job.category}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[job.status]}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Emergency indicator */}
                {job.isEmergency && (
                  <div className="flex items-center mb-4">
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                      🚨 EMERGENCY
                    </span>
                  </div>
                )}

                {/* Customer Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-gray-600">
                        {job.customerId?.firstName?.[0]}{job.customerId?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {job.customerId?.firstName} {job.customerId?.lastName}
                      </p>
                      <p className="text-gray-500 text-xs">{job.customerId?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Location & Budget */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{job.location?.city}, {job.location?.state}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      ${job.estimatedBudget?.toFixed(2)}
                    </span>
                    {job.vendorQuote?.amount && (
                      <span className="ml-2 text-xs text-gray-500">
                        (Quote: ${job.vendorQuote.amount.toFixed(2)})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {job.requestedTimeSlot?.date ? 
                        new Date(job.requestedTimeSlot.date).toLocaleDateString() : 
                        'Date TBD'
                      }
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                  
                  {job.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAutoAssign(job)}
                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        title="Auto-assign to best vendor"
                      >
                        🤖
                      </button>
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowAssignModal(true);
                        }}
                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                        title="Manual assignment"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  {canDeleteJob(job) && (
                    <button
                      onClick={() => {
                        setJobToDelete(job);
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === jobs.length && jobs.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(jobs.map(job => job._id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job._id} className={`hover:bg-gray-50 transition-colors ${
                    selectedOrders.includes(job._id) ? 'bg-orange-50' : ''
                  }`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(job._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(prev => [...prev, job._id]);
                          } else {
                            setSelectedOrders(prev => prev.filter(id => id !== job._id));
                          }
                        }}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-1">{job.title}</div>
                        <div className="text-sm text-gray-500 mb-2">
                          {job.jobNumber} • {job.category}
                        </div>
                        {job.isEmergency && (
                          <div className="flex items-center">
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                              🚨 EMERGENCY
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-600">
                            {job.customerId?.firstName?.[0]}{job.customerId?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {job.customerId?.firstName} {job.customerId?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{job.customerId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div className="text-gray-900">{job.location?.city}</div>
                          <div className="text-gray-500">{job.location?.state}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          ${job.estimatedBudget?.toFixed(2)}
                        </div>
                        {job.vendorQuote?.amount && (
                          <div className="text-sm text-gray-500">
                            Quote: ${job.vendorQuote.amount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusColors[job.status]}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {job.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAutoAssign(job)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                              title="Auto-assign to best vendor"
                            >
                              🤖
                            </button>
                            <button
                              onClick={() => {
                                setSelectedJob(job);
                                setShowAssignModal(true);
                              }}
                              className="text-orange-600 hover:text-orange-900 p-1 rounded-full hover:bg-orange-50 transition-colors"
                              title="Manual assignment"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {canDeleteJob(job) && (
                          <button
                            onClick={() => {
                              setJobToDelete(job);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                            title="Delete order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-200">
            {jobs.map((job) => (
              <div key={job._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {job.jobNumber} • {job.category}
                    </p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[job.status]} ml-2`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">
                      {job.customerId?.firstName} {job.customerId?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span>{job.location?.city}, {job.location?.state}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium">${job.estimatedBudget?.toFixed(2)}</span>
                  </div>
                </div>

                {job.isEmergency && (
                  <div className="flex items-center mb-3">
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                      🚨 EMERGENCY
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </button>
                  
                  {job.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAutoAssign(job)}
                        className="flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        title="Auto-assign"
                      >
                        🤖
                      </button>
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowAssignModal(true);
                        }}
                        className="flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                        title="Assign"
                      >
                        <UserCheck className="w-3 h-3" />
                      </button>
                    </>
                  )}
                  
                  {canDeleteJob(job) && (
                    <button
                      onClick={() => {
                        setJobToDelete(job);
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

          {/* Enhanced Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">
                  Showing page <span className="text-orange-600">{pagination.page}</span> of <span className="text-orange-600">{pagination.pages}</span> 
                  <span className="text-gray-500 ml-2">({pagination.total} total orders)</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedJob && !showAssignModal && (
        <JobDetailsModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
        />
      )}
      
      {showAssignModal && selectedJob && (
        <AssignmentModal />
      )}

      {showDeleteModal && jobToDelete && (
        <DeleteConfirmationModal />
      )}

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <ImageZoomModal 
            imageSrc={zoomedImage} 
            onClose={() => setZoomedImage(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Image Zoom Modal Component
const ImageZoomModal = ({ imageSrc, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-90">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="relative max-w-full max-h-full"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Image */}
        <img
          src={imageSrc}
          alt="Zoomed order attachment"
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Click outside to close */}
        <div 
          className="absolute inset-0 -z-10"
          onClick={onClose}
        />
      </motion.div>
    </div>
  );
};

export default OrderManagement;