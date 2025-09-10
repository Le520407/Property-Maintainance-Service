import React from 'react';

const MembershipSuccessSimple = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Swift Fix Pro!
        </h1>
        <p className="text-gray-600 mb-8">
          Your membership has been activated successfully.
        </p>
      </div>
    </div>
  );
};

export default MembershipSuccessSimple;
