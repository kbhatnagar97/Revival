import React, { useState } from 'react';
import type { GDPRConsent } from '../../../services/consentService';
import './ConsentModal.scss';

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: (consent: GDPRConsent) => void;
  onDecline: () => void;
  country: string;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
  country
}) => {
  const [consent, setConsent] = useState<GDPRConsent>({
    deviceFingerprinting: true,
    locationTracking: true,
    analyticsTracking: true
  });

  if (!isOpen) return null;

  const handleToggle = (key: keyof GDPRConsent) => {
    setConsent(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAccept = () => {
    onAccept(consent);
  };

  const allDeclined = !consent.deviceFingerprinting && !consent.locationTracking && !consent.analyticsTracking;

  return (
    <div className="consent-modal-overlay">
      <div className="consent-modal">
        <div className="consent-header">
          <h3>Privacy Settings</h3>
          <p>We respect your privacy. Please choose what data we can collect to improve your experience.</p>
          <small>Location: {country}</small>
        </div>

        <div className="consent-options">
          <div className="option-card">
            <div className="option-content">
              <h4>Device Information</h4>
              <p>Screen size, browser type, and device capabilities for security and compatibility.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={consent.deviceFingerprinting}
                onChange={() => handleToggle('deviceFingerprinting')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="option-card">
            <div className="option-content">
              <h4>General Location</h4>
              <p>Country and region information for personalized content and timezone detection.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={consent.locationTracking}
                onChange={() => handleToggle('locationTracking')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="option-card">
            <div className="option-content">
              <h4>Usage Analytics</h4>
              <p>Anonymous usage patterns to help us improve the app and fix issues.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={consent.analyticsTracking}
                onChange={() => handleToggle('analyticsTracking')}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="consent-buttons">
          <button 
            className="accept-btn" 
            onClick={handleAccept}
            disabled={allDeclined}
          >
            {allDeclined ? 'Select at least one option' : 'Save Preferences'}
          </button>
          <button className="decline-btn" onClick={onDecline}>
            Use without personalization
          </button>
        </div>

        <div className="consent-footer">
          <p>
            You can change these settings anytime in your privacy preferences. 
            We never sell your data or use it for advertising.
          </p>
        </div>
      </div>
    </div>
  );
};