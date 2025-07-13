import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import AuthModal from '../AuthModal/AuthModal';
import './ProtectedRoute.scss';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
}) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasCheckedAuth(true);
      if (requireAuth && !user) {
        // Don't automatically show modal, let user decide
      }
    }
  }, [isLoading, user, requireAuth]);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  // Show loading state while checking authentication
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className='protected-route-container'>
        <div className='background-animations'>
          <div className='shape shape-1'></div>
          <div className='shape shape-2'></div>
          <div className='shape shape-3'></div>
        </div>
        <div className='protected-route-loading'>
          <div className='loading-spinner'></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not signed in
  if (requireAuth && !user) {
    return (
      <>
        <div className='protected-route-container'>
          <div className='background-animations'>
            <div className='shape shape-1'></div>
            <div className='shape shape-2'></div>
            <div className='shape shape-3'></div>
          </div>

          <div className='auth-required-overlay'>
            <div className='auth-required-content'>
              <div className='auth-required-icon'>
                <svg
                  width='64'
                  height='64'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <rect
                    x='3'
                    y='11'
                    width='18'
                    height='11'
                    rx='2'
                    ry='2'
                  ></rect>
                  <circle cx='12' cy='16' r='1'></circle>
                  <path d='M7 11V7a5 5 0 0 1 10 0v4'></path>
                </svg>
              </div>
              <h2>Authentication Required</h2>
              <p>
                Please sign in to access the Habit Tracker and start building
                better habits.
              </p>
              <div className='auth-required-buttons'>
                <button
                  className='auth-required-button'
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Sign In to Continue
                </button>
                <button
                  className='auth-required-button auth-required-button--secondary'
                  onClick={handleGoHome}
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  // User is authenticated or authentication is not required
  return <>{children}</>;
};

export default ProtectedRoute;
