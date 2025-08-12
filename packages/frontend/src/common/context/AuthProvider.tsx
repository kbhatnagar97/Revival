import React, {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { authService } from '../../services/authService';
import { deviceService } from '../../services/deviceService';
import { sessionService } from '../../services/sessionService';
import {
  consentService,
  type ConsentRequirements,
  type GDPRConsent,
  type CCPAConsent,
} from '../../services/consentService';
import { apiService } from '../../services/apiService';
import { ConsentModal } from '../components/ConsentModal';
import { ConsentBanner } from '../components/ConsentBanner';
import type { User as FirebaseUser } from 'firebase/auth';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'email';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  consentRequirements: ConsentRequirements | null;
  hasValidConsent: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  storeConsent: (consent: GDPRConsent | CCPAConsent) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export the context for use in useAuth hook
export { AuthContext };

// Helper function to convert Firebase user to our User type
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
  // Extract and format name from email if displayName is not available
  const getNameFromEmail = (email: string): string => {
    const username = email.split('@')[0];
    // Replace dots, underscores, and hyphens with spaces, then capitalize each word
    return username
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  // Fix Google profile picture URL to avoid CORS issues
  const fixGooglePhotoURL = (photoURL: string | null): string | undefined => {
    if (!photoURL) return undefined;

    // If it's a Google profile picture, try to fix common issues
    if (photoURL.includes('googleusercontent.com')) {
      // The URL might already be in the right format, so let's try it as-is first
      // If it fails, the onError handler will show the fallback
      return photoURL;
    }

    return photoURL;
  };

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name:
      firebaseUser.displayName ||
      (firebaseUser.email ? getNameFromEmail(firebaseUser.email) : 'User'),
    picture: fixGooglePhotoURL(firebaseUser.photoURL),
    provider:
      firebaseUser.providerData[0]?.providerId === 'google.com'
        ? 'google'
        : 'email',
  };
};

// Helper function to initialize device and session tracking with consent checking
const initializeDeviceAndSessionWithConsent = async (
  consentRequirements: ConsentRequirements,
  isInitializing: boolean,
  setIsInitializing: (value: boolean) => void
) => {
  // Prevent duplicate initialization
  if (isInitializing) {
    console.log('Device/session initialization already in progress, skipping');
    return;
  }

  // Check if session is already running to avoid duplicates
  if (sessionService.isHeartbeatRunning()) {
    console.log('Session heartbeat already running, skipping initialization');
    return;
  }

  setIsInitializing(true);

  try {
    const hasValidConsent = consentService.hasValidConsent(consentRequirements);

    // Only initialize if consent allows or is not required
    if (hasValidConsent || !consentRequirements.required) {
      // Get current user for enhanced device registration
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        // Register the device with enhanced data according to DATABASE_SCHEMA.md
        await deviceService.registerDevice(currentUser.uid);
        console.log('Device registered successfully with enhanced data');

        // Initialize session tracking only if not already running
        if (!sessionService.isHeartbeatRunning()) {
          await sessionService.initializeSession();
          console.log('Session tracking initialized successfully');
        } else {
          console.log(
            'Session heartbeat already running, skipping session initialization'
          );
        }
      } else {
        console.error('No authenticated user found for device registration');
      }
    } else {
      console.log('Skipping device/session initialization - consent required');
    }
  } catch (error) {
    console.error('Failed to initialize device and session tracking:', error);
    // Don't throw here - authentication succeeded, tracking is secondary
  } finally {
    setIsInitializing(false);
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [consentRequirements, setConsentRequirements] =
    useState<ConsentRequirements | null>(null);
  const [hasValidConsent, setHasValidConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // If displayName is missing on a new user, wait a moment and reload
        if (
          !firebaseUser.displayName &&
          firebaseUser.metadata.creationTime ===
            firebaseUser.metadata.lastSignInTime
        ) {
          try {
            // Small delay to allow profile update to complete
            await new Promise((resolve) => setTimeout(resolve, 100));
            await firebaseUser.reload();
          } catch (error) {
            console.log('Error reloading user:', error);
          }
        }

        const convertedUser = convertFirebaseUser(firebaseUser);
        setUser(convertedUser);

        // Ensure user document exists/updates in Firestore
        try {
          await apiService.callFunction('onUserCreate', {
            email: firebaseUser.email,
            displayName: convertedUser.name,
            provider:
              convertedUser.provider === 'google' ? 'google.com' : 'password',
            photoURL: firebaseUser.photoURL,
          });
        } catch (err) {
          console.warn('onUserCreate verification failed (non-blocking):', err);
        }

        // Check consent requirements
        try {
          const requirements = await consentService.detectConsentRequirements();
          const hasConsent = consentService.hasValidConsent(requirements);

          setConsentRequirements(requirements);
          setHasValidConsent(hasConsent);

          // Show consent UI if required and not already given
          if (requirements.required && !hasConsent) {
            if (requirements.type === 'gdpr') {
              setShowConsentModal(true);
            } else if (requirements.type === 'ccpa') {
              setShowConsentBanner(true);
            }
          } else {
            // Initialize device and session tracking
            const isNewLogin =
              firebaseUser.metadata.creationTime ===
              firebaseUser.metadata.lastSignInTime;
            if (!isNewLogin) {
              console.log(
                'Existing user session detected, initializing enhanced tracking'
              );
              await initializeDeviceAndSessionWithConsent(
                requirements,
                isInitializing,
                setIsInitializing
              );
            }
          }
        } catch (error) {
          console.error('Failed to check consent requirements:', error);
          // Fallback to basic initialization without consent
          await initializeDeviceAndSessionWithConsent(
            {
              required: false,
              type: 'none',
              country: 'Unknown',
              countryCode: 'XX',
            },
            isInitializing,
            setIsInitializing
          );
        }
      } else {
        setUser(null);
        setConsentRequirements(null);
        setHasValidConsent(false);
        setShowConsentModal(false);
        setShowConsentBanner(false);
        // Clear session tracking when user logs out
        sessionService.clearSession();
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      await authService.signInWithGoogle();
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      console.error('Google sign-in error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authService.signInWithEmail(email, password);
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      console.error('Email sign-in error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string
  ) => {
    setIsLoading(true);
    try {
      const user = await authService.signUpWithEmail(email, password, name);
      // Manually update the user state with the correct name to ensure immediate update
      const convertedUser = convertFirebaseUser(user);
      setUser(convertedUser);
      setIsLoading(false);
    } catch (error) {
      console.error('Email sign-up error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const storeConsent = async (consent: GDPRConsent | CCPAConsent) => {
    if (!consentRequirements || !user) {
      throw new Error('No consent requirements or user found');
    }

    try {
      await consentService.storeConsent(consentRequirements, consent);
      setHasValidConsent(true);
      setShowConsentModal(false);
      setShowConsentBanner(false);

      // Initialize device and session tracking now that consent is given
      await initializeDeviceAndSessionWithConsent(
        consentRequirements,
        isInitializing,
        setIsInitializing
      );
      console.log('Consent stored and tracking initialized');
    } catch (error) {
      console.error('Failed to store consent:', error);
      throw error;
    }
  };

  const handleConsentDecline = () => {
    setShowConsentModal(false);
    setShowConsentBanner(false);
    // User can still use the app but with limited tracking
    console.log('User declined consent - limited tracking mode');
  };

  const handleLearnMore = () => {
    // Open privacy policy or more detailed consent information
    window.open('/privacy-policy', '_blank');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    consentRequirements,
    hasValidConsent,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    storeConsent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* Consent UI Components */}
      <ConsentModal
        isOpen={showConsentModal}
        onAccept={storeConsent}
        onDecline={handleConsentDecline}
        country={consentRequirements?.country || 'Unknown'}
      />

      <ConsentBanner
        isVisible={showConsentBanner}
        onAccept={storeConsent}
        onLearnMore={handleLearnMore}
        region={consentRequirements?.country || 'Unknown'}
      />
    </AuthContext.Provider>
  );
};
