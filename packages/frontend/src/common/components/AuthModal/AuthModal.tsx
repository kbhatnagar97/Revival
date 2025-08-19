// AuthModal.tsx

import React, { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import './AuthModal.scss';

// Custom colorful Google icon component
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width='20'
    height='20'
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
      fill='#4285F4'
    />
    <path
      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
      fill='#34A853'
    />
    <path
      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
      fill='#FBBC05'
    />
    <path
      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
      fill='#EA4335'
    />
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } =
    useAuth();

  // Reset state when modal is opened or mode changes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMessage('');
      // Keep email for convenience when switching between signin/reset
      if (mode === 'signup') {
        setPassword('');
      }
    }
  }, [isOpen, mode]);

  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setEmail('');
      setPassword('');
      setName('');
      setError('');
      setSuccessMessage('');
      setMode('signin');
      setIsClosing(false);
      onClose();
    }, 300); // Match the animation duration
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        handleClose();
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
        handleClose();
      } else if (mode === 'reset') {
        await resetPassword(email);
        setSuccessMessage(
          'Password reset email sent! Please check your inbox and spam folder.'
        );
        // Trigger success animation
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderFooter = () => {
    switch (mode) {
      case 'signin':
        return (
          <p>
            Don't have an account?
            <button type='button' onClick={() => setMode('signup')}>
              Sign up
            </button>
            <br />
            <a onClick={() => setMode('reset')}>Forgot password?</a>
          </p>
        );
      case 'signup':
        return (
          <p>
            Already have an account?
            <button type='button' onClick={() => setMode('signin')}>
              Sign in
            </button>
          </p>
        );
      case 'reset':
        return (
          <p>
            Remember your password?
            <button type='button' onClick={() => setMode('signin')}>
              Sign in
            </button>
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`auth-modal-overlay ${
        isClosing ? 'auth-modal-overlay--closing' : ''
      }`}
      onClick={handleClose}
      role='dialog'
      aria-modal='true'
    >
      <div
        className={`auth-modal ${isClosing ? 'auth-modal--closing' : ''} ${
          showSuccessAnimation ? 'auth-modal--success' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className='auth-modal__close-btn'
          onClick={handleClose}
          aria-label='Close modal'
        >
          <FaTimes />
        </button>

        <header className='auth-modal__header'>
          <h2 className='auth-modal__title'>
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p className='auth-modal__subtitle'>
            {mode === 'signin' && 'Sign in to continue your journey.'}
            {mode === 'signup' && 'Start building better habits today.'}
            {mode === 'reset' && 'Enter your email to receive a reset link.'}
          </p>
        </header>

        <div className='auth-modal__content'>
          {mode !== 'reset' && (
            <>
              <button
                className='auth-modal__btn auth-modal__btn--google'
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <div className='auth-modal__divider'>or</div>
            </>
          )}

          <form onSubmit={handleEmailSubmit} className='auth-modal__form'>
            {mode === 'signup' && (
              <div className='auth-modal__field'>
                <label htmlFor='name'>Full Name</label>
                <input
                  id='name'
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder='John Doe'
                  disabled={isLoading}
                />
              </div>
            )}

            <div className='auth-modal__field'>
              <label htmlFor='email'>Email</label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder='john.doe@example.com'
                disabled={isLoading}
              />
            </div>

            {mode !== 'reset' && (
              <div className='auth-modal__field'>
                <label htmlFor='password'>Password</label>
                <div className='auth-modal__password-field'>
                  <input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder='••••••••'
                    disabled={isLoading}
                  />
                  <button
                    type='button'
                    className='password-toggle-btn'
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            )}

            {error && <div className='auth-modal__error'>{error}</div>}
            {successMessage && (
              <div className='auth-modal__success'>{successMessage}</div>
            )}

            <button
              type='submit'
              className='auth-modal__btn auth-modal__btn--primary'
              disabled={isLoading}
            >
              {isLoading
                ? 'Processing...'
                : mode === 'signin'
                ? 'Sign In'
                : mode === 'signup'
                ? 'Create Account'
                : 'Send Reset Link'}
            </button>
          </form>

          <footer className='auth-modal__footer'>{renderFooter()}</footer>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
