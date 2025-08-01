# Revival Habit Tracker - Database Schema & Usage Guide

## **Firebase Database Schema**

> **Note**: All `timestamp` fields use Firestore's native `Timestamp` type, not JavaScript `Date` objects.

### **Database Structure Overview**

```
users/{userId} → UserDocument
├── devices/{deviceId} → UserDeviceDocument
├── habits/{habitId} → HabitDocument
├── entries/{YYYY-MM-DD} → DailyEntry (Daily habit entries collection)
└── userSessions/{sessionId} → UserSession
```

---

## **1. Root Collection: Users**

### **users/{userId} - UserDocument**

```typescript
interface UserDocument {
  email: string; // User's email address - displayed in profile, used for auth
  displayName: string; // Display name - shown in UI header, editable in profile settings
  picture?: string; // Profile image URL - from Google/uploaded, displayed as avatar
  provider: 'google.com' | 'password'; // Auth method - determines login flow in AuthContext
  createdAt: Timestamp; // Account creation - set once on signup, used for analytics
  timezone: string; // IANA Time Zone Database name (e.g., "America/Los_Angeles")
  lastSeenAt: Timestamp; // Heartbeat function 5 minutes
}
```

### **2. users/{userId}/devices/{deviceId} - UserDeviceDocument**

```typescript
interface UserDeviceDocument {  
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
```

### **3. users/{userId}/habits/{habitId} - HabitDocument**

```typescript
interface HabitDocument {
  name: string; // Habit name (e.g., "Morning Workout") - displayed in cards and lists
  icon: string; // Icon identifier (e.g., "FaDumbbell") - maps to React Icons
  color: string; // Hex color code (e.g., "#3498db") - used for theming and visual identity
  goal: number; // Daily goal count - must be greater than 0, used for completion calculation
  scheduledDays: { [day: string]: boolean }; // Days of week { "Monday": true, "Friday": true } - at least one day must be selected

  // Metadata
  createdAt: Timestamp; // When habit was created - used for sorting and analytics
  updatedAt: Timestamp; // Last modification time - tracks when habit settings changed
  order: number; // Display order for drag-and-drop - determines position in habit list
  status: 'active' | 'paused' | 'archived'; // Replaces isActive for more granular control
  reminder?: {
    isEnabled?: boolean;
    time?: string; // e.g., "HH:mm" format in the user's local timezone
    message?: string; // Optional custom reminder message
  } | null;

  analytics: {
    // cloud functions on every habit entry update
    totalDebt: number; // Cumulative missed completions - accountability metric
    totalSurplus: number; // Cumulative extra completions - overachievement tracking

    // cloud functions on every habit completion or decompletion
    currentStreak: number; // Current consecutive completion streak - calculcualted by Cloud Functions
    bestStreak: number; // All-time best streak - historical maximum for motivation
    totalCompletions: number; // Total times goal was met - lifetime achievement counter
    allTimeConsistency: number; // Overall completion rate percentage - total completions / total scheduled days
  };
}
```

### **4. users/{userId}/entries/{YYYY-MM-DD} - DailyEntry (Daily Habit Tracking)**

```typescript
interface DailyEntry {
  date: string; // YYYY-MM-DD format - matches document ID for easy querying
  habits: HabitEntryData[]; // Array of habit entries for this specific date
  createdAt: Timestamp; // When first habit was logged for this date - used for analytics
  updatedAt: Timestamp; // Last modification time - updated when any habit changes
}

interface HabitEntryData {
  habitId: string; // Reference to habit document - used for joining habit metadata
  habitName: string; // Reference to habit document for readibility
  count: number; // Number of completions for this day - displayed in UI counters
  completed: boolean; // Whether goal was met (count >= goalAtTime) - used for streak calculation
  goalAtTime: number; // Goal when entry was created - preserves historical accuracy for analytics
  notes?: string; // Optional notes for this habit on this date - displayed in detail views
  createdAt: Timestamp; // When this specific habit entry was first created - audit trail
  updatedAt: Timestamp; // When this specific habit entry was last updated - conflict resolution
}
```

### **5. users/{userId}/userSessions/{sessionId} - UserSession**

```typescript
// TTL (Time To Live) policy of 30 days
interface UserSession {
  deviceId: string; // Links to UserDevice - used to track which device session belongs to
  loginAt: Timestamp; // Session start time - set on AuthProvider login, shown in security log
  lastSeenAt: Timestamp; // Heartbeat function 5 minutes
  ipAddress?: string; // IP address of the user - used for security logging

  // Enhanced browser context (changes frequently)
  browser: {
    name: string;                       // "Chrome", "Safari"
    version: string;                    // "120.0.6099.109"
    engine: string;                     // "Blink", "Gecko"
    userAgent: string;
    language: string;                   // "en-US"
    languages: string[];                // ["en-US", "en"]
    platform: string;                  // "Win32", "MacIntel"
    cookiesEnabled: boolean;
    doNotTrack: boolean;
  };
  
  // Dynamic display state
  orientation: 'portrait' | 'landscape';
  
  // Enhanced location (IP-based, can change per session)
  location: {
    ipAddress: string;                  // Store IP as-is for accuracy
    country: string;                    // "India", "United States"
    countryCode: string;                // "IN", "US" (for consent logic)
    region?: string;                    // "Maharashtra"
    city?: string;                      // "Mumbai"
    timezone: string;                   // "Asia/Kolkata"
    timezoneOffset: number;             // -330
  };
  
  // Security context (can vary per session)
  security: {
    httpsSupport: boolean;
    secureContext: boolean;
  };

  // Network information (from IP reverse DNS lookup per session)
  network: {
    hostname?: string;                  // Reverse DNS lookup from IP
    isp?: string;                       // Internet Service Provider
    asn?: string;                       // Autonomous System Number
  };
}
```
---

## **Privacy Compliance & Consent Management**

### **Location-Based Consent Requirements**

**Consent Required Locations:**
- **EU (GDPR)**: All 27 EU member states
- **California (CCPA)**: US state of California only

**No Consent Required:**
- **India**: No consent prompts - collect all data automatically
- **Rest of World**: No consent prompts - collect all data automatically

### **Minimum Compliance Requirements**

#### **EU (GDPR) - Subtle Consent**
```typescript
interface GDPRConsent {
  deviceFingerprinting: boolean;      // "Device information for security"
  locationTracking: boolean;          // "General location for personalization"
  analyticsTracking: boolean;         // "Usage analytics for app improvement"
}
```

**Required Disclosures:**
- Device hardware specs collection
- Browser information tracking
- IP-based location detection
- Session behavior analytics

#### **California (CCPA) - Minimal Consent**
```typescript
interface CCPAConsent {
  personalDataCollection: boolean;    // "Personal information collection"
  dataSharing: boolean;              // "Data sharing with service providers"
}
```

**Required Disclosures:**
- Personal information collection (device ID, location)
- Data sharing with analytics providers
- Right to opt-out available

### **Consent UI Design - Revival Theme**

#### **EU Consent Modal**
```scss
.consent-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  
  .consent-header {
    color: #ffffff;
    font-weight: 600;
    margin-bottom: 16px;
  }
  
  .consent-options {
    .option-card {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      
      .toggle-switch {
        accent-color: #667eea;
      }
    }
  }
  
  .consent-buttons {
    .accept-btn {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-weight: 600;
    }
    
    .decline-btn {
      background: transparent;
      color: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 12px 24px;
    }
  }
}
```

#### **California Consent Banner**
```scss
.ccpa-banner {
  background: rgba(102, 126, 234, 0.95);
  backdrop-filter: blur(8px);
  border-top: 2px solid #667eea;
  padding: 16px;
  
  .banner-text {
    color: #ffffff;
    font-size: 14px;
    line-height: 1.4;
  }
  
  .banner-actions {
    .accept-btn {
      background: #ffffff;
      color: #667eea;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-weight: 600;
      margin-right: 12px;
    }
    
    .learn-more {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: underline;
      background: none;
      border: none;
      cursor: pointer;
    }
  }
}
```

---

## **Implementation Action Plan**

### **Phase 1: Foundation Setup (Week 1)**
1. **Extend existing services** - enhance `deviceService.ts` and `sessionService.ts`
2. **Add consent detection** - create `consentService.ts` using existing location detection
3. **Update existing hooks** - enhance `useDeviceSession.ts` with new fields
4. **Database migration** - add new fields to existing Firestore collections

### **Phase 2: Data Collection Enhancement (Week 2)**
1. **Enhance device registration** - extend existing `registerDevice` function
2. **Upgrade session creation** - extend existing `createSession` function  
3. **Add capability detection** - integrate with existing browser compatibility utils
4. **Location enhancement** - extend existing IP detection in cloud functions

### **Phase 3: Consent Integration (Week 3)**
1. **Location-based consent** - integrate with existing `AuthProvider.tsx`
2. **Consent UI components** - add to existing `common/components/`
3. **Consent state management** - extend existing `AuthContext.tsx`
4. **Conditional data collection** - modify existing collection logic

### **Phase 4: Testing & Rollout (Week 4)**
1. **Backward compatibility testing** - ensure existing functionality works
2. **Gradual feature rollout** - enable enhanced tracking progressively
3. **Data validation** - monitor field population rates
4. **Performance optimization** - ensure no impact on app performance

### **Code Organization Strategy**

#### **Extend Existing Files (No Scattering)**
```
packages/frontend/src/services/
├── deviceService.ts          # Enhance existing device registration
├── sessionService.ts         # Enhance existing session management
├── consentService.ts         # NEW - consent logic only
└── userService.ts           # Enhance existing user management

packages/frontend/src/hooks/
├── useDeviceSession.ts      # Enhance existing hook
└── useConsent.ts           # NEW - consent management only

packages/frontend/src/common/components/
├── ConsentModal/           # NEW - EU consent modal
└── ConsentBanner/          # NEW - California banner

packages/functions/src/
├── devices/registerDevice.ts    # Enhance existing function
├── sessions/createSession.ts    # Enhance existing function
└── privacy/consentManager.ts    # NEW - consent validation
```

#### **Maintain Code Readability**
- **Single Responsibility**: Each service handles one concern
- **Extend, Don't Replace**: Build on existing code patterns
- **Consistent Naming**: Follow existing naming conventions
- **Type Safety**: Use existing TypeScript patterns
- **Error Handling**: Follow existing error handling patterns

This approach ensures seamless implementation without breaking existing functionality while maintaining clean, readable code architecture.