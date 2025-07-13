import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './auth-context';
import type { User, AuthContextType } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuthState = async () => {
      try {
        const savedUser = localStorage.getItem('revival_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Mock Google sign-in for now
      // In a real app, you'd integrate with Google OAuth
      const mockUser: User = {
        id: '1',
        email: 'john.doe@gmail.com',
        name: 'John Doe',
        picture:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
        provider: 'google',
      };

      setUser(mockUser);
      localStorage.setItem('revival_user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock email sign-in
      // In a real app, you'd validate the password
      console.log(
        'Signing in with password for:',
        email,
        password ? 'provided' : 'missing'
      );

      const mockUser: User = {
        id: '2',
        email,
        name: email
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        // Sometimes no picture to test initials
        picture:
          Math.random() > 0.5
            ? `https://images.unsplash.com/photo-1494790108755-2616b2a2c9e9?w=150&h=150&fit=crop&crop=face&auto=format&q=80`
            : undefined,
        provider: 'email',
      };

      setUser(mockUser);
      localStorage.setItem('revival_user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string
  ) => {
    setIsLoading(true);
    try {
      // Mock email sign-up
      console.log(
        'Signing up with password for:',
        email,
        password ? 'provided' : 'missing'
      );

      const mockUser: User = {
        id: '3',
        email,
        name,
        // Sometimes no picture to test initials
        picture:
          Math.random() > 0.3
            ? `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80`
            : undefined,
        provider: 'email',
      };

      setUser(mockUser);
      localStorage.setItem('revival_user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem('revival_user');
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Mock password reset
      console.log('Password reset email sent to:', email);
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

export default AuthProvider;
