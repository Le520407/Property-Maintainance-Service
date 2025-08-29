import React, { createContext, useContext } from 'react';
import { clearMessagesVisitedFlag } from '../components/layout/Header';

const MessagesContext = createContext();

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};

export const MessagesProvider = ({ children }) => {
  // Function to clear messages visited flag (allows new unread counts to show)
  const clearVisitedFlag = (userId) => {
    clearMessagesVisitedFlag(userId);
  };

  const value = {
    clearVisitedFlag
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};