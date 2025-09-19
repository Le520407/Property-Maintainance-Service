import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit3,
  ExternalLink,
  Filter,
  Search,
  Shield,
  XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const CEAVerificationManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    status: '',
    notes: '',
    expiryDate: ''
  });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/agents/cea-verification');
      setAgents(response.data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to fetch agent data');
    } finally {
      setLoading(false);
    }
  };

  const openVerificationModal = (agent) => {
    setSelectedAgent(agent);
    setVerificationForm({
      status: agent.ceaVerificationStatus || 'PENDING_MANUAL_VERIFICATION',
      notes: agent.ceaVerificationNotes || '',
      expiryDate: agent.ceaExpiryDate ? agent.ceaExpiryDate.split('T')[0] : ''
    });
    setShowVerificationModal(true);
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgent) return;

    try {
      await api.put(`/admin/agents/${selectedAgent._id}/cea-verification`, {
        ...verificationForm,
        expiryDate: verificationForm.expiryDate || null
      });
      
      toast.success('CEA verification updated successfully');
      setShowVerificationModal(false);
      fetchAgents();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING_MANUAL_VERIFICATION': {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        text: 'Pending Verification'
      },
      'VERIFIED': {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        text: 'Verified'
      },
      'FAILED': {
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        text: 'Failed'
      },
      'EXPIRED': {
        color: 'bg-orange-100 text-orange-800',
        icon: AlertTriangle,
        text: 'Expired'
      },
      'SUSPENDED': {
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        text: 'Suspended'
      }
    };

    const config = statusMap[status] || statusMap['PENDING_MANUAL_VERIFICATION'];
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent size={12} className="mr-1" />
        {config.text}
      </span>
    );
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (agent.ceaRegistrationNumber && agent.ceaRegistrationNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'ALL' || agent.ceaVerificationStatus === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const isExpiryNear = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Shield className="mr-3 text-blue-600" />
            CEA Verification Management
          </h1>
          <p className="text-gray-600">
            Manage and verify CEA (Council for Estate Agencies) registrations for property agents
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or CEA number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING_MANUAL_VERIFICATION">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="FAILED">Failed</option>
                <option value="EXPIRED">Expired</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* CEA Information Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Shield className="mr-3 text-blue-600 mt-0.5" size={20} />
            <div>
              <h3 className="text-blue-900 font-semibold">CEA Verification Process</h3>
              <p className="text-blue-800 text-sm mt-1">
                Verify agent registrations through the{' '}
                <a 
                  href="https://eservices.cea.gov.sg/aceas/public-register/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900 inline-flex items-center"
                >
                  CEA Public Register <ExternalLink size={12} className="ml-1" />
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Agents Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CEA Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Loading agents...
                    </td>
                  </tr>
                ) : filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No agents found
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => (
                    <tr key={agent._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {agent.fullName}
                          </div>
                          <div className="text-sm text-gray-500">{agent.email}</div>
                          <div className="text-xs text-gray-400">{agent.agentCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {agent.ceaRegistrationNumber || 'Not provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(agent.ceaVerificationStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.ceaVerificationDate 
                          ? new Date(agent.ceaVerificationDate).toLocaleDateString()
                          : 'Not verified'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent.ceaExpiryDate ? (
                          <div className={`text-sm ${isExpiryNear(agent.ceaExpiryDate) ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                            {new Date(agent.ceaExpiryDate).toLocaleDateString()}
                            {isExpiryNear(agent.ceaExpiryDate) && (
                              <div className="text-xs text-orange-500">Expires soon</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openVerificationModal(agent)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit3 size={14} className="mr-1" />
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Modal */}
        {showVerificationModal && selectedAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Verify CEA Registration
                </h3>
                
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Agent: <span className="font-medium">{selectedAgent.fullName}</span></div>
                  <div className="text-sm text-gray-600">CEA Number: <span className="font-mono">{selectedAgent.ceaRegistrationNumber}</span></div>
                  <a 
                    href="https://eservices.cea.gov.sg/aceas/public-register/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center mt-1"
                  >
                    Verify on CEA Website <ExternalLink size={12} className="ml-1" />
                  </a>
                </div>

                <form onSubmit={handleVerificationSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Status
                    </label>
                    <select
                      value={verificationForm.status}
                      onChange={(e) => setVerificationForm({...verificationForm, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="PENDING_MANUAL_VERIFICATION">Pending Verification</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="FAILED">Failed</option>
                      <option value="EXPIRED">Expired</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={verificationForm.expiryDate}
                      onChange={(e) => setVerificationForm({...verificationForm, expiryDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Notes
                    </label>
                    <textarea
                      value={verificationForm.notes}
                      onChange={(e) => setVerificationForm({...verificationForm, notes: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add verification notes..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowVerificationModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      Update Verification
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CEAVerificationManagement;