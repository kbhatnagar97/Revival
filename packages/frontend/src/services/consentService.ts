import { apiService } from './apiService';

export interface ConsentRequirements {
  required: boolean;
  type: 'gdpr' | 'ccpa' | 'none';
  country: string;
  countryCode: string;
}

export interface GDPRConsent {
  deviceFingerprinting: boolean;
  locationTracking: boolean;
  analyticsTracking: boolean;
}

export interface CCPAConsent {
  personalDataCollection: boolean;
  dataSharing: boolean;
}

export interface ConsentState {
  gdpr?: GDPRConsent;
  ccpa?: CCPAConsent;
  timestamp: Date;
  ipAddress: string;
}

class ConsentManager {
  private readonly CONSENT_STORAGE_KEY = 'revival_consent_state';
  private readonly GDPR_COUNTRIES = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
  ];

  /**
   * Detect if consent is required based on user location
   */
  async detectConsentRequirements(): Promise<ConsentRequirements> {
    try {
      // Get location from server-side IP detection
      const locationData = await apiService.callFunction<{
        country: string;
        countryCode: string;
        region?: string;
      }>('detectUserLocation');

      const { country, countryCode } = locationData;

      // Check if GDPR applies (EU countries)
      if (this.GDPR_COUNTRIES.includes(countryCode)) {
        return {
          required: true,
          type: 'gdpr',
          country,
          countryCode
        };
      }

      // Check if CCPA applies (California)
      if (countryCode === 'US' && locationData.region === 'California') {
        return {
          required: true,
          type: 'ccpa',
          country,
          countryCode
        };
      }

      // No consent required for other locations
      return {
        required: false,
        type: 'none',
        country,
        countryCode
      };
    } catch (error) {
      console.error('Failed to detect consent requirements:', error);
      
      // If it's a CORS or network error, try to detect location client-side as fallback
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Basic heuristics based on timezone and language
        let countryCode = 'XX';
        let country = 'Unknown';
        
        // Simple timezone-based detection (not perfect but better than nothing)
        if (timezone.includes('Europe/')) {
          const city = timezone.split('/')[1];
          if (['London', 'Dublin'].includes(city)) {
            countryCode = 'GB';
            country = 'United Kingdom';
          } else if (['Berlin', 'Munich'].includes(city)) {
            countryCode = 'DE';
            country = 'Germany';
          } else if (['Paris'].includes(city)) {
            countryCode = 'FR';
            country = 'France';
          } else {
            // Default to a generic EU country for GDPR compliance
            countryCode = 'DE';
            country = 'Europe';
          }
        } else if (timezone.includes('America/')) {
          if (timezone.includes('Los_Angeles') || timezone.includes('San_Francisco')) {
            countryCode = 'US';
            country = 'United States';
          } else {
            countryCode = 'US';
            country = 'United States';
          }
        }
        
        // Check if GDPR applies
        if (this.GDPR_COUNTRIES.includes(countryCode)) {
          return {
            required: true,
            type: 'gdpr',
            country,
            countryCode
          };
        }
        
        // Default to no consent required
        return {
          required: false,
          type: 'none',
          country,
          countryCode
        };
      } catch (fallbackError) {
        console.error('Fallback location detection also failed:', fallbackError);
        // Ultimate fallback - assume no consent required
        return {
          required: false,
          type: 'none',
          country: 'Unknown',
          countryCode: 'XX'
        };
      }
    }
  }

  /**
   * Check if user has already provided consent
   */
  hasValidConsent(requirements: ConsentRequirements): boolean {
    if (!requirements.required) {
      return true; // No consent needed
    }

    try {
      const stored = localStorage.getItem(this.CONSENT_STORAGE_KEY);
      if (!stored) return false;

      const consentState: ConsentState = JSON.parse(stored);
      
      // Check if consent is recent (within 1 year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (new Date(consentState.timestamp) < oneYearAgo) {
        return false;
      }

      // Check if we have the right type of consent
      if (requirements.type === 'gdpr') {
        return !!consentState.gdpr;
      } else if (requirements.type === 'ccpa') {
        return !!consentState.ccpa;
      }

      return false;
    } catch (error) {
      console.error('Failed to check consent state:', error);
      return false;
    }
  }

  /**
   * Store user consent
   */
  async storeConsent(
    requirements: ConsentRequirements,
    consent: GDPRConsent | CCPAConsent
  ): Promise<void> {
    try {
      const consentState: ConsentState = {
        timestamp: new Date(),
        ipAddress: await this.getCurrentIP(),
        ...(requirements.type === 'gdpr' ? { gdpr: consent as GDPRConsent } : {}),
        ...(requirements.type === 'ccpa' ? { ccpa: consent as CCPAConsent } : {})
      };

      localStorage.setItem(this.CONSENT_STORAGE_KEY, JSON.stringify(consentState));

      // Also store on server for compliance records
      await apiService.callFunction('storeConsentRecord', {
        consentType: requirements.type,
        consent,
        country: requirements.country,
        countryCode: requirements.countryCode,
        timestamp: consentState.timestamp.toISOString(),
        ipAddress: consentState.ipAddress
      });

      console.log('Consent stored successfully:', requirements.type);
    } catch (error) {
      console.error('Failed to store consent:', error);
      throw error;
    }
  }

  /**
   * Get current consent state
   */
  getConsentState(): ConsentState | null {
    try {
      const stored = localStorage.getItem(this.CONSENT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get consent state:', error);
      return null;
    }
  }

  /**
   * Check if specific data collection is allowed
   */
  isDataCollectionAllowed(
    requirements: ConsentRequirements,
    dataType: 'device' | 'location' | 'analytics'
  ): boolean {
    if (!requirements.required) {
      return true; // No consent required, allow all
    }

    const consentState = this.getConsentState();
    if (!consentState) {
      return false; // No consent given
    }

    if (requirements.type === 'gdpr' && consentState.gdpr) {
      switch (dataType) {
        case 'device':
          return consentState.gdpr.deviceFingerprinting;
        case 'location':
          return consentState.gdpr.locationTracking;
        case 'analytics':
          return consentState.gdpr.analyticsTracking;
        default:
          return false;
      }
    }

    if (requirements.type === 'ccpa' && consentState.ccpa) {
      // CCPA is opt-out, so default to true unless explicitly denied
      return consentState.ccpa.personalDataCollection;
    }

    return false;
  }

  /**
   * Clear stored consent (for testing or user request)
   */
  clearConsent(): void {
    try {
      localStorage.removeItem(this.CONSENT_STORAGE_KEY);
      console.log('Consent cleared');
    } catch (error) {
      console.error('Failed to clear consent:', error);
    }
  }

  /**
   * Get current IP address (for consent records)
   */
  private async getCurrentIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get IP address:', error);
      return 'unknown';
    }
  }
}

// Create singleton instance
const consentManager = new ConsentManager();

export const consentService = {
  /**
   * Detect if consent is required for current user
   */
  detectConsentRequirements: () => consentManager.detectConsentRequirements(),

  /**
   * Check if user has valid consent
   */
  hasValidConsent: (requirements: ConsentRequirements) => 
    consentManager.hasValidConsent(requirements),

  /**
   * Store user consent
   */
  storeConsent: (requirements: ConsentRequirements, consent: GDPRConsent | CCPAConsent) =>
    consentManager.storeConsent(requirements, consent),

  /**
   * Get current consent state
   */
  getConsentState: () => consentManager.getConsentState(),

  /**
   * Check if specific data collection is allowed
   */
  isDataCollectionAllowed: (requirements: ConsentRequirements, dataType: 'device' | 'location' | 'analytics') =>
    consentManager.isDataCollectionAllowed(requirements, dataType),

  /**
   * Clear stored consent
   */
  clearConsent: () => consentManager.clearConsent(),
};