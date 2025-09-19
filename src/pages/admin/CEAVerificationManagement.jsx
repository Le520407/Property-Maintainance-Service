import {
  AlertTriangle,
  CheckCircle,
  CheckSquare,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  Filter,
  Link,
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
  const [showVerificationTools, setShowVerificationTools] = useState(false);
  const [verificationTools, setVerificationTools] = useState(null);
  const [loadingTools, setLoadingTools] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    status: '',
    notes: '',
    expiryDate: ''
  });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [ceaSearchTerm, setCeaSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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

  const searchByCEACode = async () => {
    if (!ceaSearchTerm.trim()) {
      toast.error('Please enter a CEA registration number to search');
      return;
    }

    try {
      setIsSearching(true);
      console.log('Searching for CEA code:', ceaSearchTerm.trim());
      
      const response = await api.get(`/admin/agents/search-cea/${encodeURIComponent(ceaSearchTerm.trim())}`);
      
      console.log('Search response:', response);
      
      // Handle the response more safely
      const agents = response?.data || response || [];
      setAgents(Array.isArray(agents) ? agents : []);
      
      if (!agents || agents.length === 0) {
        toast.success('No agents found with that CEA registration number');
      } else {
        toast.success(`Found ${agents.length} agent(s) with CEA number: ${ceaSearchTerm}`);
      }
    } catch (error) {
      console.error('Error searching by CEA code:', error);
      console.error('Error details:', error.response || error.message);
      
      // Set empty array on error
      setAgents([]);
      
      if (error.response?.status === 404) {
        toast.error('Search endpoint not found. Please check if the backend server is running.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error('Failed to search by CEA code: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setCeaSearchTerm('');
    fetchAgents(); // Reload all agents
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

  const openVerificationTools = async (agent) => {
    setSelectedAgent(agent);
    setLoadingTools(true);
    setShowVerificationTools(true);
    
    try {
      const response = await api.get(`/admin/agents/${agent._id}/verification-tools`);
      setVerificationTools(response.data);
    } catch (error) {
      console.error('Error fetching verification tools:', error);
      toast.error('Failed to load verification tools');
      setVerificationTools(null);
    } finally {
      setLoadingTools(false);
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

  const getFraudRiskBadge = (riskLevel, warnings = []) => {
    const riskMap = {
      'LOW': {
        color: 'bg-green-100 text-green-800',
        icon: Shield,
        text: 'Low Risk'
      },
      'MEDIUM': {
        color: 'bg-yellow-100 text-yellow-800',
        icon: AlertTriangle,
        text: 'Medium Risk'
      },
      'HIGH': {
        color: 'bg-red-100 text-red-800',
        icon: AlertTriangle,
        text: 'High Risk'
      }
    };

    const config = riskMap[riskLevel] || riskMap['LOW'];
    const IconComponent = config.icon;

    return (
      <div className="flex flex-col">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          <IconComponent size={12} className="mr-1" />
          {config.text}
        </span>
        {warnings && warnings.length > 0 && (
          <span className="text-xs text-red-600 mt-1" title={warnings.join(', ')}>
            {warnings.length} warning{warnings.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
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

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="space-y-4">
            {/* CEA Code Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by CEA Registration Number
                </label>
                <div className="relative">
                  <Shield size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter CEA registration number (e.g. R123456A)"
                    value={ceaSearchTerm}
                    onChange={(e) => setCeaSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchByCEACode()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={searchByCEACode}
                  disabled={isSearching || !ceaSearchTerm.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Search CEA
                    </>
                  )}
                </button>
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Show All
                </button>
              </div>
            </div>

            {/* General Search and Status Filter */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  General Search
                </label>
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Filter
                  </label>
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
                    Security Risk
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
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      Loading agents...
                    </td>
                  </tr>
                ) : filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getFraudRiskBadge(
                          agent.ceaFraudRiskLevel || 'LOW', 
                          agent.ceaFraudWarnings || []
                        )}
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
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openVerificationTools(agent)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            title="Open verification tools and checklist"
                          >
                            <Eye size={14} className="mr-1" />
                            Tools
                          </button>
                          <button
                            onClick={() => openVerificationModal(agent)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Edit3 size={14} className="mr-1" />
                            Verify
                          </button>
                        </div>
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

        {/* Verification Tools Modal */}
        {showVerificationTools && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white"
            >
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    CEA Verification Tools
                  </h3>
                  <button
                    onClick={() => setShowVerificationTools(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {loadingTools ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading verification tools...</p>
                  </div>
                ) : verificationTools ? (
                  <div className="space-y-6">
                    {/* Agent Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-lg mb-2">Agent Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium">{verificationTools.agent.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">CEA Number</p>
                          <p className="font-mono font-medium">{verificationTools.agent.ceaNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{verificationTools.agent.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Risk Level</p>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            verificationTools.agent.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                            verificationTools.agent.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {verificationTools.agent.riskLevel}
                          </span>
                        </div>
                      </div>
                      {verificationTools.agent.warnings.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-1">Security Warnings</p>
                          <ul className="text-sm text-red-600">
                            {verificationTools.agent.warnings.map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-lg mb-3">Quick Verification Links</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">CEA Public Register</p>
                            <p className="text-sm text-gray-600">Official CEA database search</p>
                          </div>
                          <a
                            href={verificationTools.quickActions.ceaSearch.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                          >
                            <ExternalLink size={16} className="mr-1" />
                            Search CEA
                          </a>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Google Search</p>
                            <p className="text-sm text-gray-600">Find additional information online</p>
                          </div>
                          <a
                            href={verificationTools.quickActions.googleSearch.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                          >
                            <ExternalLink size={16} className="mr-1" />
                            Google Search
                          </a>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">LinkedIn Search</p>
                            <p className="text-sm text-gray-600">Verify professional background</p>
                          </div>
                          <a
                            href={verificationTools.quickActions.linkedinSearch.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                          >
                            <ExternalLink size={16} className="mr-1" />
                            LinkedIn
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Verification Steps */}
                    <div className="bg-white border p-4 rounded-lg">
                      <h4 className="font-semibold text-lg mb-3">Verification Checklist</h4>
                      <div className="space-y-4">
                        {verificationTools.verificationTools.verificationSteps.map((step) => (
                          <div key={step.step} className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">
                                  Step {step.step}: {step.title}
                                  {step.critical && <span className="text-red-500 ml-1">*</span>}
                                </h5>
                                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                                <p className="text-sm font-medium text-blue-600 mt-1">{step.action}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Checkpoints:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {step.checkpoints.map((checkpoint, index) => (
                                  <li key={index} className="flex items-center">
                                    <CheckSquare size={12} className="mr-2 text-gray-400" />
                                    {checkpoint}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    {verificationTools.verificationTools.recommendations.length > 0 && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-3">Verification Recommendations</h4>
                        <div className="space-y-2">
                          {verificationTools.verificationTools.recommendations.map((rec, index) => (
                            <div key={index} className={`p-2 rounded border-l-4 ${
                              rec.priority === 'CRITICAL' ? 'border-red-500 bg-red-50' :
                              rec.priority === 'HIGH' ? 'border-orange-500 bg-orange-50' :
                              'border-yellow-500 bg-yellow-50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">{rec.action}</p>
                                  <p className="text-sm text-gray-600">{rec.description}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  rec.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                  rec.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {rec.priority}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Failed to load verification tools</p>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowVerificationTools(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CEAVerificationManagement;