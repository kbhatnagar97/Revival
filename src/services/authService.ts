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

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Sign in with email and password
  signInWithEmail: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
    
    return userCredential.user;
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },

  // Sign out
  signOut: async () => {
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
