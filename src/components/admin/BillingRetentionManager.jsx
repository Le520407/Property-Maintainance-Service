import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const BillingRetentionManager = () => {
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchStats();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/customer-subscriptions/billing-retention/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching retention status:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/customer-subscriptions/billing-retention/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching retention stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerCleanup = async (dryRun = true) => {
    if (!dryRun) {
      const confirmed = window.confirm(
        'Are you sure you want to permanently delete old billing data? This action cannot be undone.'
      );
      if (!confirmed) return;
    }

    setCleanupLoading(true);
    try {
      const response = await fetch('/api/customer-subscriptions/billing-retention/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ dryRun })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchStatus();
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error triggering cleanup:', error);
      toast.error('Error triggering cleanup');
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Billing Data Retention Management</h2>
      
      {/* Service Status */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Service Status</h3>
        {status ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-3 py-1 rounded-full text-sm ${
                  status.isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {status.isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
              <div>
                <span className="font-medium">Next Cleanup:</span>
                <span className="ml-2">{status.nextCleanup || 'Not scheduled'}</span>
              </div>
              <div>
                <span className="font-medium">Last Cleanup:</span>
                <span className="ml-2">{status.lastCleanup ? formatDate(status.lastCleanup) : 'Never'}</span>
              </div>
              <div>
                <span className="font-medium">Total Cleanups:</span>
                <span className="ml-2">{status.cleanupCount || 0}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Loading status...</div>
        )}
      </div>

      {/* Statistics */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Data Statistics</h3>
        {loading ? (
          <div className="text-gray-500">Loading statistics...</div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Retention Policy</h4>
              <p className="text-sm text-blue-600">
                Keep data for {stats.retentionPolicy.years} years
              </p>
              <p className="text-xs text-blue-500">
                Delete before: {formatDate(stats.retentionPolicy.cutoffDate)}
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Records to Delete</h4>
              <div className="space-y-1 text-sm text-red-600">
                <p>Memberships: {stats.oldRecords.memberships}</p>
                <p>Orders: {stats.oldRecords.orders}</p>
                <p>Jobs: {stats.oldRecords.jobs}</p>
                <p className="font-medium">Total: {stats.oldRecords.total}</p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Current Records</h4>
              <div className="space-y-1 text-sm text-green-600">
                <p>Memberships: {stats.totalRecords.memberships}</p>
                <p>Orders: {stats.totalRecords.orders}</p>
                <p>Jobs: {stats.totalRecords.jobs}</p>
                <p className="font-medium">
                  {stats.cleanupImpact.percentageToDelete}% eligible for deletion
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Manual Actions</h3>
        
        <div className="flex space-x-4">
          <button
            onClick={() => triggerCleanup(true)}
            disabled={cleanupLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cleanupLoading ? 'Running...' : 'Test Cleanup (Dry Run)'}
          </button>
          
          <button
            onClick={() => triggerCleanup(false)}
            disabled={cleanupLoading || !stats?.oldRecords?.total}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cleanupLoading ? 'Running...' : 'Delete Old Data (Live)'}
          </button>
          
          <button
            onClick={() => { fetchStatus(); fetchStats(); }}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refresh Data
          </button>
        </div>

        <div className="text-sm text-gray-600 mt-4">
          <p><strong>Dry Run:</strong> Tests the cleanup process without deleting any data</p>
          <p><strong>Live Deletion:</strong> Permanently removes old billing data (cannot be undone)</p>
          <p><strong>Automatic Cleanup:</strong> Runs monthly on the 1st at 2:00 AM</p>
        </div>
      </div>
    </div>
  );
};

export default BillingRetentionManager;