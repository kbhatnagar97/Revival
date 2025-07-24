# Revival Habit Tracker - Database Schema & Usage Guide

## **Firebase Database Schema**

> **Note**: All `timestamp` fields use Firestore's native `Timestamp` type, not JavaScript `Date` objects.

### **Database Structure Overview**
```
users/{userId} → UserDocument
├── devices/{deviceId} → UserDeviceDocument
├── habits/{habitId} → HabitDocument
├── habits/{habitId}/entries/{YYYY-MM-DD} → HabitEntry (Analytics Subcollection)
└── userSessions/{sessionId} → UserSession
```

---

## **1. Root Collection: Users**

### **users/{userId} - UserDocument**
```typescript
interface UserDocument {
  email: string;           // User's email address - displayed in profile, used for auth
  name: string;            // Display name - shown in UI header, editable in profile settings
  picture?: string;        // Profile image URL - from Google/uploaded, displayed as avatar
  provider: 'google.com' | 'password'; // Auth method - determines login flow in AuthContext
  createdAt: Timestamp;    // Account creation - set once on signup, used for analytics
  timezone: string; // IANA Time Zone Database name (e.g., "America/Los_Angeles")
  lastSeenAt: Timestamp;  // Session end time heartbeat function for every 30 seconds threshold 1 minute for updating last seen on any device
}
```

### **2. users/{userId}/devices/{deviceId} - UserDeviceDocument**
```typescript
interface UserDeviceDocument {
  // Device Identification (for display & debugging)
  type: 'mobile' | 'web' | 'desktop'; // The client platform type
  deviceModel?: string;                 // e.g., "iPhone 14 Pro", "Samsung Galaxy S23" (from device hardware)
  osName: string;                        // e.g., "iOS", "Android", "Windows", "macOS"
  osVersion: string;                     // e.g., "16.2", "13"
  fcmToken: string;                      // Firebase Cloud Messaging token - used for push notifications
  lastSeenAt: Timestamp;  // Session end time heartbeat function for every 30 seconds threshold 1 minute for updating last seen for that specific device

  // Status & Metadata
  firstRegisteredAt: Timestamp;          // When this device was first seen for this user.
}
```

### **3. users/{userId}/habits/{habitId} - HabitDocument**
```typescript
interface HabitDocument {
  name: string;                  // Habit name (e.g., "Morning Workout") - displayed in cards and lists
  icon: string;                  // Icon identifier (e.g., "FaDumbbell") - maps to React Icons
  color: string;                 // Hex color code (e.g., "#3498db") - used for theming and visual identity
  goal: number;                  // Daily goal count - must be greater than 0, used for completion calculation
  scheduledDays: { [day: string]: boolean };       // Days of week { "Monday": true, "Friday": true } - at least one day must be selected
  
  // Metadata
  createdAt: Timestamp;          // When habit was created - used for sorting and analytics
  updatedAt: Timestamp;          // Last modification time - tracks when habit settings changed
  order: number;                 // Display order for drag-and-drop - determines position in habit list
  isActive: boolean;             // Whether habit is active - used for soft delete functionality
  
  // cloud functions on every habit completion or decompletion
  currentStreak: number;         // Current consecutive completion streak - calculcualted by Cloud Functions
  bestStreak: number;            // All-time best streak - historical maximum for motivation
  totalCompletions: number;      // Total times goal was met - lifetime achievement counter
  
  // cloud functions on every habit entry update
  analytics: {
    allTimeConsistency: number;  // Overall completion rate percentage - total completions / total scheduled days
    totalDebt: number;           // Cumulative missed completions - accountability metric
    totalSurplus: number;        // Cumulative extra completions - overachievement tracking
  };
}
```

### **4. users/{userId}/habits/{habitId}/entries/{YYYY-MM-DD} - HabitEntry (Analytics Optimization)**
```typescript
interface HabitEntry {
  count: number;                 // Number of completions for this day
  goalAtTime: number;            // Goal when entry was created
}
```

### **5. users/{userId}/userSessions/{sessionId} - UserSession**
```typescript
//Time To Live) policy of 30 days
interface UserSession {
  deviceId: string;       // Links to UserDevice - used to track which device session belongs to
  loginAt: Timestamp;     // Session start time - set on AuthProvider login, shown in security log 
  lastSeenAt: Timestamp;  // Session end time heartbeat function for every 30 seconds threshold 1 minute for updating last seen
  ipAddress?: string;      // IP address of the user - used for security logging
  location?: {             // Location of the user - used for security logging  
    city?: string;          // City of the user - used for security logging
    country?: string;       // Country of the user - used for security logging
    region?: string;        // Region of the user - used for security logging
    latitude?: number;      // Latitude of the user - used for security logging
    longitude?: number;     // Longitude of the user - used for security logging
  }
}
```

---

## **Timestamp Usage**

All timestamp fields in the schema use Firestore's native `Timestamp` type for optimal performance and consistency:

```typescript
import { Timestamp } from 'firebase/firestore';

// Creating timestamps
const now = Timestamp.now();
const fromDate = Timestamp.fromDate(new Date());

// Converting to JavaScript Date
const jsDate = timestamp.toDate();

// Example usage in document creation
const habitData = {
  name: 'Morning Workout',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};
```

