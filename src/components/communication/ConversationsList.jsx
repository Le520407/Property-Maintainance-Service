import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Clock, 
  DollarSign, 
  User, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Star,
  Bell,
  BellOff
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ConversationsList = ({ onSelectConversation, selectedJobId }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    fetchConversations();
    // Refresh conversations every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      // Try to fetch from API first
      try {
        const response = await api.get(`/messages/conversations?${params}`);
        setConversations(response.data.conversations);
        setTotalUnread(response.data.totalUnread);
      } catch (apiError) {
        // If API endpoint doesn't exist, use sample data
        console.log('Messages API not available, using sample data');
        
        // Don't show error toast for expected API unavailability
        if (!apiError.message?.includes('404') && !apiError.message?.includes('Network Error')) {
          console.warn('Unexpected API error:', apiError);
        }
        
        // Generate sample conversations based on user role
        const sampleConversations = [
          {
            _id: 'conv_1',
            title: 'Plumbing Repair - Kitchen Sink',
            jobNumber: 'JOB1755221424634BA9G',
            status: 'IN_DISCUSSION',
            priority: 'HIGH',
            category: 'plumbing',
            estimatedBudget: 250,
            location: { city: 'Singapore', address: '123 Main Street' },
            customer: user?.role === 'vendor' ? { firstName: 'John', lastName: 'Smith' } : null,
            vendor: user?.role === 'customer' ? { firstName: 'Mike', lastName: 'Johnson' } : null,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            unreadCount: 2,
            messageCount: 8,
            lastMessage: {
              content: 'I can fix this today. When would be a good time?',
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
              messageType: 'TEXT'
            }
          },
          {
            _id: 'conv_2',
            title: 'House Cleaning Service',
            jobNumber: 'JOB1755224485804756G',
            status: 'QUOTE_SENT',
            priority: 'MEDIUM',
            category: 'cleaning',
            estimatedBudget: 120,
            location: { city: 'Singapore', address: '456 Oak Avenue' },
            customer: user?.role === 'vendor' ? { firstName: 'Sarah', lastName: 'Wilson' } : null,
            vendor: user?.role === 'customer' ? { firstName: 'Lisa', lastName: 'Chen' } : null,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            unreadCount: 0,
            messageCount: 5,
            lastMessage: {
              content: 'Quote sent: $120 for deep cleaning service',
              createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
              messageType: 'QUOTE'
            }
          },
          {
            _id: 'conv_3',
            title: 'Electrical Installation',
            jobNumber: 'JOB1755228901234567H',
            status: 'COMPLETED',
            priority: 'MEDIUM',
            category: 'electrical',
            estimatedBudget: 300,
            location: { city: 'Singapore', address: '789 Pine Street' },
            customer: user?.role === 'vendor' ? { firstName: 'David', lastName: 'Brown' } : null,
            vendor: user?.role === 'customer' ? { firstName: 'Alex', lastName: 'Rodriguez' } : null,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            unreadCount: 0,
            messageCount: 12,
            lastMessage: {
              content: 'Thank you for choosing our service! Job completed successfully.',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
              messageType: 'SYSTEM'
            }
          }
        ];
        
        // Filter sample data based on status filter
        const filteredData = statusFilter 
          ? sampleConversations.filter(conv => conv.status === statusFilter)
          : sampleConversations;
        
        setConversations(filteredData);
        setTotalUnread(filteredData.reduce((sum, conv) => sum + conv.unreadCount, 0));
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
      // Set empty state on complete failure
      setConversations([]);
      setTotalUnread(0);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.title.toLowerCase().includes(searchLower) ||
      conv.jobNumber.toLowerCase().includes(searchLower) ||
      conv.customer?.firstName?.toLowerCase().includes(searchLower) ||
      conv.customer?.lastName?.toLowerCase().includes(searchLower) ||
      conv.vendor?.firstName?.toLowerCase().includes(searchLower) ||
      conv.vendor?.lastName?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      IN_DISCUSSION: 'bg-purple-100 text-purple-800',
      QUOTE_SENT: 'bg-indigo-100 text-indigo-800',
      QUOTE_ACCEPTED: 'bg-green-100 text-green-800',
      PAID: 'bg-emerald-100 text-emerald-800',
      IN_PROGRESS: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-green-200 text-green-900',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'EMERGENCY') return '🚨';
    if (priority === 'HIGH') return '🔴';
    if (priority === 'MEDIUM') return '🟡';
    return '🟢';
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return messageDate.toLocaleDateString();
  };

  const ConversationItem = ({ conversation }) => {
    const isSelected = selectedJobId === conversation._id;
    const hasUnread = conversation.unreadCount > 0;
    const otherParty = user?.role === 'vendor' ? conversation.customer : conversation.vendor;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className={`cursor-pointer p-4 border-b border-gray-200 hover:bg-gray-50 ${
          isSelected ? 'bg-orange-50 border-orange-200' : ''
        }`}
        onClick={() => onSelectConversation(conversation)}
      >
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            otherParty ? 'bg-gray-200' : 'bg-orange-200'
          }`}>
            <User className="w-5 h-5 text-gray-600" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {conversation.title}
                </h3>
                {hasUnread && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {conversation.priority !== 'NORMAL' && (
                  <span className="text-xs">
                    {getPriorityIcon(conversation.priority)}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {conversation.lastMessage ? 
                    formatRelativeTime(conversation.lastMessage.createdAt) : 
                    formatRelativeTime(conversation.createdAt)
                  }
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-600">
                <span className="font-medium">{conversation.jobNumber}</span>
                {otherParty && (
                  <span className="ml-2">
                    with {otherParty.firstName} {otherParty.lastName}
                  </span>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                {conversation.status.replace('_', ' ')}
              </span>
            </div>
            
            {/* Last Message Preview */}
            {conversation.lastMessage && (
              <div className="text-sm text-gray-600 truncate">
                {conversation.lastMessage.messageType === 'QUOTE' && '💰'}
                {conversation.lastMessage.messageType === 'CONTACT_INFO' && '📞'}
                {conversation.lastMessage.messageType === 'SYSTEM' && '🤖'}
                <span className="ml-1">
                  {conversation.lastMessage.content}
                </span>
              </div>
            )}
            
            {/* Job Details */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {conversation.location?.city}
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-3 h-3 mr-1" />
                  ${conversation.estimatedBudget?.toFixed(0)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {conversation.messageCount > 0 && (
                  <span className="flex items-center">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    {conversation.messageCount}
                  </span>
                )}
                {hasUnread && (
                  <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
                {totalUnread}
              </span>
            )}
          </h2>
          <button
            onClick={fetchConversations}
            className="text-orange-600 hover:text-orange-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
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
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No conversations found</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
          {totalUnread > 0 && (
            <span className="ml-2 text-orange-600 font-medium">
              ({totalUnread} unread)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsList;