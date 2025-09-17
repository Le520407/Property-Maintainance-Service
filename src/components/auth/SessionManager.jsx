import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SessionManager = () => {
  const { user, logout } = useAuth();
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  
  // Session timeout duration (25 minutes = 1500000ms)
  const SESSION_TIMEOUT = 25 * 60 * 1000;
  // Warning time (5 minutes before timeout = 300000ms)
  const WARNING_TIME = 5 * 60 * 1000;

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    if (user) {
      // Set warning timer (20 minutes)
      warningRef.current = setTimeout(() => {
        toast.error(
          'Your session will expire in 5 minutes due to inactivity. Click anywhere to stay logged in.',
          {
            duration: WARNING_TIME,
            id: 'session-warning'
          }
        );
      }, SESSION_TIMEOUT - WARNING_TIME);

      // Set logout timer (25 minutes)
      timeoutRef.current = setTimeout(() => {
        toast.error('Session expired due to inactivity. Please log in again.');
        logout();
      }, SESSION_TIMEOUT);
    }
  }, [user, logout, SESSION_TIMEOUT, WARNING_TIME]);

  const handleUserActivity = useCallback(() => {
    if (user) {
      // Dismiss any existing warning toast
      toast.dismiss('session-warning');
      resetTimer();
    }
  }, [user, resetTimer]);

  useEffect(() => {
    // Initialize timer when user logs in
    if (user) {
      resetTimer();
    }

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
      
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      
      toast.dismiss('session-warning');
    };
  }, [user, resetTimer, handleUserActivity]);

  // Check token validity every minute and refresh if needed
  useEffect(() => {
    if (!user) return;

    const tokenCheckInterval = setInterval(async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token || !refreshToken) {
        logout();
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 <= Date.now();
        const isExpiringSoon = payload.exp * 1000 <= Date.now() + (5 * 60 * 1000); // 5 minutes

        if (isExpired) {
          // Try to refresh the token
          try {
            const response = await api.auth.refreshToken(refreshToken);
            localStorage.setItem('token', response.token);
            localStorage.setItem('refreshToken', response.refreshToken);
            console.log('Token refreshed successfully');
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            toast.error('Your session has expired. Please log in again.');
            logout();
          }
        } else if (isExpiringSoon) {
          // Silently refresh token when it's about to expire
          try {
            const response = await api.auth.refreshToken(refreshToken);
            localStorage.setItem('token', response.token);
            localStorage.setItem('refreshToken', response.refreshToken);
            console.log('Token silently refreshed');
          } catch (refreshError) {
            console.error('Silent token refresh failed:', refreshError);
            // Don't logout immediately for silent refresh failures
          }
        }
      } catch (error) {
        console.error('Error checking token validity:', error);
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(tokenCheckInterval);
  }, [user, logout]);

  return null; // This component doesn't render anything
};

export default SessionManager;