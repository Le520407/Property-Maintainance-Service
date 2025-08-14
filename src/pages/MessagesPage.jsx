import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  ArrowLeft, 
  Users, 
  Bell,
  Settings,
  HelpCircle
} from 'lucide-react';
import ConversationsList from '../components/communication/ConversationsList';
import JobChat from '../components/communication/JobChat';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const MessagesPage = () => {
  const { user } = useAuth();
  const [selectedJob, setSelectedJob] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversations, setShowConversations] = useState(true);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  const handleSelectConversation = async (conversation) => {
    try {
      // Fetch full job details
      const response = await api.get(`/jobs/${conversation._id}`);
      setSelectedJob(response.data.job);
      
      if (isMobileView) {
        setShowConversations(false);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  const handleBackToConversations = () => {
    setShowConversations(true);
    setSelectedJob(null);
  };

  const handleJobUpdate = (updatedJob) => {
    setSelectedJob(updatedJob);
  };

  const WelcomeScreen = () => (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-12 h-12 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Messages
        </h2>
        <p className="text-gray-600 mb-6 max-w-md">
          {user?.role === 'vendor' 
            ? 'Connect with customers, send quotes, and manage your jobs all in one place.'
            : user?.role === 'customer'
            ? 'Chat with vendors, discuss your projects, and approve quotes seamlessly.'
            : 'Monitor all communications between customers and vendors.'
          }
        </p>
        
        <div className="space-y-4 text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Real-time messaging</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Quote management</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Contact sharing</span>
          </div>
        </div>
        
        <div className="mt-8 text-xs text-gray-400">
          Select a conversation from the left to start messaging
        </div>
      </div>
    </div>
  );

  // Mobile layout
  if (isMobileView) {
    return (
      <div className="h-screen bg-white">
        {showConversations ? (
          <ConversationsList
            onSelectConversation={handleSelectConversation}
            selectedJobId={selectedJob?._id}
          />
        ) : selectedJob ? (
          <div className="h-full flex flex-col">
            {/* Mobile Header */}
            <div className="flex items-center p-4 border-b border-gray-200 bg-white">
              <button
                onClick={handleBackToConversations}
                className="mr-3 p-2 -ml-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold">{selectedJob.title}</h1>
                <p className="text-sm text-gray-600">{selectedJob.jobNumber}</p>
              </div>
            </div>
            
            {/* Chat */}
            <div className="flex-1">
              <JobChat
                job={selectedJob}
                onJobUpdate={handleJobUpdate}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ConversationsList
          onSelectConversation={handleSelectConversation}
          selectedJobId={selectedJob?._id}
        />
      </div>
      
      {/* Main Content - Chat or Welcome */}
      <div className="flex-1 flex flex-col">
        {selectedJob ? (
          <>
            {/* Desktop Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {selectedJob.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{selectedJob.jobNumber}</span>
                    <span>•</span>
                    <span>{selectedJob.category}</span>
                    <span>•</span>
                    <span>{selectedJob.location?.city}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedJob.status === 'QUOTE_SENT' ? 'bg-blue-100 text-blue-800' :
                    selectedJob.status === 'QUOTE_ACCEPTED' ? 'bg-green-100 text-green-800' :
                    selectedJob.status === 'IN_DISCUSSION' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedJob.status.replace('_', ' ')}
                  </span>
                  
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Chat Component */}
            <div className="flex-1 bg-white">
              <JobChat
                job={selectedJob}
                onJobUpdate={handleJobUpdate}
              />
            </div>
          </>
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
};

export default MessagesPage;