import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  updateProfile, 
  deleteUser, 
  onAuthStateChanged,
  User,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from '../types';

export interface DeviceSessionInfo {
  deviceId: string;
  userId: string;
  deviceName: string;
  platform: 'windows' | 'android' | 'ios' | 'macos' | 'linux' | 'other';
  userAgent: string;
  lastActiveAt: number;
  createdAt: number;
  isCurrentDevice?: boolean;
}

// Generate or retrieve stable local device ID
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server-device';
  let deviceId = localStorage.getItem('zinnia_device_id');
  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('zinnia_device_id', deviceId);
  }
  return deviceId;
}

// Detect device platform name
export function detectDevicePlatform(): DeviceSessionInfo['platform'] {
  if (typeof window === 'undefined') return 'windows';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/windows|win32|win64/.test(ua)) return 'windows';
  if (/macintosh|mac os x/.test(ua)) return 'macos';
  if (/linux/.test(ua)) return 'linux';
  return 'other';
}

// Friendly device name
export function getDeviceFriendlyName(): string {
  if (typeof window === 'undefined') return 'Desktop Browser';
  const platform = detectDevicePlatform();
  const isMobile = /mobile|android|iphone/i.test(navigator.userAgent);
  switch (platform) {
    case 'windows': return 'Windows PC';
    case 'android': return 'Android Phone';
    case 'ios': return isMobile ? 'iPhone' : 'iPad';
    case 'macos': return 'MacBook / Mac';
    case 'linux': return 'Linux Station';
    default: return 'Web Browser';
  }
}

/**
 * Register current device in the user's Firestore active devices list.
 */
export async function registerDevice(user: User): Promise<void> {
  if (!user || !user.uid) return;
  const deviceId = getOrCreateDeviceId();
  const path = `users/${user.uid}/devices/${deviceId}`;
  try {
    const deviceRef = doc(db, 'users', user.uid, 'devices', deviceId);
    await setDoc(deviceRef, {
      deviceId,
      userId: user.uid,
      deviceName: getDeviceFriendlyName(),
      platform: detectDevicePlatform(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 250) : 'unknown',
      lastActiveAt: Date.now(),
      createdAt: Date.now(),
      sessionStatus: 'active'
    }, { merge: true });
  } catch (error) {
    console.warn("Could not register device session:", error);
  }
}

/**
 * Update device heartbeat lastActiveAt
 */
export async function touchDeviceHeartbeat(userId: string): Promise<void> {
  if (!userId) return;
  const deviceId = getOrCreateDeviceId();
  try {
    const deviceRef = doc(db, 'users', userId, 'devices', deviceId);
    await updateDoc(deviceRef, {
      lastActiveAt: Date.now()
    });
  } catch (e) {
    // Non-critical background heartbeat
  }
}

/**
 * Subscribe to active devices list
 */
export function subscribeToDevices(userId: string, onUpdate: (devices: DeviceSessionInfo[]) => void): () => void {
  if (!userId) return () => {};
  const currentDeviceId = getOrCreateDeviceId();
  const path = `users/${userId}/devices`;

  try {
    const devicesRef = collection(db, 'users', userId, 'devices');
    return onSnapshot(devicesRef, (snapshot) => {
      const list: DeviceSessionInfo[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as DeviceSessionInfo;
        list.push({
          ...data,
          deviceId: docSnap.id,
          isCurrentDevice: docSnap.id === currentDeviceId
        });
      });
      // Sort with current device first, then newest lastActiveAt
      list.sort((a, b) => {
        if (a.isCurrentDevice) return -1;
        if (b.isCurrentDevice) return 1;
        return (b.lastActiveAt || 0) - (a.lastActiveAt || 0);
      });
      onUpdate(list);
    }, (error) => {
      console.warn("Device subscription error:", error);
    });
  } catch (err) {
    return () => {};
  }
}

/**
 * Revoke/delete a remote device session
 */
export async function revokeDevice(userId: string, deviceId: string): Promise<void> {
  const path = `users/${userId}/devices/${deviceId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'devices', deviceId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Register account with email and password
 */
export async function signUpWithEmail(fullName: string, email: string, password: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;

  // Set user display name & initial avatar
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName.trim())}`;
  await updateProfile(user, {
    displayName: fullName.trim(),
    photoURL: defaultAvatar
  });

  // Send verification email
  try {
    await sendEmailVerification(user);
  } catch (err) {
    console.warn("Email verification send error:", err);
  }

  // Create Firestore profile document
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  try {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: fullName.trim(),
      email: user.email,
      photoURL: defaultAvatar,
      emailVerified: false,
      authProviders: ['password'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      accountStatus: 'active'
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }

  // Register device
  await registerDevice(user);
  return user;
}

/**
 * Log in with email and password
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;

  // Update last login
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || email.split('@')[0],
      email: user.email,
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'user')}`,
      emailVerified: user.emailVerified,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    // Continue even if profile sync has a transient delay
  }

  await registerDevice(user);
  return user;
}

/**
 * Continue with Google OAuth popup flow
 */
export async function loginWithGoogle(): Promise<User | null> {
  let result;
  try {
    result = await signInWithPopup(auth, googleProvider);
  } catch (err: any) {
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      // User closed the popup window before finishing sign-in
      return null;
    }
    throw err;
  }

  const user = result.user;

  // Retrieve or create cloud user profile
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;

  try {
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      // First time Google user
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Zinnia User',
        email: user.email,
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.uid)}`,
        emailVerified: user.emailVerified || true,
        authProviders: ['google.com'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        accountStatus: 'active'
      });
    } else {
      // Returning user - update last login
      await updateDoc(userRef, {
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: user.emailVerified
      });
    }
  } catch (err) {
    console.warn("Google login Firestore profile sync:", err);
  }

  await registerDevice(user);
  return user;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Resend verification email to current user
 */
export async function resendVerification(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

/**
 * Sign out of Zinnia AI
 */
export async function signOutUser(): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    const deviceId = getOrCreateDeviceId();
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'devices', deviceId));
    } catch (e) {}
  }
  await signOut(auth);
}

/**
 * Update user display name or photo
 */
export async function updateUserProfile(name: string, photoURL?: string, extra?: Record<string, any>): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  await updateProfile(user, {
    displayName: name,
    photoURL: photoURL || user.photoURL
  });

  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      displayName: name,
      photoURL: photoURL || user.photoURL,
      updatedAt: new Date().toISOString(),
      ...(extra || {})
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Permanent account deletion: deletes cloud records and auth identity
 */
export async function deleteCurrentAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const userId = user.uid;

  // 1. Delete devices
  try {
    const devicesSnap = await getDocs(collection(db, 'users', userId, 'devices'));
    for (const d of devicesSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (e) {}

  // 2. Delete conversations and messages
  try {
    const convSnap = await getDocs(collection(db, 'users', userId, 'conversations'));
    for (const c of convSnap.docs) {
      const msgSnap = await getDocs(collection(db, 'users', userId, 'conversations', c.id, 'messages'));
      for (const m of msgSnap.docs) {
        await deleteDoc(m.ref);
      }
      await deleteDoc(c.ref);
    }
  } catch (e) {}

  // 3. Delete user document
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (e) {}

  // 4. Delete Auth identity
  await deleteUser(user);
}

/**
 * Map Firebase User to our app's UserProfile
 */
export function mapFirebaseUserToProfile(user: User | null, firestoreData?: any): UserProfile {
  if (!user) {
    return {
      name: 'Guest User',
      email: '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`,
      isLoggedIn: false
    };
  }

  const providers = user.providerData.map(p => p.providerId);

  return {
    name: firestoreData?.displayName || user.displayName || user.email?.split('@')[0] || 'Zinnia User',
    email: user.email || '',
    avatar: firestoreData?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.uid)}`,
    isLoggedIn: true,
    gender: firestoreData?.gender || 'other',
    location: firestoreData?.location || '',
    emailVerified: user.emailVerified,
    uid: user.uid,
    authProviders: providers
  } as UserProfile & { emailVerified?: boolean; uid?: string; authProviders?: string[] };
}
