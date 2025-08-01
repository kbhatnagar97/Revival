import React, { useState } from 'react';
import type { CCPAConsent } from '../../../services/consentService';
import './ConsentBanner.scss';

interface ConsentBannerProps {
  isVisible: boolean;
  onAccept: (consent: CCPAConsent) => void;
  onLearnMore: () => void;
  region: string;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  isVisible,
  onAccept,
  onLearnMore,
  region
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  const handleAccept = () => {
    const consent: CCPAConsent = {
      personalDataCollection: true,
      dataSharing: true
    };
    onAccept(consent);
  };

  const handleOptOut = () => {
    const consent: CCPAConsent = {
      personalDataCollection: false,
      dataSharing: false
    };
    onAccept(consent);
  };

  return (
    <div className="ccpa-banner">
      <div className="banner-content">
        <div className="banner-text">
          <strong>California Privacy Notice</strong>
          <p>
            We collect personal information to improve your experience. 
            {isExpanded && (
              <span>
                {' '}This includes device information, location data, and usage analytics. 
                You have the right to opt out of the sale of personal information, 
                though we don't sell your data to third parties.
              </span>
            )}
            <button 
              className="expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show less' : 'Learn more'}
            </button>
          </p>
          <small>Region: {region}</small>
        </div>
        
        <div className="banner-actions">
          <button className="accept-btn" onClick={handleAccept}>
            Accept
          </button>
          <button className="opt-out-btn" onClick={handleOptOut}>
            Opt Out
          </button>
          <button className="learn-more" onClick={onLearnMore}>
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
};