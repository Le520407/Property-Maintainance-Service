import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageSquare,
  ArrowLeft,
  Send,
  Search,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock,
  User,
  Star,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const UnifiedMessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      // Mock data - replace with API call
      const mockConversations = [
        {
          id: '1',
          name: 'Swift Fix Pro Support',
          lastMessage: 'Thank you for contacting us. How can we help you today?',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          unreadCount: 1,
          avatar: null,
          isSupport: true,
          status: 'online'
        },
        {
          id: '2',
          name: 'John\'s Plumbing Service',
          lastMessage: 'I can come by tomorrow at 2 PM to fix your sink.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          unreadCount: 0,
          avatar: null,
          isVendor: true,
          status: 'offline',
          jobTitle: 'Kitchen Sink Repair - #JOB001'
        },
        {
          id: '3',
          name: 'CleanPro Services',
          lastMessage: 'Your house cleaning is scheduled for Friday at 10 AM.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          unreadCount: 0,
          avatar: null,
          isVendor: true,
          status: 'offline',
          jobTitle: 'House Cleaning - #JOB002'
        }
      ];

      setConversations(mockConversations);
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0]);
        loadMessages(mockConversations[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      // Mock messages - replace with API call
      const mockMessages = [
        {
          id: '1',
          senderId: 'support',
          senderName: 'Swift Fix Pro Support',
          message: 'Hello! Welcome to Swift Fix Pro. How can we assist you today?',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          isOwn: false,
          status: 'read'
        },
        {
          id: '2',
          senderId: user?.id,
          senderName: user?.name,
          message: 'Hi, I need help with my recent order.',
          timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
          isOwn: true,
          status: 'read'
        },
        {
          id: '3',
          senderId: 'support',
          senderName: 'Swift Fix Pro Support',
          message: 'I\'d be happy to help you with your order. Could you please provide your order number?',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          isOwn: false,
          status: 'delivered'
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageData = {
      id: Date.now().toString(),
      senderId: user?.id,
      senderName: user?.name,
      message: newMessage.trim(),
      timestamp: new Date(),
      isOwn: true,
      status: 'sending'
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage('');

    // Simulate API call
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageData.id 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );
    }, 1000);

    toast.success('Message sent!');
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
      <div className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 text-white shadow-lg relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-6 right-10 w-22 h-22 bg-white rounded-full"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-10 left-6 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white rounded-full"></div>
          <div className="absolute top-16 left-24 w-10 h-10 bg-white rounded-full"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <h1 className="text-3xl font-bold mb-2">Messages</h1>
                  <p className="text-green-100 text-lg">Communication with service providers</p>
                </div>
              </div>
            </div>
            
            {/* Message Status Indicators */}
            <div className="hidden md:flex space-x-4">
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">{conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}</div>
                <div className="text-xs text-green-100">Unread</div>
              </div>
              <div className="text-center bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">{conversations.length}</div>
                <div className="text-xs text-green-100">Total</div>
              </div>
            </div>
          </div>
          
          {/* Quick Message Actions */}
          <div className="mt-6 flex space-x-3">
            <button className="bg-white bg-opacity-20 px-4 py-2 rounded-lg text-sm hover:bg-opacity-30 transition-colors">
              ✉️ Contact Support
            </button>
            <button className="bg-white bg-opacity-20 px-4 py-2 rounded-lg text-sm hover:bg-opacity-30 transition-colors">
              📞 Emergency Contact
            </button>
          </div>
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
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 text-sm">{conversation.name}</h4>
                            <span className="text-xs text-gray-500">{formatTimestamp(conversation.timestamp)}</span>
                          </div>
                          {conversation.jobTitle && (
                            <p className="text-xs text-green-600 mb-1">{conversation.jobTitle}</p>
                          )}
                          <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                        </div>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="ml-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </div>
                      )}
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
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isOwn 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.message}</p>
                          <div className={`flex items-center justify-between mt-1 ${
                            message.isOwn ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">{formatTimestamp(message.timestamp)}</span>
                            {message.isOwn && (
                              <div className="ml-2">
                                {message.status === 'sending' && <Clock className="w-3 h-3" />}
                                {message.status === 'delivered' && <Check className="w-3 h-3" />}
                                {message.status === 'read' && <CheckCheck className="w-3 h-3" />}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
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
                        disabled={!newMessage.trim()}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
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

        {/* Empty state when no conversations */}
        {conversations.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600 mb-6">Start a conversation with service providers or support</p>
            <button className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              <Plus className="w-5 h-5 mr-2" />
              Start New Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedMessagesPage;