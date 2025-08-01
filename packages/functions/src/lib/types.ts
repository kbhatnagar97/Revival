import { Timestamp } from 'firebase-admin/firestore';

export interface HabitDocument {
  name: string;
  icon: string;
  color: string;
  goal: number;
  scheduledDays: { [day: string]: boolean }; // e.g., { "Monday": true, "Friday": true }
  status: 'active' | 'paused' | 'archived';
  reminder?: { isEnabled?: boolean; time?: string; message?: string; } | null;
  analytics: {
    totalDebt: number;
    totalSurplus: number;
    currentStreak: number;
    bestStreak: number;
    totalCompletions: number;
    allTimeConsistency: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  order: number;
}

export interface DailyEntry {
  date: string;                    // YYYY-MM-DD format - matches document ID
  habits: HabitEntryData[];        // Array of habit entries for this specific date
  createdAt: Timestamp;            // When first habit was logged for this date
  updatedAt: Timestamp;            // Last modification time
}

export interface HabitEntryData {
  habitId: string;                 // Reference to habit document
  habitName: string;               // Reference to habit document for readability
  count: number;                   // Number of completions for this day
  completed: boolean;              // Whether goal was met (count >= goalAtTime)
  goalAtTime: number;              // Goal when entry was created
  notes?: string;                  // Optional notes for this habit on this date
  createdAt: Timestamp;            // When this specific habit entry was first created
  lastUpdated: Timestamp;          // When this specific habit entry was last updated
}

// Legacy interface for backward compatibility in API responses
export interface HabitEntry {
  id: string;                      // Generated ID combining date and habitId
  habitId: string;
  date: string;                    // YYYY-MM-DD format
  count: number;
  completed: boolean;
  goalAtTime: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;            // Keep as updatedAt for legacy API compatibility
}

export interface UserDocument {
  email: string;
  displayName: string;
  picture?: string;
  provider: 'google.com' | 'password';
  createdAt: Timestamp;
  timezone: string;
  lastSeenAt: Timestamp;
}

export interface UserDeviceDocument {
  // Device Identification (for display & debugging)
  type: 'mobile' | 'web' | 'desktop'; // The client platform type
  deviceModel?: string; // e.g., "iPhone 14 Pro", "Samsung Galaxy S23" (from device hardware)
  fcmToken?: string; // Firebase Cloud Messaging token - used for push notifications
  lastSeenAt: Timestamp; // Heartbeat function 5 minutes

  // Status & Metadata
  firstRegisteredAt: Timestamp; // When this device was first seen for this user.

  // Hardware specs (stable, auto-collectable)
  hardware: {
    screenResolution: string;           // "1920x1080"
    pixelRatio: number;                 // 1, 2, 3
    colorDepth: number;                 // 24, 32
    touchSupport: boolean;
    maxTouchPoints: number;
    hardwareConcurrency: number;        // CPU cores
  };
  
  // OS info (enhanced detection, no "unknown" values)
  os: {
    name: string;                       // "Windows", "macOS", "iOS", "Android"
    version: string;                    // "10.0.19042", "14.2"
  };
  
  // Device capabilities (auto-detectable)
  capabilities: {
    webGL: boolean;
    canvas: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    serviceWorker: boolean;
    pushNotifications: boolean;
    geolocation: boolean;
    camera: boolean;
    microphone: boolean;
    vibration: boolean;
  };

  // Network information (from IP reverse DNS lookup)
  network: {
    hostname?: string;                  // Reverse DNS lookup from IP
    isp?: string;                       // Internet Service Provider
  };
}

export interface UserSession {
  // TTL (Time To Live) policy of 30 days
  deviceId: string; // Links to UserDevice - used to track which device session belongs to
  loginAt: Timestamp; // Session start time - set on AuthProvider login, shown in security log
  lastSeenAt: Timestamp; // Heartbeat function 5 minutes
  ipAddress?: string; // IP address of the user - used for security logging
  location?: {
    // Location of the user - used for security logging
    city?: string; // City of the user - used for security logging
    country?: string; // Country of the user - used for security logging
    region?: string; // Region of the user - used for security logging
    latitude?: number; // Latitude of the user - used for security logging
    longitude?: number; // Longitude of the user - used for security logging
  };
}
