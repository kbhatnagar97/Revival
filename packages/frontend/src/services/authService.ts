import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { apiService } from './apiService';
import { deviceService } from './deviceService';
import { sessionService } from './sessionService';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Helper function to initialize device and session tracking
const initializeDeviceAndSession = async (userId: string) => {
  try {
    // Register the device
    await deviceService.registerDevice(userId);
    console.log('Device registered successfully');
    
    // Initialize session tracking
    await sessionService.initializeSession();
    console.log('Session tracking initialized');
  } catch (error) {
    console.error('Failed to initialize device and session tracking:', error);
    // Don't throw here - authentication succeeded, tracking is secondary
  }
};

export const authService = {
  // Sign in with email and password
  signInWithEmail: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Initialize device and session tracking
    await initializeDeviceAndSession(userCredential.user.uid);
    
    return userCredential.user;
  },

  // Sign up with email and password
  signUpWithEmail: async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name immediately
    await updateProfile(userCredential.user, {
      displayName: name,
    });
    
    // Force refresh the user to get updated profile
    await userCredential.user.reload();
    
    // Create user document in Firestore via Cloud Function
    try {
      await apiService.callFunction('onUserCreate', {
        email: userCredential.user.email,
        displayName: name,
        provider: 'password',
        photoURL: userCredential.user.photoURL,
      });
      console.log('User document created successfully');
    } catch (error) {
      console.error('Failed to create user document:', error);
      // Don't throw here - user creation succeeded, document creation is secondary
    }
    
    // Initialize device and session tracking
    await initializeDeviceAndSession(userCredential.user.uid);
    
    return userCredential.user;
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    const result = await signInWithPopup(auth, googleProvider);
    
    // For Google sign-in, we should also create a user document if it's a new user
    // The Cloud Function will handle checking if the user already exists
    try {
      await apiService.callFunction('onUserCreate', {
        email: result.user.email,
        displayName: result.user.displayName,
        provider: 'google.com',
        photoURL: result.user.photoURL,
      });
      console.log('User document created/verified successfully');
    } catch (error) {
      console.error('Failed to create/verify user document:', error);
      // Don't throw here - sign-in succeeded, document creation is secondary
    }
    
    // Initialize device and session tracking
    await initializeDeviceAndSession(result.user.uid);
    
    return result.user;
  },

  // Sign out
  signOut: async () => {
    // Clear session tracking before signing out
    sessionService.clearSession();
    
    await signOut(auth);
  },

  // Reset password
  resetPassword: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },
};
