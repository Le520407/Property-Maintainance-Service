import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const DemoCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  
  const billingId = searchParams.get('billing_id');
  const amount = searchParams.get('amount');
  const planId = searchParams.get('plan');

  useEffect(() => {
    if (!billingId) {
      toast.error('Invalid checkout session');
      navigate('/membership');
    }
  }, [billingId, navigate]);

  const handlePayment = async () => {
    setProcessing(true);
    toast.loading('Processing payment...', { id: 'payment' });
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment by calling the webhook simulator
      const response = await fetch('/api/hitpay/simulate/recurring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: `demo_payment_${Date.now()}`,
          recurring_billing_id: billingId,
          amount: amount !== 'N/A' ? amount : '40.00',
          currency: 'SGD',
          status: 'completed',
          reference: `demo_ref_${Date.now()}`
        })
      });

      if (response.ok) {
        toast.success('Payment successful! Redirecting...', { id: 'payment' });
        setTimeout(() => {
          navigate('/membership/success?demo=true&status=completed');
        }, 1000);
      } else {
        throw new Error('Payment simulation failed');
      }
    } catch (error) {
      console.error('Demo payment error:', error);
      toast.error('Payment failed. Please try again.', { id: 'payment' });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/membership');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 text-indigo-600">
            <CreditCard className="h-12 w-12" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Demo Payment Gateway
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This is a demo checkout for testing purposes
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium text-gray-500">Plan ID:</span>
              <span className="text-sm text-gray-900">{planId}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium text-gray-500">Amount:</span>
              <span className="text-sm text-gray-900">
                {amount !== 'N/A' ? `SGD $${amount}` : 'As per plan'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium text-gray-500">Billing ID:</span>
              <span className="text-sm text-gray-900 font-mono">{billingId}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Demo Payment
                </>
              )}
            </button>
            
            <button
              onClick={handleCancel}
              disabled={processing}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-xs text-yellow-800">
              <strong>Demo Mode:</strong> This is a simulated payment gateway for development testing. 
              No real payment will be processed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoCheckout;
