import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Phone, 
  Mail, 
  DollarSign, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Image as ImageIcon,
  Paperclip,
  MoreVertical,
  Star,
  AlertCircle,
  CheckCircle,
  User,
  CreditCard
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const JobChat = ({ job, onClose, onJobUpdate, hideHeader = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [previousMessagesLength, setPreviousMessagesLength] = useState(0);
  const messagesEndRef = useRef(null);


  // Contact form state
  const [contactForm, setContactForm] = useState({
    phone: user?.phone || '',
    email: user?.email || '',
    preferredContactMethod: 'phone',
    availableTimes: ''
  });

  const isVendor = user?.role === 'vendor' || user?.role === 'technician';
  const isCustomer = user?.role === 'customer';
  const otherParty = isVendor 
    ? { ...job.customerId, role: 'customer' }
    : { ...job.vendorId, role: 'vendor' };

  useEffect(() => {
    setPreviousMessagesLength(0); // Reset message count when switching conversations
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [job._id]);

  useEffect(() => {
    // Only auto-scroll when there are NEW messages AND we have a previous count
    // This prevents scrolling on initial load or conversation switch
    if (messages.length > previousMessagesLength && previousMessagesLength > 0) {
      const messagesContainer = messagesEndRef.current?.parentElement;
      if (messagesContainer) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
        
        // Only scroll if user is very close to the bottom
        if (isNearBottom) {
          setTimeout(() => scrollToBottom(), 50);
        }
      }
    }
    
    // Update the previous message count (but don't track on first load)
    if (messages.length > 0) {
      setPreviousMessagesLength(messages.length);
    }
  }, [messages, previousMessagesLength]);

  const fetchMessages = async () => {
    try {
      // Try to fetch messages from API
      try {
        const response = await api.get(`/messages/job/${job._id}`);
        setMessages(response.data.messages || response.messages || []);
      } catch (apiError) {
        console.log('Messages API not available, using sample data with localStorage persistence');
        
        // Try to load messages from localStorage first
        const savedMessages = localStorage.getItem(`messages_${job._id}`);
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
          setLoading(false);
          return;
        }
        
        // Generate sample messages based on job status and user role
        const sampleMessages = [
          {
            _id: 'msg_1',
            content: `Hello! I'm interested in your ${job.category} service for my property at ${job.location?.address || job.location?.city}.`,
            messageType: 'TEXT',
            senderId: job.customer?._id || 'customer_id',
            senderRole: 'customer',
            senderName: job.customer ? `${job.customer.firstName} ${job.customer.lastName}` : 'Customer',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            priority: 'NORMAL'
          },
          {
            _id: 'msg_2',
            content: `Hi! I'd be happy to help with your ${job.title}. Can you tell me more about the specific issue?`,
            messageType: 'TEXT',
            senderId: job.vendor?._id || 'vendor_id',
            senderRole: 'vendor',
            senderName: job.vendor ? `${job.vendor.firstName} ${job.vendor.lastName}` : 'Vendor',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            priority: 'NORMAL'
          },
          {
            _id: 'msg_3',
            content: `The kitchen sink has been leaking for a few days. It seems to be coming from under the basin. I'm available this week for the repair.`,
            messageType: 'TEXT',
            senderId: job.customer?._id || 'customer_id',
            senderRole: 'customer',
            senderName: job.customer ? `${job.customer.firstName} ${job.customer.lastName}` : 'Customer',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            priority: 'NORMAL'
          }
        ];
        
        // Add status update message if job has pricing
        if ((job.status === 'QUOTED' || job.status === 'ACCEPTED') && job.totalAmount) {
          sampleMessages.push({
            _id: 'msg_4',
            content: `Job status updated: Price set to $${job.totalAmount} for ${job.title}. Ready to proceed when you're ready!`,
            messageType: 'SYSTEM',
            senderId: job.vendor?._id || 'vendor_id',
            senderRole: 'vendor',
            senderName: job.vendor ? `${job.vendor.firstName} ${job.vendor.lastName}` : 'Vendor',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            priority: 'NORMAL'
          });
        }
        
        setMessages(sampleMessages);
        // Save to localStorage
        localStorage.setItem(`messages_${job._id}`, JSON.stringify(sampleMessages));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageData) => {
    try {
      setSending(true);
      
      // Try to send via API first
      try {
        const response = await api.post(`/messages/job/${job._id}`, messageData);
        setMessages(prev => [...prev, response.data.data || response.data || response]);
        setNewMessage('');
        
        // Update job status if needed
        if (messageData.messageType === 'QUOTE' && onJobUpdate) {
          onJobUpdate({ ...job, status: 'QUOTE_SENT' });
        }
        
        // Force scroll to bottom for sent messages
        setTimeout(() => scrollToBottom(), 100);
        
        toast.success('Message sent!');
      } catch (apiError) {
        console.log('Messages API not available, simulating message send');
        
        // Simulate message sending with local state
        const newMessageObj = {
          _id: `msg_${Date.now()}`,
          content: messageData.content,
          messageType: messageData.messageType,
          senderId: user?.id || user?._id,
          senderRole: user?.role,
          senderName: user?.firstName ? `${user.firstName} ${user.lastName}` : user?.name || user?.email,
          createdAt: new Date().toISOString(),
          priority: messageData.priority || 'NORMAL',
          ...(messageData.quoteData && { quoteData: messageData.quoteData })
        };
        
        const updatedMessages = [...messages, newMessageObj];
        setMessages(updatedMessages);
        setNewMessage('');
        
        // Save to localStorage for persistence
        localStorage.setItem(`messages_${job._id}`, JSON.stringify(updatedMessages));
        
        // Update job status if needed
        if (messageData.messageType === 'QUOTE' && onJobUpdate) {
          onJobUpdate({ ...job, status: 'QUOTE_SENT' });
        }
        
        // Force scroll to bottom for sent messages
        setTimeout(() => scrollToBottom(), 100);
        
        toast.success('Message sent! (Demo mode)');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSendText = () => {
    if (!newMessage.trim()) return;
    
    sendMessage({
      content: newMessage,
      messageType: 'TEXT',
      priority: 'NORMAL'
    });
  };


  const handleSendContact = () => {
    const content = `Contact Information Shared:\nPhone: ${contactForm.phone}\nEmail: ${contactForm.email}\nPreferred: ${contactForm.preferredContactMethod}\nAvailable: ${contactForm.availableTimes}`;
    
    sendMessage({
      content,
      messageType: 'CONTACT_INFO',
      priority: 'HIGH',
      contactInfo: contactForm
    });
    
    setShowContactForm(false);
  };



  const MessageBubble = ({ message }) => {
    const isSender = message.senderId._id === user._id;
    const isSystem = message.messageType === 'SYSTEM';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex mb-4 ${isSender ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isSystem 
            ? 'bg-gray-100 text-gray-600 mx-auto text-center'
            : isSender 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-200 text-gray-800'
        }`}>
          {!isSystem && (
            <div className="flex items-center mb-1">
              <User className="w-3 h-3 mr-1" />
              <span className="text-xs font-medium">
                {message.senderId.firstName} {message.senderId.lastName}
              </span>
              <span className="text-xs ml-2 opacity-75">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
          )}
          
          <div className="text-sm">
            {message.content}
          </div>
          
          
          {/* Contact Info Details */}
          {message.messageType === 'CONTACT_INFO' && message.contactInfo && (
            <div className="mt-2 p-2 bg-white bg-opacity-20 rounded text-xs">
              <div>📞 {message.contactInfo.phone}</div>
              <div>📧 {message.contactInfo.email}</div>
              <div>⏰ {message.contactInfo.availableTimes}</div>
            </div>
          )}
          
          {/* Message Status */}
          {isSender && (
            <div className="text-xs mt-1 opacity-75 text-right">
              {message.status === 'read' ? '✓✓' : '✓'}
            </div>
          )}
        </div>
      </motion.div>
    );
  };


  const ContactForm = () => (
    <div className="border-t border-gray-200 p-4 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Share Contact Information</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={contactForm.phone}
              onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Contact Method
          </label>
          <select
            value={contactForm.preferredContactMethod}
            onChange={(e) => setContactForm(prev => ({ ...prev, preferredContactMethod: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="phone">Phone Call</option>
            <option value="email">Email</option>
            <option value="message">Platform Messages</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Times
          </label>
          <textarea
            value={contactForm.availableTimes}
            onChange={(e) => setContactForm(prev => ({ ...prev, availableTimes: e.target.value }))}
            placeholder="When are you available for calls or meetings?"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowContactForm(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendContact}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Share Contact Info
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header - Only show if not hidden */}
      {!hideHeader && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {job.title} ({job.jobNumber})
              </h2>
              <div className="text-sm text-gray-600">
                Chatting with {otherParty.firstName} {otherParty.lastName}
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  {otherParty.role}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                job.status === 'QUOTED' ? 'bg-blue-100 text-blue-800' :
                job.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                job.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' :
                job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {job.status.replace('_', ' ')}
              </span>
              
              {/* Pay Now Button - Only show for customers when job is accepted and has price */}
              {user?.role === 'customer' && job.status === 'ACCEPTED' && job.totalAmount && (
                <button
                  onClick={() => navigate(`/payment/${job._id}`)}
                  className="flex items-center px-3 py-1 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
                >
                  <CreditCard className="w-3 h-3 mr-1" />
                  Pay Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="mb-4">💬</div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message._id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Contact Form */}
      {showContactForm && <ContactForm />}

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        {/* Action Buttons */}
        {(isVendor || isCustomer) && (
          <div className="flex space-x-2 mb-3">
            <button
              onClick={() => setShowContactForm(!showContactForm)}
              className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200"
            >
              <Phone className="w-4 h-4 mr-1" />
              Share Contact
            </button>
          </div>
        )}

        {/* Text Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          />
          <button
            onClick={handleSendText}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobChat;