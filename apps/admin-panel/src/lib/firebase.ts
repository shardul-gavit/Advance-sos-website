import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Firebase configuration with environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "advance-sos.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "advance-sos",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "advance-sos.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.warn('⚠️ Missing Firebase configuration fields:', missingFields);
    return false;
  }
  
  // Check if using default values
  if (firebaseConfig.apiKey === "AIzaSyBxXxXxXxXxXxXxXxXxXxXxXxXxXxXx") {
    console.warn('⚠️ Using default Firebase API key. Please configure VITE_FIREBASE_API_KEY');
    return false;
  }
  
  return true;
};

// Initialize Firebase
let app;
let auth;
let messaging;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Only initialize messaging if in browser environment
  if (typeof window !== 'undefined') {
    messaging = getMessaging(app);
  }
  
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Create fallback objects to prevent crashes
  app = null;
  auth = null;
  messaging = null;
}

// FCM Service Worker Registration
const registerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker not supported in this environment');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('✅ Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

// FCM Token Management
export class FCMService {
  private static instance: FCMService;
  private currentToken: string | null = null;
  private isInitialized = false;

  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  async initialize(): Promise<string | null> {
    if (this.isInitialized) {
      return this.currentToken;
    }

    if (!validateFirebaseConfig()) {
      console.warn('⚠️ Firebase configuration invalid, skipping FCM initialization');
      return null;
    }

    try {
      await registerServiceWorker();
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ Notification permission denied');
        return null;
      }

      if (!messaging) {
        console.warn('⚠️ Firebase messaging not available');
        return null;
      }

      // Get FCM token
      this.currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "BEl62iUYgUivxIkv69yViEuiBIa1b-71zqHnyzFcPZo"
      });

      this.isInitialized = true;
      console.log('✅ FCM Token generated:', this.currentToken ? 'Success' : 'Failed');
      return this.currentToken;
    } catch (error) {
      console.error('❌ FCM initialization failed:', error);
      return null;
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.currentToken) {
      return await this.initialize();
    }
    return this.currentToken;
  }

  async saveTokenToSupabase(userId: string, token: string) {
    try {
      const { supabase } = await import('./supabase');
      const { error } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_id: userId,
          token: token,
          device_type: 'web',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      console.log('✅ FCM token saved to Supabase');
    } catch (error) {
      console.error('❌ Failed to save FCM token:', error);
    }
  }

  onMessageReceived(callback: (payload: any) => void) {
    if (!messaging) {
      console.warn('⚠️ Firebase messaging not available');
      return () => {};
    }

    return onMessage(messaging, (payload) => {
      console.log('📨 Message received:', payload);
      callback(payload);
    });
  }

  isSupported(): boolean {
    return validateFirebaseConfig() && messaging !== null;
  }
}

// Firebase Auth Service
export class FirebaseAuthService {
  static async signIn(email: string, password: string) {
    if (!auth) {
      return { user: null, error: 'Firebase Auth not initialized' };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  }

  static async signOut() {
    if (!auth) {
      return { error: 'Firebase Auth not initialized' };
    }

    try {
      await signOut(auth);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static getCurrentUser() {
    return auth ? auth.currentUser : null;
  }

  static onAuthStateChanged(callback: (user: any) => void) {
    if (!auth) {
      console.warn('⚠️ Firebase Auth not initialized');
      return () => {};
    }
    return auth.onAuthStateChanged(callback);
  }

  static isSupported(): boolean {
    return validateFirebaseConfig() && auth !== null;
  }
}

// Push Notification Service
export class PushNotificationService {
  static async sendSOSNotification(sosEventId: string, userId: string, location: any) {
    try {
      const { supabase } = await import('./supabase');
      
      // Get FCM tokens for helpers and responders
      const { data: tokens, error } = await supabase
        .from('fcm_tokens')
        .select('token')
        .eq('is_active', true)
        .in('user_id', await this.getHelperAndResponderIds());

      if (error) throw error;

      // Send push notifications
      const notification = {
        title: '🚨 SOS Emergency Alert',
        body: `Emergency at ${location.address || 'Unknown Location'}`,
        data: {
          sosEventId,
          userId,
          type: 'sos_emergency'
        }
      };

      // Send to all tokens
      for (const tokenData of tokens || []) {
        await this.sendToToken(tokenData.token, notification);
      }

      console.log('✅ SOS notifications sent successfully');
    } catch (error) {
      console.error('❌ Failed to send SOS notifications:', error);
    }
  }

  static async sendToToken(token: string, notification: any) {
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          notification
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error('❌ Failed to send to token:', error);
    }
  }

  private static async getHelperAndResponderIds(): Promise<string[]> {
    const { supabase } = await import('./supabase');
    
    const { data: helpers } = await supabase
      .from('users')
      .select('id')
      .eq('user_type', 'helper')
      .eq('status', 'available');

    const { data: responders } = await supabase
      .from('users')
      .select('id')
      .eq('user_type', 'responder')
      .eq('status', 'available');

    const helperIds = helpers?.map(h => h.id) || [];
    const responderIds = responders?.map(r => r.id) || [];

    return [...helperIds, ...responderIds];
  }

  static isSupported(): boolean {
    return FCMService.getInstance().isSupported();
  }
}

// Test Firebase configuration
export const testFirebaseConfiguration = () => {
  const isValid = validateFirebaseConfig();
  const authSupported = FirebaseAuthService.isSupported();
  const fcmSupported = FCMService.getInstance().isSupported();
  
  console.log('Firebase Configuration Test:');
  console.log('- Config Valid:', isValid);
  console.log('- Auth Supported:', authSupported);
  console.log('- FCM Supported:', fcmSupported);
  
  return { isValid, authSupported, fcmSupported };
};

export { app, auth, messaging }; 