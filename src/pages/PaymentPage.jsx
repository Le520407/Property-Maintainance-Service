import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PaymentForm from '../components/payment/PaymentForm';
import { ArrowLeft, Clock, User, MapPin, DollarSign } from 'lucide-react';

const PaymentPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setJob(data.job);
        
        // Check if payment is allowed
        if (data.job.status !== 'QUOTE_ACCEPTED') {
          setError('Payment is not available for this job. Quote must be accepted first.');
        }
      } else {
        setError(data.message || 'Failed to fetch job details');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = (paymentData) => {
    // Redirect to job details or orders page
    navigate(`/dashboard?section=orders&tab=my-orders`, {
      state: { 
        message: 'Payment completed successfully!',
        jobId: jobId 
      }
    });
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Not Available</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-gray-600 mt-2">
            Secure payment for job #{job?.jobNumber}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{job?.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{job?.description}</p>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  <span>Vendor: {job?.vendorId?.firstName} {job?.vendorId?.lastName}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{job?.location?.address}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    {job?.preferredDate && new Date(job.preferredDate).toLocaleDateString()}
                    {job?.preferredTime && ` at ${job.preferredTime}`}
                  </span>
                </div>

                {/* Quote Details */}
                {job?.vendorQuote && (
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Quote Details</h5>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Quoted Amount:</span>
                        <span className="font-semibold text-green-600">
                          ${job.vendorQuote.amount}
                        </span>
                      </div>
                      {job.vendorQuote.description && (
                        <p className="text-xs text-gray-600">{job.vendorQuote.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Breakdown */}
                <div className="border-t pt-4">
                  <h5 className="font-medium text-gray-900 mb-2">Payment Breakdown</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Amount:</span>
                      <span className="text-gray-900">${job?.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee (10%):</span>
                      <span className="text-gray-900">${(job?.totalAmount * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total to Pay:</span>
                      <span className="text-orange-600">${job?.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 rounded-lg p-3 border-t pt-4">
                  <div className="flex items-center text-blue-700 text-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>256-bit SSL encrypted payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <PaymentForm
              jobId={jobId}
              onPaymentComplete={handlePaymentComplete}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;