import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

// Storage file for push subscriptions
const DATA_DIR = path.join(process.cwd(), 'data');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'push_subscriptions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data dir:', e);
  }
}

// VAPID Credentials (fallback to generated pair if env not set)
const DEFAULT_VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || "BFwE1iQZdRkUGys-q3qh5brAiWKlg_fISZOdIXCJktih32YItCT_VFuGBDFg1c-ffjNdWH8xPwfjhYzkXr-m_3o";
const DEFAULT_VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "gC-D-4gEbEZwDqpNrx6ht_4b5STyGh2fyhZ2TekVQxA";
const DEFAULT_VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:frlncgratis@gmail.com";

// Configure Web Push with VAPID
try {
  webpush.setVapidDetails(
    DEFAULT_VAPID_SUBJECT,
    DEFAULT_VAPID_PUBLIC,
    DEFAULT_VAPID_PRIVATE
  );
  console.log('✅ Web-Push initialized with VAPID Public Key:', DEFAULT_VAPID_PUBLIC.substring(0, 15) + '...');
} catch (err) {
  console.error('❌ Failed to configure VAPID details:', err);
}

export interface StoredSubscription {
  id: string;
  subscription: webpush.PushSubscription;
  device?: string;
  platform?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

// Read all stored subscriptions
export function getStoredSubscriptions(): StoredSubscription[] {
  try {
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
    return JSON.parse(raw) as StoredSubscription[];
  } catch (err) {
    console.error('Error reading subscriptions file:', err);
    return [];
  }
}

// Save all subscriptions
export function saveStoredSubscriptions(subs: StoredSubscription[]): void {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing subscriptions file:', err);
  }
}

// Save or update a subscription
export function saveSubscription(
  subscription: webpush.PushSubscription,
  metadata?: { device?: string; platform?: string; userAgent?: string }
): StoredSubscription {
  const subs = getStoredSubscriptions();
  const endpoint = subscription.endpoint;
  const existingIndex = subs.findIndex(s => s.subscription.endpoint === endpoint);

  const now = new Date().toISOString();
  const subRecord: StoredSubscription = {
    id: existingIndex >= 0 ? subs[existingIndex].id : `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    subscription,
    device: metadata?.device || 'Unknown Device',
    platform: metadata?.platform || 'Unknown Platform',
    userAgent: metadata?.userAgent || '',
    createdAt: existingIndex >= 0 ? subs[existingIndex].createdAt : now,
    updatedAt: now
  };

  if (existingIndex >= 0) {
    subs[existingIndex] = subRecord;
  } else {
    subs.push(subRecord);
  }

  saveStoredSubscriptions(subs);
  return subRecord;
}

// Remove an invalid / expired subscription
export function removeSubscriptionByEndpoint(endpoint: string): void {
  const subs = getStoredSubscriptions();
  const filtered = subs.filter(s => s.subscription.endpoint !== endpoint);
  if (filtered.length !== subs.length) {
    saveStoredSubscriptions(filtered);
    console.log(`Cleaned up expired subscription. Remaining: ${filtered.length}`);
  }
}

export function getVapidPublicKey(): string {
  return DEFAULT_VAPID_PUBLIC;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  orderId?: string;
  totalPrice?: number;
  customerName?: string;
}

// Broadcast Web Push to all registered Admin devices
export async function sendPushToAllAdmins(payload: PushNotificationPayload) {
  const subs = getStoredSubscriptions();
  if (subs.length === 0) {
    console.log('⚠️ [Web Push] No admin subscriptions registered yet.');
    return { successCount: 0, failCount: 0, total: 0 };
  }

  const notificationData = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=192&auto=format&fit=crop&q=80',
    badge: payload.badge || 'https://images.unsplash.com/photo-1611591475152-4735d38d0145?w=96&auto=format&fit=crop&q=80',
    data: {
      url: payload.url || '/',
      orderId: payload.orderId || null,
      totalPrice: payload.totalPrice,
      customerName: payload.customerName,
      timestamp: Date.now()
    }
  });

  const pushOptions = {
    TTL: 60 * 60 * 24, // 24 hours
    urgency: 'high' as const, // For iOS & Android immediate wake-up
    topic: 'new-order'
  };

  let successCount = 0;
  let failCount = 0;

  console.log(`🚀 [Web Push] Sending push notification to ${subs.length} admin device(s)...`);

  await Promise.all(
    subs.map(async (subRecord) => {
      try {
        await webpush.sendNotification(
          subRecord.subscription,
          notificationData,
          pushOptions
        );
        successCount++;
        console.log(`✅ [Web Push] Sent to device (${subRecord.platform || subRecord.device}): ${subRecord.id}`);
      } catch (err: any) {
        failCount++;
        console.warn(`❌ [Web Push] Failed to deliver to ${subRecord.id}:`, err.statusCode || err.message);

        // 404 Not Found or 410 Gone means the subscription is no longer valid or unsubscribed
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`🧹 [Web Push] Auto-removing expired endpoint: ${subRecord.subscription.endpoint.substring(0, 35)}...`);
          removeSubscriptionByEndpoint(subRecord.subscription.endpoint);
        }
      }
    })
  );

  return { successCount, failCount, total: subs.length };
}
