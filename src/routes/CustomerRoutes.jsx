import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from '../components/layout/CustomerLayout';
import CustomerDashboard from '../pages/customer/CustomerDashboard';
import MembershipPlans from '../components/customer/MembershipPlans';
import MembershipDashboard from '../components/customer/MembershipDashboard';
import MembershipSuccess from '../pages/MembershipSuccess';
import JobCreate from '../pages/customer/JobCreate';
import JobList from '../pages/customer/JobList';
import JobDetail from '../pages/customer/JobDetail';
import CustomerProfile from '../pages/customer/CustomerProfile';

const CustomerRoutes = () => {
  return (
    <CustomerLayout>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<CustomerDashboard />} />
        
        {/* Job Management */}
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/create" element={<JobCreate />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        
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