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
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [previousMessagesLength, setPreviousMessagesLength] = useState(0);
  const messagesEndRef = useRef(null);

  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    amount: '',
    description: '',
    breakdown: [{ item: '', quantity: 1, unitPrice: 0 }],
    validUntil: '',
    terms: '',
    estimatedDuration: '',
    includes: [''],
    excludes: ['']
  });

  // Contact form state
  const [contactForm, setContactForm] = useState({
    phone: user?.phone || '',
    email: user?.email || '',
    preferredContactMethod: 'phone',
    availableTimes: ''
  });

  const isVendor = user?.role === 'vendor';
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
        console.log('Messages API not available, using sample data');
        
        // Generate sample messages based on job status and user role
        const sampleMessages = [
          {
            _id: 'msg_1',
            content: `Hello! I'm interested in your ${job.category} service for my property at ${job.location?.address || job.location?.city}.`,
            messageType: 'TEXT',
            senderId: job.customer?._id || 'customer_id',
            senderRole: 'customer',
            senderName: job.customer ? `${job.customer.firstName} ${job.customer.lastName}` : 'Customer',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            priority: 'NORMAL'
          },
          {
            _id: 'msg_2',
            content: `Hi! I'd be happy to help with your ${job.title}. Can you tell me more about the specific issue?`,
            messageType: 'TEXT',
            senderId: job.vendor?._id || 'vendor_id',
            senderRole: 'vendor',
            senderName: job.vendor ? `${job.vendor.firstName} ${job.vendor.lastName}` : 'Vendor',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
            priority: 'NORMAL'
          },
          {
            _id: 'msg_3',
            content: `The kitchen sink has been leaking for a few days. It seems to be coming from under the basin. I'm available this week for the repair.`,
            messageType: 'TEXT',
            senderId: job.customer?._id || 'customer_id',
            senderRole: 'customer',
            senderName: job.customer ? `${job.customer.firstName} ${job.customer.lastName}` : 'Customer',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            priority: 'NORMAL'
          }
        ];
        
        // Add quote message if status indicates quote was sent
        if (job.status === 'QUOTE_SENT' || job.status === 'QUOTE_ACCEPTED') {
          sampleMessages.push({
            _id: 'msg_4',
            content: `Quote: $${job.estimatedBudget || 250} for ${job.title}`,
            messageType: 'QUOTE',
            senderId: job.vendor?._id || 'vendor_id',
            senderRole: 'vendor',
            senderName: job.vendor ? `${job.vendor.firstName} ${job.vendor.lastName}` : 'Vendor',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
            priority: 'HIGH',
            quoteData: {
              amount: job.estimatedBudget || 250,
              description: `Professional ${job.category} service`,
              validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              includes: ['Professional service', 'Quality guarantee', 'Clean-up after work']
            }
          });
        }
        
        setMessages(sampleMessages);
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
        
        setMessages(prev => [...prev, newMessageObj]);
        setNewMessage('');
        
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

  const handleSendQuote = () => {
    const totalAmount = quoteForm.breakdown.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    
    const validUntil = quoteForm.validUntil 
      ? new Date(quoteForm.validUntil)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    const quoteData = {
      ...quoteForm,
      amount: totalAmount,
      validUntil,
      includes: quoteForm.includes.filter(item => item.trim()),
      excludes: quoteForm.excludes.filter(item => item.trim())
    };
    
    sendMessage({
      content: `Quote: $${totalAmount.toFixed(2)} - ${quoteForm.description}`,
      messageType: 'QUOTE',
      priority: 'HIGH',
      quoteData
    });
    
    setShowQuoteForm(false);
    setQuoteForm({
      amount: '',
      description: '',
      breakdown: [{ item: '', quantity: 1, unitPrice: 0 }],
      validUntil: '',
      terms: '',
      estimatedDuration: '',
      includes: [''],
      excludes: ['']
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

  const handleAcceptQuote = async (message) => {
    try {
      const response = await api.post(`/messages/job/${job._id}/accept-quote`, {
        messageId: message._id
      });
      
      setMessages(prev => [...prev, response.data.acceptanceMessage]);
      
      if (onJobUpdate) {
        onJobUpdate(response.data.job);
      }
      
      toast.success('Quote accepted! 🎉');
    } catch (error) {
      console.error('Error accepting quote:', error);
      toast.error('Failed to accept quote');
    }
  };

  const handleRejectQuote = async (message, reason) => {
    try {
      const response = await api.post(`/messages/job/${job._id}/reject-quote`, {
        messageId: message._id,
        reason
      });
      
      setMessages(prev => [...prev, response.data.rejectionMessage]);
      
      if (onJobUpdate) {
        onJobUpdate(response.data.job);
      }
      
      toast.success('Quote rejected');
    } catch (error) {
      console.error('Error rejecting quote:', error);
      toast.error('Failed to reject quote');
    }
  };

  const addBreakdownItem = () => {
    setQuoteForm(prev => ({
      ...prev,
      breakdown: [...prev.breakdown, { item: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const updateBreakdownItem = (index, field, value) => {
    setQuoteForm(prev => ({
      ...prev,
      breakdown: prev.breakdown.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeBreakdownItem = (index) => {
    setQuoteForm(prev => ({
      ...prev,
      breakdown: prev.breakdown.filter((_, i) => i !== index)
    }));
  };

  const MessageBubble = ({ message }) => {
    const isSender = message.senderId._id === user._id;
    const isQuote = message.messageType === 'QUOTE';
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
          
          {/* Quote Details */}
          {isQuote && message.quoteData && (
            <div className="mt-3 p-3 bg-white bg-opacity-20 rounded">
              <div className="font-semibold text-lg">
                ${message.quoteData.amount.toFixed(2)}
              </div>
              
              {message.quoteData.breakdown && message.quoteData.breakdown.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium mb-1">Breakdown:</div>
                  {message.quoteData.breakdown.map((item, index) => (
                    <div key={index} className="text-xs">
                      {item.item}: {item.quantity} × ${item.unitPrice} = ${(item.quantity * item.unitPrice).toFixed(2)}
                    </div>
                  ))}
                </div>
              )}
              
              {message.quoteData.estimatedDuration && (
                <div className="text-xs mt-1">
                  Duration: {message.quoteData.estimatedDuration} hours
                </div>
              )}
              
              {message.quoteData.validUntil && (
                <div className="text-xs mt-1">
                  Valid until: {new Date(message.quoteData.validUntil).toLocaleDateString()}
                </div>
              )}
              
              {/* Quote Actions for Customer */}
              {!isSender && isCustomer && message.messageType === 'QUOTE' && job.status === 'QUOTE_SENT' && (
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => handleAcceptQuote(message)}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection (optional):');
                      if (reason !== null) {
                        handleRejectQuote(message, reason);
                      }
                    }}
                    className="flex items-center px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}
          
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

  const QuoteForm = () => (
    <div className="border-t border-gray-200 p-4 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Send Quote</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={quoteForm.description}
            onChange={(e) => setQuoteForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the work to be done..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cost Breakdown
          </label>
          {quoteForm.breakdown.map((item, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <input
                type="text"
                value={item.item}
                onChange={(e) => updateBreakdownItem(index, 'item', e.target.value)}
                placeholder="Item description"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateBreakdownItem(index, 'quantity', parseInt(e.target.value) || 0)}
                placeholder="Qty"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
              <input
                type="number"
                value={item.unitPrice}
                onChange={(e) => updateBreakdownItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                placeholder="Price"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
              {quoteForm.breakdown.length > 1 && (
                <button
                  onClick={() => removeBreakdownItem(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addBreakdownItem}
            className="text-orange-600 hover:text-orange-800 text-sm"
          >
            + Add Item
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Duration (hours)
            </label>
            <input
              type="number"
              value={quoteForm.estimatedDuration}
              onChange={(e) => setQuoteForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valid Until
            </label>
            <input
              type="date"
              value={quoteForm.validUntil}
              onChange={(e) => setQuoteForm(prev => ({ ...prev, validUntil: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Terms & Conditions
          </label>
          <textarea
            value={quoteForm.terms}
            onChange={(e) => setQuoteForm(prev => ({ ...prev, terms: e.target.value }))}
            placeholder="Payment terms, warranty, etc..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowQuoteForm(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendQuote}
            disabled={!quoteForm.description || quoteForm.breakdown.length === 0}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            Send Quote
          </button>
        </div>
      </div>
    </div>
  );

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
                job.status === 'QUOTE_SENT' ? 'bg-blue-100 text-blue-800' :
                job.status === 'QUOTE_ACCEPTED' ? 'bg-green-100 text-green-800' :
                job.status === 'IN_DISCUSSION' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {job.status.replace('_', ' ')}
              </span>
              
              {/* Pay Now Button - Only show for customers when quote is accepted */}
              {user?.role === 'customer' && job.status === 'QUOTE_ACCEPTED' && (
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
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message._id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quote Form */}
      {showQuoteForm && <QuoteForm />}
      
      {/* Contact Form */}
      {showContactForm && <ContactForm />}

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        {/* Action Buttons */}
        {(isVendor || isCustomer) && (
          <div className="flex space-x-2 mb-3">
            {isVendor && (
              <button
                onClick={() => setShowQuoteForm(!showQuoteForm)}
                className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200"
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Send Quote
              </button>
            )}
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