import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from '../components/layout/CustomerLayout';
import CustomerDashboard from '../pages/customer/CustomerDashboard';
import MembershipPlans from '../components/customer/MembershipPlans';
import MembershipDashboard from '../components/customer/MembershipDashboard';
import MembershipSuccess from '../pages/MembershipSuccess.jsx';
import CustomerProfile from '../pages/customer/CustomerProfile';
import RateVendor from '../pages/customer/RateVendor';
import CustomerFeedback from '../pages/customer/CustomerFeedback';

const CustomerRoutes = () => {
  return (
    <CustomerLayout>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<CustomerDashboard />} />
        
        {/* Job Management - Redirect to feedback page */}
        <Route path="/jobs" element={<Navigate to="/feedback" replace />} />
        
        {/* Rating & Feedback */}
        <Route path="/feedback" element={<CustomerFeedback />} />
        <Route path="/rate-vendor/:jobId" element={<RateVendor />} />
        
        {/* Membership */}
        <Route path="/membership" element={<Navigate to="/membership/plans" replace />} />
        <Route path="/membership/plans" element={<MembershipPlans />} />
        <Route path="/membership/dashboard" element={<MembershipDashboard />} />
        <Route path="/membership/success" element={<MembershipSuccess />} />
        
        {/* Profile */}
        <Route path="/profile" element={<CustomerProfile />} />
        
        {/* Redirect any other routes to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </CustomerLayout>
  );
};

export default CustomerRoutes;