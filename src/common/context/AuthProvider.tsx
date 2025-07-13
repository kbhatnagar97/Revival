import React, {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { authService } from '../../services/authService';
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
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name:
      firebaseUser.displayName ||
      (firebaseUser.email ? getNameFromEmail(firebaseUser.email) : 'User'),
    picture: firebaseUser.photoURL || undefined,
    provider:
      firebaseUser.providerData[0]?.providerId === 'google.com'
        ? 'google'
        : 'email',
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } else {
        setUser(null);
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

  const value: AuthContextType = {
    user,
    isLoading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
