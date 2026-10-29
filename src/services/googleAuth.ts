import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
// Enable select account prompt only if needed, otherwise seamless
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to track sign-in transition
let isSigningIn = false;
// In-memory token cache (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

/**
 * Initializes Firebase Auth state listener and preserves user session across page reloads.
 * Does NOT kick user out if access token is simply awaiting on-demand retrieval.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

/**
 * Helper to identify if an error is a user-initiated cancellation or popup closure
 */
export const isAuthCancellation = (error: any): boolean => {
  if (!error) return false;
  const code = error?.code || '';
  const message = error?.message || (typeof error === 'string' ? error : '');
  return (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/user-cancelled' ||
    (typeof message === 'string' &&
      (message.includes('auth/popup-closed-by-user') ||
        message.includes('popup-closed-by-user') ||
        message.includes('cancelled-popup-request') ||
        message.includes('user-cancelled')))
  );
};

/**
 * Perform Google Sign-In with GoogleAuthProvider and save token in memory
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve access token from Google Auth.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (isAuthCancellation(error)) {
      // User closed popup or cancelled sign-in intentionally; resolve gracefully
      return null;
    }

    if (error?.code === 'auth/popup-blocked') {
      const blockedMsg =
        'The Google Sign-In popup was blocked by your browser. Please allow popups for this site and try again.';
      console.warn(blockedMsg);
      throw new Error(blockedMsg);
    }

    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieves the cached access token or requests it seamlessly if missing
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out and clear cached credentials
 */
export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};
