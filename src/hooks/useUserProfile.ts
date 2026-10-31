import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { 
  loginWithEmail, 
  signUpWithEmail, 
  loginWithGoogle as authLoginWithGoogle, 
  signOutUser, 
  updateUserProfile as authUpdateProfile,
  resetPassword as authResetPassword,
  resendVerification as authResendVerification,
  deleteCurrentAccount as authDeleteAccount,
  mapFirebaseUserToProfile,
  touchDeviceHeartbeat
} from '../services/authService';
import { UserProfile } from '../types';

const STORAGE_KEY = 'zinnia_user_profile';

const DEFAULT_USER: UserProfile = {
  name: 'Guest User',
  email: '',
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`,
  isLoggedIn: false
};

export function useUserProfile() {
  const [user, setUser] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_USER;
  });

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfileDoc: (() => void) | null = null;

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (unsubscribeProfileDoc) {
        unsubscribeProfileDoc();
        unsubscribeProfileDoc = null;
      }

      if (firebaseUser) {
        // Initial map with auth state
        const initialProfile = mapFirebaseUserToProfile(firebaseUser);
        setUser(initialProfile);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProfile));
        } catch (e) {}

        // Touch device heartbeat
        touchDeviceHeartbeat(firebaseUser.uid);

        // Listen for live Firestore user profile changes
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfileDoc = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const updated = mapFirebaseUserToProfile(firebaseUser, data);
            setUser(updated);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {}
          }
        }, (err) => {
          console.warn("User profile live sync error:", err);
        });
      } else {
        setUser(DEFAULT_USER);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
      }

      setIsAuthReady(true);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfileDoc) unsubscribeProfileDoc();
    };
  }, []);

  const login = async (name: string, email: string, password?: string) => {
    setAuthError(null);
    try {
      if (!password) {
        throw new Error("Password is required to log in.");
      }
      const firebaseUser = await loginWithEmail(email, password);
      const profile = mapFirebaseUserToProfile(firebaseUser);
      setUser(profile);
      return profile;
    } catch (err: any) {
      console.warn("Login attempt notice:", err?.code || err?.message);
      const msg = err.code ? formatAuthError(err.code) : (err.message || "Failed to log in.");
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signup = async (name: string, email: string, password?: string) => {
    setAuthError(null);
    try {
      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }
      const firebaseUser = await signUpWithEmail(name, email, password);
      const profile = mapFirebaseUserToProfile(firebaseUser);
      setUser(profile);
      return profile;
    } catch (err: any) {
      console.warn("Signup attempt notice:", err?.code || err?.message);
      const msg = err.code ? formatAuthError(err.code) : (err.message || "Failed to create account.");
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const firebaseUser = await authLoginWithGoogle();
      if (!firebaseUser) {
        // User closed the popup window without completing sign-in
        return null;
      }
      const profile = mapFirebaseUserToProfile(firebaseUser);
      setUser(profile);
      return profile;
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return null;
      }
      console.warn("Google sign-in error notice:", err);
      const msg = err.code ? formatAuthError(err.code) : (err.message || "Google sign-in failed.");
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!auth.currentUser) return;
    try {
      await authUpdateProfile(updates.name || user.name, updates.avatar || user.avatar, {
        gender: updates.gender,
        location: updates.location
      });
      setUser(prev => ({ ...prev, ...updates }));
    } catch (err: any) {
      console.error("Update profile failed:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setUser(DEFAULT_USER);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
  };

  const sendForgotPassword = async (email: string) => {
    try {
      await authResetPassword(email);
    } catch (err: any) {
      const msg = err.code ? formatAuthError(err.code) : (err.message || "Failed to send reset email.");
      throw new Error(msg);
    }
  };

  const resendVerification = async () => {
    try {
      await authResendVerification();
    } catch (err: any) {
      throw new Error(err.message || "Could not resend verification email.");
    }
  };

  const deleteAccount = async () => {
    try {
      await authDeleteAccount();
      setUser(DEFAULT_USER);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    } catch (err: any) {
      console.error("Account deletion error:", err);
      const msg = err.code ? formatAuthError(err.code) : (err.message || "Failed to delete account. Please re-login and try again.");
      throw new Error(msg);
    }
  };

  return { 
    user, 
    login, 
    signup,
    loginWithGoogle,
    logout, 
    updateProfile,
    sendForgotPassword,
    resendVerification,
    deleteAccount,
    isAuthReady,
    authError,
    clearAuthError: () => setAuthError(null)
  };
}

function formatAuthError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please switch to Sign In or use Continue with Google.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Authentication yet. Please use "Continue with Google", which is already active and configured!';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled.';
    case 'auth/requires-recent-login':
      return 'This sensitive operation requires recent login. Please log in again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access is temporarily disabled. Try again later.';
    default:
      return 'An authentication error occurred. Please try again.';
  }
}
