import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
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
        email: 'user@gmail.com',
        name: 'Google User',
        picture: 'https://via.placeholder.com/40',
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
      const mockUser: User = {
        id: '2',
        email,
        name: email.split('@')[0],
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
      const mockUser: User = {
        id: '3',
        email,
        name,
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
