import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFileInvoice, FaDownload, FaFilter, FaCreditCard, FaCalendarAlt, FaChartLine } from 'react-icons/fa';
import { MdPayment, MdUndo, MdCancel, MdCheck, MdPending } from 'react-icons/md';
import CustomerSubscriptionNav from '../../components/customer/CustomerSubscriptionNav';

const BillingHistoryPage = () => {
  const { subscriptionId } = useParams();
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });

  const fetchBillingHistory = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      const endpoint = subscriptionId 
        ? `/api/subscriptions/billing-history/${subscriptionId}?${queryParams}`
        : `/api/subscriptions/billing-history?${queryParams}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch billing history');
      }

      const data = await response.json();
      setBillingData(data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching billing history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [subscriptionId, filters]);

  useEffect(() => {
    fetchBillingHistory();
  }, [fetchBillingHistory]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID':
        return <MdCheck className="text-green-500" />;
      case 'PENDING':
        return <MdPending className="text-yellow-500" />;
      case 'FAILED':
        return <MdCancel className="text-red-500" />;
      case 'REFUNDED':
      case 'REFUND_PENDING':
        return <MdUndo className="text-blue-500" />;
      case 'CANCELLED':
        return <MdCancel className="text-gray-500" />;
      default:
        return <MdPayment className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
      case 'REFUND_PENDING':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SUBSCRIPTION':
      case 'RENEWAL':
        return <FaCreditCard className="text-blue-500" />;
      case 'PRORATION':
        return <FaChartLine className="text-purple-500" />;
      case 'CANCELLATION':
        return <MdCancel className="text-red-500" />;
      case 'REFUND':
        return <MdUndo className="text-green-500" />;
      default:
        return <MdPayment className="text-gray-400" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const exportBillingHistory = () => {
    // TODO: Implement CSV export
    console.log('Export billing history');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-28">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-28">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading billing history</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchBillingHistory}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28">
      {/* Navigation */}
      <CustomerSubscriptionNav />
      
      <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FaFileInvoice className="mr-3 text-blue-600" />
                Billing History
              </h1>
              <p className="mt-2 text-gray-600">
                {subscriptionId ? 'Subscription billing history' : 'Complete billing history across all subscriptions'}
              </p>
            </div>
            <button
              onClick={exportBillingHistory}
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaDownload className="mr-2" />
              Export
            </button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        {billingData?.summary && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <MdPayment className="text-green-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    SGD {billingData.summary.totalPaid}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <MdUndo className="text-blue-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Refunds</p>
                  <p className="text-2xl font-bold text-gray-900">
                    SGD {billingData.summary.totalRefunds}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <FaChartLine className="text-purple-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Net Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    SGD {billingData.summary.netAmount}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md mb-8"
        >
          <div className="flex items-center mb-4">
            <FaFilter className="text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="SUBSCRIPTION">Subscription</option>
                <option value="RENEWAL">Renewal</option>
                <option value="PRORATION">Proration</option>
                <option value="CANCELLATION">Cancellation</option>
                <option value="REFUND">Refund</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        {/* Billing History Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Billing Transactions</h2>
          </div>

          {billingData?.billingHistory?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingData.billingHistory.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FaCalendarAlt className="text-gray-400 mr-2" />
                          {formatDate(entry.createdAt || entry.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={entry.description}>
                          {entry.description || 'Subscription payment'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {getTypeIcon(entry.type)}
                          <span className="ml-2">{entry.type || 'SUBSCRIPTION'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={entry.amount < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {entry.amount < 0 ? '-' : ''}SGD {formatCurrency(entry.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(entry.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {entry.transactionId || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FaFileInvoice className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No billing history</h3>
              <p className="mt-1 text-sm text-gray-500">
                No billing transactions found for the selected filters.
              </p>
            </div>
          )}

          {/* Pagination */}
          {billingData?.pagination && billingData.pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                    disabled={filters.page <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.min(billingData.pagination.totalPages, filters.page + 1))}
                    disabled={filters.page >= billingData.pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{filters.page}</span> of{' '}
                      <span className="font-medium">{billingData.pagination.totalPages}</span>
                      {' '}({billingData.pagination.totalEntries} total entries)
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                        disabled={filters.page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(Math.min(billingData.pagination.totalPages, filters.page + 1))}
                        disabled={filters.page >= billingData.pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default BillingHistoryPage;
