import React from 'react';
import CustomerNavbar from './CustomerNavbar';
import { useAuth } from '../../contexts/AuthContext';

const CustomerLayout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar user={user} onLogout={logout} />
      <main className="pb-8">
        {children}
      </main>
    </div>
  );
};

export default CustomerLayout;