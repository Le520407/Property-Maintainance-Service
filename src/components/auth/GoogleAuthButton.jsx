import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const GoogleAuthButton = ({ className = "", disabled = false }) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google Login Success:', credentialResponse);
      
      // Extract the ID token from the credential response
      const idToken = credentialResponse.credential;
      
      // Call the googleLogin method from AuthContext with the ID token
      const result = await googleLogin(idToken);
      console.log('Google login result:', result);
      
      if (result.requiresRegistration) {
        // New user needs to complete registration
        toast.success('Please complete your registration');
        navigate('/register-selection', { 
          state: { googleData: result.googleData } 
        });
      } else if (result.success) {
        // Existing user login successful
        toast.success('Google login successful!');
        navigate('/');
      } else {
        toast.error(result.error || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google login failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    console.error('Google Login Failed');
    toast.error('Google login failed. Please try again.');
  };

  return (
    <div className={className}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        disabled={disabled}
        theme="outline"
        size="large"
        text="signin_with"
        shape="rectangular"
        width="100%"
        logo_alignment="left"
      />
    </div>
  );
};

export default GoogleAuthButton;