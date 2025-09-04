import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  AlertTriangle,
  Eye,
  Filter,
  Calendar,
  Users,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const PricingMonitor = ({ jobs = [] }) => {
  const [pricingAnalysis, setPricingAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    analyzePricing();
  }, [jobs, selectedCategory, timeRange]);

  const analyzePricing = () => {
    if (!jobs.length) return;

    const now = new Date();
    const daysMap = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      '365days': 365
    };

    const filteredJobs = jobs.filter(job => {
      // Filter by time range
      const jobDate = new Date(job.createdAt);
      const daysDiff = (now - jobDate) / (1000 * 60 * 60 * 24);
      if (daysDiff > daysMap[timeRange]) return false;

      // Filter by category
      if (selectedCategory !== 'all' && job.category !== selectedCategory) return false;

      return true;
    });

    const quotedJobs = filteredJobs.filter(job => job.vendorQuote?.amount);
    const acceptedQuotes = quotedJobs.filter(job => job.status === 'QUOTE_ACCEPTED' || job.status === 'PAID' || job.status === 'IN_PROGRESS' || job.status === 'COMPLETED');
    const rejectedQuotes = quotedJobs.filter(job => job.status === 'REJECTED' || job.status === 'CANCELLED');
    const pendingQuotes = quotedJobs.filter(job => job.status === 'QUOTE_SENT');

    // Price accuracy analysis
    const accuracyAnalysis = quotedJobs.map(job => {
      const estimated = job.estimatedBudget || 0;
      const quoted = job.vendorQuote?.amount || 0;
      const difference = quoted - estimated;
      const percentageDiff = estimated > 0 ? (difference / estimated) * 100 : 0;
      
      return {
        jobId: job._id,
        jobNumber: job.jobNumber,
        category: job.category,
        title: job.title,
        estimated,
        quoted,
        difference,
        percentageDiff,
        status: job.status,
        vendorName: job.vendorId ? `${job.vendorId.firstName} ${job.vendorId.lastName}` : 'Unknown',
        createdAt: job.createdAt
      };
    });

    // Price variance by category
    const categoryAnalysis = {};
    quotedJobs.forEach(job => {
      const category = job.category || 'uncategorized';
      if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = {
          jobs: [],
          totalEstimated: 0,
          totalQuoted: 0,
          count: 0,
          acceptedCount: 0,
          avgAcceptanceRate: 0
        };
      }
      
      categoryAnalysis[category].jobs.push(job);
      categoryAnalysis[category].totalEstimated += job.estimatedBudget || 0;
      categoryAnalysis[category].totalQuoted += job.vendorQuote?.amount || 0;
      categoryAnalysis[category].count++;
      
      if (acceptedQuotes.some(accepted => accepted._id === job._id)) {
        categoryAnalysis[category].acceptedCount++;
      }
      
      categoryAnalysis[category].avgAcceptanceRate = 
        (categoryAnalysis[category].acceptedCount / categoryAnalysis[category].count) * 100;
    });

    // Outliers detection (prices more than 50% different from estimate)
    const outliers = accuracyAnalysis.filter(job => Math.abs(job.percentageDiff) > 50);

    const analysis = {
      overview: {
        totalJobs: filteredJobs.length,
        quotedJobs: quotedJobs.length,
        acceptedQuotes: acceptedQuotes.length,
        rejectedQuotes: rejectedQuotes.length,
        pendingQuotes: pendingQuotes.length,
        acceptanceRate: quotedJobs.length > 0 ? (acceptedQuotes.length / quotedJobs.length) * 100 : 0,
        avgEstimatedPrice: quotedJobs.reduce((sum, job) => sum + (job.estimatedBudget || 0), 0) / quotedJobs.length || 0,
        avgQuotedPrice: quotedJobs.reduce((sum, job) => sum + (job.vendorQuote?.amount || 0), 0) / quotedJobs.length || 0
      },
      accuracyAnalysis,
      categoryAnalysis,
      outliers
    };

    setPricingAnalysis(analysis);
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'QUOTE_ACCEPTED': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accepted' },
      'QUOTE_SENT': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      'PAID': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Paid' },
      'IN_PROGRESS': { color: 'bg-purple-100 text-purple-800', icon: Clock, label: 'In Progress' },
      'COMPLETED': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      'REJECTED': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock, label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!pricingAnalysis) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No pricing data available</p>
      </div>
    );
  }

  const { overview, accuracyAnalysis, categoryAnalysis, outliers } = pricingAnalysis;

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing Monitor</h2>
            <p className="text-gray-600">Monitor vendor pricing trends and accuracy</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Categories</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="cleaning">Cleaning</option>
              <option value="painting">Painting</option>
              <option value="maintenance">Maintenance</option>
            </select>
            
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="365days">Last year</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Quoted Jobs</p>
                <p className="text-2xl font-bold">{overview.quotedJobs}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Acceptance Rate</p>
                <p className="text-2xl font-bold">{overview.acceptanceRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Avg. Estimate</p>
                <p className="text-2xl font-bold">{formatCurrency(overview.avgEstimatedPrice)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Avg. Quote</p>
                <p className="text-2xl font-bold">{formatCurrency(overview.avgQuotedPrice)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Analysis by Category</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jobs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Estimate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Quote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acceptance Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(categoryAnalysis).map(([category, data]) => {
                const avgEstimate = data.totalEstimated / data.count;
                const avgQuote = data.totalQuoted / data.count;
                const variance = avgEstimate > 0 ? ((avgQuote - avgEstimate) / avgEstimate) * 100 : 0;
                
                return (
                  <tr key={category} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 capitalize">{category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(avgEstimate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(avgQuote)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        data.avgAcceptanceRate >= 70 ? 'bg-green-100 text-green-800' : 
                        data.avgAcceptanceRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {data.avgAcceptanceRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={`flex items-center ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {variance >= 0 ? (
                          <ArrowUpRight className="w-4 h-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 mr-1" />
                        )}
                        {Math.abs(variance).toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Outliers */}
      {outliers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Pricing Outliers</h3>
            <span className="ml-2 text-sm text-gray-500">
              (More than 50% difference from estimate)
            </span>
          </div>
          
          <div className="space-y-4">
            {outliers.slice(0, 5).map((job) => (
              <div key={job.jobId} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">#{job.jobNumber}</span>
                      {getStatusBadge(job.status)}
                      <span className="text-sm text-gray-500 capitalize">{job.category}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{job.title}</p>
                    <div className="flex items-center text-xs text-gray-500 gap-4">
                      <span>Vendor: {job.vendorName}</span>
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm">
                      <div className="text-gray-600">Estimate: {formatCurrency(job.estimated)}</div>
                      <div className="text-gray-900 font-medium">Quote: {formatCurrency(job.quoted)}</div>
                      <div className={`font-semibold ${job.percentageDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {job.percentageDiff >= 0 ? '+' : ''}{job.percentageDiff.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {outliers.length > 5 && (
              <div className="text-center">
                <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                  View all {outliers.length} outliers →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingMonitor;