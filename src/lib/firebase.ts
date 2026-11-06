import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Check if Firebase is properly configured (and not a remix placeholder)
export const isFirebaseConfigured = Boolean(
  firebaseConfig &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'remixed-project-id' &&
    firebaseConfig.apiKey
);

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = initializeApp(firebaseConfig);
    const databaseId =
      (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
      '(default)';
    dbInstance = getFirestore(appInstance, databaseId);
    authInstance = getAuth(appInstance);
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
  }
}

export const app = appInstance;
export const db = dbInstance;
export const auth = authInstance;
export const currentFirebaseConfig = firebaseConfig as {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  oAuthClientId?: string;
};

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection to Firestore operates with offline persistence enabled


// Configure GoogleAuthProvider with Drive & Sheets scopes
const googleProvider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => googleProvider.addScope(scope));
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory cache for Google OAuth access token (NEVER stored in localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
const authListeners = new Set<(user: User | null, token: string | null) => void>();

function notifyAuthListeners(user: User | null, token: string | null) {
  authListeners.forEach((cb) => cb(user, token));
}

export const subscribeGoogleAuth = (
  callback: (user: User | null, token: string | null) => void
) => {
  authListeners.add(callback);
  callback(auth?.currentUser || null, cachedAccessToken);
  return () => {
    authListeners.delete(callback);
  };
};

// Initialize auth state listener on app load
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      notifyAuthListeners(user, cachedAccessToken);
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
      }
      notifyAuthListeners(null, null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup & acquire Workspace Access Token
export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  if (!auth) {
    throw new Error(
      'ยังไม่ได้ตั้งค่า Firebase สำหรับโปรเจกต์นี้ กรุณากดเชื่อมต่อ Firebase ใน AI Studio'
    );
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่สามารถดึง Access Token สำหรับ Google Drive / Sheets ได้');
    }
    cachedAccessToken = credential.accessToken;
    notifyAuthListeners(result.user, cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  if (auth) {
    await auth.signOut();
  }
  cachedAccessToken = null;
  notifyAuthListeners(null, null);
};
