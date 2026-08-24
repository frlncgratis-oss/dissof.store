import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with Database ID from config & persistence
const firestoreDbId = firebaseConfig.firestoreDatabaseId || '(default)';

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firestoreDbId);

export const auth = getAuth(app);

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Register Admin Device FCM Token to Firestore `admin_tokens` collection
 */
export async function registerAdminFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase Messaging is not supported in this browser/environment.');
      return null;
    }

    let registration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        const baseUrl = (import.meta as any).env?.BASE_URL || './';
        const swPath = baseUrl.endsWith('/') ? `${baseUrl}firebase-messaging-sw.js` : `${baseUrl}/firebase-messaging-sw.js`;
        registration = await navigator.serviceWorker.register(swPath, {
          scope: baseUrl
        });
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn('FCM SW registration fallback:', swErr);
      }
    }

    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, {
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      const sanitizedDocId = currentToken.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
      const tokenDocRef = doc(db, 'admin_tokens', sanitizedDocId);
      
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      await setDoc(tokenDocRef, {
        token: currentToken,
        platform: isIOS ? 'iOS Safari / PWA' : 'Web / Android',
        device: navigator.platform || 'Unknown',
        userAgent: navigator.userAgent,
        updatedAt: new Date().toISOString(),
        role: 'admin'
      }, { merge: true });

      console.log('FCM Admin Token registered & saved to Firestore admin_tokens:', currentToken.substring(0, 15) + '...');
      return currentToken;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.warn('An error occurred while retrieving FCM token:', err);
    return null;
  }
}

/**
 * Listen for foreground FCM messages
 */
export async function setupFCMForegroundListener(onMessageCallback: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {};

  try {
    const { getMessaging, onMessage, isSupported } = await import('firebase/messaging');
    const supported = await isSupported();
    if (!supported) return () => {};

    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      console.log('FCM Foreground message received:', payload);
      onMessageCallback(payload);
    });
  } catch (err) {
    console.warn('Could not attach FCM foreground listener:', err);
    return () => {};
  }
}

// Test connection on initialization
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'store_config'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore offline cache in use.");
    }
  }
}
testConnection();

export default app;

