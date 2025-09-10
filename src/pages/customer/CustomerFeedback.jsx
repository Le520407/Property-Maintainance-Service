import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Star,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle,
  MessageSquare,
  ArrowLeft,
  Filter,
  Search
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const CustomerFeedback = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'rated', 'unrated'
  const [searchTerm, setSearchTerm] = useState('');
  const [ratedJobs, setRatedJobs] = useState(new Set());

  useEffect(() => {
    fetchJobsAndRatings();
  }, []);

  const fetchJobsAndRatings = async () => {
    try {
      setLoading(true);
      
      // Fetch all completed jobs
      const response = await api.jobs.getUserJobs({ status: 'COMPLETED' });
      const completedJobs = response.jobs || [];
      
      // Check which jobs already have ratings
      const ratedJobIds = new Set();
      for (const job of completedJobs) {
        try {
          await api.jobs.getRating(job._id);
          ratedJobIds.add(job._id);
        } catch (error) {
          // No rating found, that's fine
        }
      }
      
      setJobs(completedJobs);
      setRatedJobs(ratedJobIds);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    // Filter by rating status
    const hasRating = ratedJobs.has(job._id);
    if (filter === 'rated' && !hasRating) return false;
    if (filter === 'unrated' && hasRating) return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return job.title?.toLowerCase().includes(searchLower) ||
             job.vendorId?.name?.toLowerCase().includes(searchLower) ||
             job.vendorId?.companyName?.toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            to="/dashboard"
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">Rate Your Service Experience</h1>
        <p className="text-gray-600 mt-2">
          Share feedback about your completed jobs to help improve service quality
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job title or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Jobs</option>
              <option value="unrated">Not Rated</option>
              <option value="rated">Already Rated</option>
            </select>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{jobs.length - ratedJobs.size}</div>
            <div className="text-sm text-gray-600">Pending Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{ratedJobs.size}</div>
            <div className="text-sm text-gray-600">Rated</div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const hasRating = ratedJobs.has(job._id);
            
            return (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Job Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {job.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(job.completedAt || job.updatedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.address?.city || 'Location not specified'}
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                            Completed
                          </div>
                        </div>
                      </div>
                      
                      {/* Rating Status */}
                      <div className="flex items-center">
                        {hasRating ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Rated
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending Rating
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Vendor Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-orange-100 rounded-full p-2 mr-3">
                            <User className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {job.vendorId?.name || 'Vendor'}
                            </div>
                            {job.vendorId?.companyName && (
                              <div className="text-sm text-gray-600">
                                {job.vendorId.companyName}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {job.vendorId?.currentRating && (
                          <div className="flex items-center">
                            <div className="flex mr-2">
                              {renderStars(Math.round(job.vendorId.currentRating))}
                            </div>
                            <span className="text-sm text-gray-600">
                              ({job.vendorId.currentRating.toFixed(1)})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Job Description */}
                    {job.description && (
                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {job.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {job.totalAmount && (
                          <span className="text-lg font-semibold text-gray-900">
                            ${job.totalAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </Link>
                        
                        {hasRating ? (
                          <Link
                            to={`/rate-vendor/${job._id}`}
                            className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Rating
                          </Link>
                        ) : (
                          <Link
                            to={`/rate-vendor/${job._id}`}
                            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Rate Service
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          {jobs.length === 0 ? (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Jobs</h3>
              <p className="text-gray-600 mb-6">
                Complete some jobs to start rating your service experience
              </p>
              <Link
                to="/jobs/create"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Book a Service
              </Link>
            </>
          ) : (
            <>
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerFeedback;
