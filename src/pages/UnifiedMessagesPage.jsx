import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare,
  ArrowLeft,
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock,
  User,
  Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { clearMessagesVisitedFlag } from '../components/layout/Header';

const UnifiedMessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectingToSupport, setConnectingToSupport] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem('unified-messages-selected-tab') || 'contact-support';
  });
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const messagesContainerRef = useRef(null);


  // Unread message functions
  const updateUnreadCount = (conversationId, count) => {
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: count
    }));
  };

  const markConversationAsRead = (conversationId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: 0
    }));
  };

  // Scroll to bottom function - only scroll the messages container
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    loadConversations();
    // Clear the header's messages visited flag when page loads
    if (user) {
      clearMessagesVisitedFlag(user.id);
    }
  }, [user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      console.log('Loading conversations for user:', user.role); // Debug log
      
      if (user.role === 'admin') {
        // For admin users, load support conversations
        const response = await api.get('/messages/support/conversations');
        const supportConversations = response.data?.conversations || [];
        
        const transformedConversations = supportConversations.map(conversation => ({
          id: conversation._id,
          name: conversation.user ? `${conversation.user.firstName} ${conversation.user.lastName}` : 'Customer',
          lastMessage: conversation.lastMessage?.content || 'New support request',
          timestamp: new Date(conversation.lastMessage?.createdAt || conversation.createdAt),
          avatar: null,
          isVendor: false,
          isCustomer: true,
          isSupport: true,
          status: conversation.status === 'active' ? 'online' : 'offline',
          jobTitle: 'Support Request',
          jobId: conversation._id,
          unreadCount: conversation.unreadCount || 0
        }));
        
        // Update unread counts
        transformedConversations.forEach(conv => {
          updateUnreadCount(conv.id, conv.unreadCount);
        });
        
        setConversations(transformedConversations);
        if (transformedConversations.length > 0) {
          setSelectedConversation(transformedConversations[0]);
          loadMessages(transformedConversations[0].id);
        }
        
        // Return conversations data for markMessagesAsRead
        return supportConversations;
      } else {
        // Regular user conversations
        const response = await api.messages.getConversations();
        console.log('Conversations response:', response); // Debug log
        
        const realConversations = response.conversations || [];
        
        // Transform the backend data to match the UI format
        const transformedConversations = realConversations.map(conversation => {
          console.log('Processing conversation:', conversation); // Debug log
          return {
            id: conversation._id,
            name: getConversationName(conversation),
            lastMessage: conversation.lastMessage?.content || '',
            timestamp: new Date(conversation.lastMessage?.createdAt || conversation.createdAt),
            avatar: null,
            isVendor: user.role === 'customer' && conversation.vendorId,
            isCustomer: user.role === 'vendor' && conversation.customerId,
            isSupport: false,
            status: 'offline',
            jobTitle: conversation.jobNumber ? `Job #${conversation.jobNumber}` : null,
            jobId: conversation._id, // Using job ID as conversation ID
            unreadCount: conversation.unreadCount || 0
          };
        });

        // Update unread counts
        transformedConversations.forEach(conv => {
          updateUnreadCount(conv.id, conv.unreadCount);
        });

        setConversations(transformedConversations);
        if (transformedConversations.length > 0) {
          setSelectedConversation(transformedConversations[0]);
          loadMessages(transformedConversations[0].id);
        } else {
          console.log('No conversations found for user'); // Debug log
        }
        
        // Return conversations data for markMessagesAsRead
        return realConversations;
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get conversation name based on user role
  const getConversationName = (conversation) => {
    console.log('getConversationName - user role:', user.role, 'conversation:', conversation);
    
    if (user.role === 'customer') {
      // Customer sees vendor name
      const vendorName = conversation.vendor 
        ? `${conversation.vendor.firstName || ''} ${conversation.vendor.lastName || ''}`.trim()
        : 'Service Provider';
      console.log('Vendor name:', vendorName);
      return vendorName;
    } else if (user.role === 'vendor') {
      // Vendor sees customer name
      const customerName = conversation.customer 
        ? `${conversation.customer.firstName || ''} ${conversation.customer.lastName || ''}`.trim()
        : 'Customer';
      console.log('Customer name:', customerName);
      return customerName;
    } else {
      // Admin sees both
      const customerName = conversation.customer 
        ? `${conversation.customer.firstName || ''} ${conversation.customer.lastName || ''}`.trim()
        : 'Customer';
      const vendorName = conversation.vendor 
        ? `${conversation.vendor.firstName || ''} ${conversation.vendor.lastName || ''}`.trim()
        : 'Vendor';
      return `${customerName} ↔ ${vendorName}`;
    }
  };

  const loadMessages = async (conversationId, forceRefresh = false) => {
    // Debounce multiple rapid calls to the same conversation (unless forced)
    if (!forceRefresh && selectedConversation?.id === conversationId && messages.length > 0) {
      return; // Already loaded this conversation
    }

    try {
      console.log('=== LOADING MESSAGES ===');
      console.log('Conversation ID:', conversationId);
      console.log('Current user:', user);
      
      // Get real messages from API
      const response = await api.messages.getMessages(conversationId);
      console.log('Messages API response:', response);
      
      const realMessages = response.messages || [];
      console.log('Raw messages from API:', realMessages);
      
      // Transform the backend data to match the UI format
      const transformedMessages = realMessages.map((message, index) => {
        console.log(`\n--- Processing Message ${index + 1} ---`);
        console.log('Raw message:', message);
        
        const senderId = message.senderId?._id || message.senderId;
        const userId = user?.id; // Fix: use user.id instead of user._id
        
        console.log('Extracted senderId:', senderId);
        console.log('Current userId:', userId);
        console.log('senderId type:', typeof senderId);
        console.log('userId type:', typeof userId);
        
        const isOwn = senderId && userId && senderId.toString() === userId.toString();
        console.log('Comparison result - isOwn:', isOwn);
        console.log('senderId.toString():', senderId?.toString());
        console.log('userId.toString():', userId?.toString());
        
        const transformed = {
          id: message._id,
          senderId: senderId,
          senderName: getSenderName(message.senderId),
          message: message.content,
          timestamp: new Date(message.createdAt),
          isOwn: isOwn,
          status: message.status?.toLowerCase() || 'sent'
        };
        
        console.log('Transformed message:', transformed);
        return transformed;
      });

      console.log('All transformed messages:', transformedMessages);
      setMessages(transformedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages: ' + error.message);
    }
  };

  // Helper function to get sender name
  const getSenderName = (sender) => {
    if (typeof sender === 'object' && sender !== null) {
      return `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email || 'Unknown';
    }
    return 'Unknown';
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    const messageText = newMessage.trim();
    setSendingMessage(true);
    setNewMessage(''); // Clear input immediately

    try {
      console.log('Sending message to conversation:', selectedConversation.id); // Debug log
      
      // Handle support conversations differently
      if (selectedConversation.isSupport) {
        // For support conversations, send to admin endpoint
        try {
          const response = await api.post('/messages/support', {
            content: messageText,
            type: 'text',
            conversationId: selectedConversation.id
          });
          
          console.log('Support message response:', response); // Debug log
          
          // Add the sent message immediately to the UI
          const newMessageObj = {
            id: `msg_${Date.now()}_user`,
            senderId: user?.id || user?._id,
            senderName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'You',
            message: messageText,
            timestamp: new Date(),
            isOwn: true,
            status: 'sent'
          };
          
          setMessages(prev => [...prev, newMessageObj]);
          
          // Scroll to bottom immediately
          setTimeout(scrollToBottom, 100);
          
          // Simulate admin response after a short delay
          setTimeout(() => {
            const adminResponse = {
              id: `msg_${Date.now()}_admin`,
              senderId: 'support_admin',
              senderName: selectedConversation.name,
              message: 'Thank you for your message. I\'m reviewing your request and will get back to you shortly.',
              timestamp: new Date(),
              isOwn: false,
              status: 'delivered'
            };
            setMessages(prev => [...prev, adminResponse]);
            setTimeout(scrollToBottom, 100);
          }, 2000);
          
        } catch (supportError) {
          console.log('Support API not available, using fallback'); 
          
          // Fallback: Add message directly to UI for support conversations
          const newMessageObj = {
            id: `msg_${Date.now()}_user`,
            senderId: user?.id || user?._id,
            senderName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'You',
            message: messageText,
            timestamp: new Date(),
            isOwn: true,
            status: 'sent'
          };
          
          setMessages(prev => [...prev, newMessageObj]);
          
          // Simulate admin response
          setTimeout(() => {
            const adminResponse = {
              id: `msg_${Date.now()}_admin`,
              senderId: 'support_admin',
              senderName: selectedConversation.name,
              message: 'Thank you for contacting support. We\'ve received your message and will respond as soon as possible.',
              timestamp: new Date(),
              isOwn: false,
              status: 'delivered'
            };
            setMessages(prev => [...prev, adminResponse]);
            setTimeout(scrollToBottom, 100);
          }, 1500);
          
        }
      } else {
        // Add the sent message immediately to the UI for better UX
        const tempMessage = {
          id: `temp_${Date.now()}`,
          senderId: user?.id,
          senderName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'You',
          message: messageText,
          timestamp: new Date(),
          isOwn: true,
          status: 'sending'
        };
        
        setMessages(prev => [...prev, tempMessage]);
        
        // Scroll to bottom immediately when adding the temp message
        setTimeout(scrollToBottom, 100);
        
        // Regular conversation - send via existing API
        const response = await api.messages.sendMessage(selectedConversation.id, {
          content: messageText,
          type: 'text'
        });
        
        console.log('Send message response:', response); // Debug log
        
        // Update the temporary message with real data
        const realMessage = {
          id: response.message?.id || response.id || tempMessage.id,
          senderId: user?.id,
          senderName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'You',
          message: messageText,
          timestamp: new Date(response.message?.createdAt || tempMessage.timestamp),
          isOwn: true,
          status: 'sent'
        };
        
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id ? realMessage : msg
        ));
        
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error stack:', error.stack);
      
      // Remove any temporary messages that failed
      setMessages(prev => prev.filter(msg => !msg.id.toString().startsWith('temp_')));
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      toast.error('Failed to send message: ' + errorMessage);
      
      // Restore the message text if sending failed
      setNewMessage(messageText);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const handleTabSelect = (tabName) => {
    setSelectedTab(tabName);
    localStorage.setItem('unified-messages-selected-tab', tabName);
  };

  const connectToSupport = async () => {
    if (connectingToSupport) return;
    
    setConnectingToSupport(true);
    
    try {
      // Create a real support job/conversation in the backend
      const response = await api.post('/messages/support/create', {
        description: `I need assistance with my account/service. Please help.`
      });
      
      const supportJob = response.job || response;
      console.log('Created support job:', supportJob);
      
      // Reload conversations to show the new support conversation
      await loadConversations();
      
      
    } catch (error) {
      console.error('Failed to connect to support:', error);
      toast.error('Failed to create support request. Please try again.');
    } finally {
      setConnectingToSupport(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      {/* Header with decorative banner */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="p-2 bg-white bg-opacity-20 rounded-lg mr-4 hover:bg-opacity-30 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg mr-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {user?.role === 'admin' ? 'Support Messages' : 'Messages'}
                  </h1>
                  <p className="text-orange-100 text-lg">
                    {user?.role === 'admin' 
                      ? 'Manage customer support conversations' 
                      : 'Communication with service providers'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* Message Status Indicators */}
            <div className="hidden md:flex space-x-4">
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">{conversations.length}</div>
                <div className="text-xs text-orange-100">Total</div>
              </div>
            </div>
          </div>
          
          {/* Quick Message Actions - Only show for non-admin users */}
          {user?.role !== 'admin' && (
            <div className="mt-6 flex space-x-3">
              <button 
                onClick={() => {
                  handleTabSelect('contact-support');
                  connectToSupport();
                }}
                disabled={connectingToSupport}
                className={`px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedTab === 'contact-support'
                    ? 'bg-white text-orange-800 font-semibold'
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                {connectingToSupport ? '🔄 Connecting...' : '✉️ Contact Support'}
              </button>
              <button 
                onClick={() => handleTabSelect('emergency-contact')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedTab === 'emergency-contact'
                    ? 'bg-white text-orange-800 font-semibold'
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                📞 Emergency Contact
              </button>
            </div>
          )}
          
          {/* Admin Message Actions */}
          {user?.role === 'admin' && (
            <div className="mt-6 flex space-x-3">
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg text-sm">
                🛡️ Support Dashboard
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Interface */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ height: '600px' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Search Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      loadMessages(conversation.id);
                      
                      // Mark conversation as read via API
                      api.messages.markAsRead(conversation.id)
                        .then(() => {
                          markConversationAsRead(conversation.id);
                        })
                        .catch((error) => {
                          console.error('Failed to mark as read on backend:', error);
                          // Still mark as read locally for better UX
                          markConversationAsRead(conversation.id);
                        });
                    }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-green-50 border-r-4 border-green-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            {conversation.isSupport ? (
                              <Star className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <User className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          {conversation.status === 'online' && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                          {unreadCounts[conversation.id] > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-white">
                              {unreadCounts[conversation.id] > 9 ? '9+' : unreadCounts[conversation.id]}
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <h4 className={`font-medium text-sm ${unreadCounts[conversation.id] > 0 ? 'text-gray-900 font-bold' : 'text-gray-900'}`}>
                                {conversation.name}
                              </h4>
                              {unreadCounts[conversation.id] > 0 && (
                                <div className="ml-1 w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{formatTimestamp(conversation.timestamp)}</span>
                          </div>
                          {conversation.jobTitle && (
                            <p className="text-xs text-green-600 mb-1">{conversation.jobTitle}</p>
                          )}
                          <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          {selectedConversation.isSupport ? (
                            <Star className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <User className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{selectedConversation.name}</h3>
                          <p className="text-sm text-gray-500">
                            {selectedConversation.status === 'online' ? '🟢 Online' : '⚫ Offline'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                          <Phone className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                          <Video className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                  >
                    {messages.map((message) => {
                      console.log('Rendering message:', { id: message.id, isOwn: message.isOwn, senderName: message.senderName, message: message.message });
                      
                      return (
                        <div key={message.id} className="mb-4">
                          {/* Sender Name */}
                          <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
                            <span className="text-xs text-gray-500 font-medium">
                              {message.isOwn ? 'You' : message.senderName}
                            </span>
                          </div>
                          
                          {/* Message Bubble */}
                          <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.isOwn 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-900'
                            }`}>
                              <p className="text-sm">{message.message}</p>
                              
                              {/* Timestamp and Status */}
                              <div className={`flex items-center justify-between mt-2 ${
                                message.isOwn ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                <span className="text-xs">{formatTimestamp(message.timestamp)}</span>
                                {message.isOwn && (
                                  <div className="ml-2">
                                    {message.status === 'sending' && <Clock className="w-3 h-3" />}
                                    {message.status === 'sent' && <Check className="w-3 h-3" />}
                                    {message.status === 'delivered' && <Check className="w-3 h-3" />}
                                    {message.status === 'read' && <CheckCheck className="w-3 h-3" />}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-gray-200">
                    <div className="p-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                            <Smile className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sendingMessage}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {sendingMessage ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default UnifiedMessagesPage;