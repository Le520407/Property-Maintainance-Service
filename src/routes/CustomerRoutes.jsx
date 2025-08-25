import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from '../components/layout/CustomerLayout';
import CustomerDashboard from '../pages/customer/CustomerDashboard';
import MembershipPlans from '../components/customer/MembershipPlans';
import MembershipDashboard from '../components/customer/MembershipDashboard';
import JobCreate from '../pages/customer/JobCreate';
import JobList from '../pages/customer/JobList';
import JobDetail from '../pages/customer/JobDetail';
import Profile from '../pages/customer/Profile';

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
        <Route path="/membership/plans" element={<MembershipPlans />} />
        <Route path="/membership/dashboard" element={<MembershipDashboard />} />
        
        {/* Profile */}
        <Route path="/profile" element={<Profile />} />
        
        {/* Redirect any other routes to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </CustomerLayout>
  );
};

export default CustomerRoutes;