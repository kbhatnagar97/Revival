import React, { useState, useRef, useEffect } from 'react';
import {
  FaUser,
  FaChevronDown,
  FaSignOutAlt,
  FaChartLine,
  FaCalculator,
  FaHome,
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './AuthButton.scss';

interface AuthButtonProps {
  onClick?: () => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({ onClick }) => {
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  // If user is not signed in, show the sign-in button
  if (!user) {
    return (
      <button className='auth-button' onClick={onClick}>
        <FaUser className='auth-button__icon' />
        <span className='auth-button__text auth-button__text--sign-in'>
          Sign In
        </span>
      </button>
    );
  }

  // If user is signed in, show the profile dropdown
  return (
    <div className='auth-button-container' ref={dropdownRef}>
      <button
        className={`auth-button auth-button--profile ${
          isDropdownOpen ? 'auth-button--active' : ''
        }`}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-haspopup='true'
        aria-expanded={isDropdownOpen}
      >
        <div className='auth-button__user-info'>
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name || 'User avatar'}
              className='auth-button__avatar'
            />
          ) : (
            <div className='auth-button__avatar'>
              <FaUser />
            </div>
          )}
          <span className='auth-button__text'>{user.name}</span>
        </div>
        <FaChevronDown
          className={`auth-button__chevron ${
            isDropdownOpen ? 'auth-button__chevron--rotated' : ''
          }`}
        />
      </button>

      {/* The 'auth-dropdown--visible' class triggers our new smooth animations */}
      <div
        className={`auth-dropdown ${
          isDropdownOpen ? 'auth-dropdown--visible' : ''
        }`}
      >
        <div className='auth-dropdown__header'>
          <div className='auth-dropdown__user-details'>
            <div className='auth-dropdown__name'>{user.name}</div>
            <div className='auth-dropdown__email'>{user.email}</div>
          </div>
        </div>

        <div className='auth-dropdown__menu'>
          {location.pathname.startsWith('/habit-tracker') ? (
            <button
              className='auth-dropdown__item'
              onClick={() => handleNavigation('/')}
            >
              <FaHome className='auth-dropdown__item-icon' />
              <span>Home Page</span>
            </button>
          ) : (
            <button
              className='auth-dropdown__item'
              onClick={() => handleNavigation('/habit-tracker')}
            >
              <FaChartLine className='auth-dropdown__item-icon' />
              <span>Habit Tracker</span>
            </button>
          )}

          <button
            className='auth-dropdown__item'
            onClick={() => handleNavigation('/gaussian-visualizer')}
          >
            <FaCalculator className='auth-dropdown__item-icon' />
            <span>Gaussian Visualizer</span>
          </button>
        </div>

        <div className='auth-dropdown__menu'>
          <button
            className='auth-dropdown__item auth-dropdown__item--danger'
            onClick={handleSignOut}
          >
            <FaSignOutAlt className='auth-dropdown__item-icon' />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthButton;
