# Revival Cloud Functions Backend Implementation Plan

## 🎯 **Overview**

This document outlines the implementation plan for migrating Revival from localStorage to a Firebase Cloud Functions backend with proper coding standards, TypeScript best practices, and scalable monorepo architecture.

---

## 📋 **Target Project Structure**

```
revival/
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml
│       └── deploy-functions.yml
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── habit.ts
│   │   │   │   └── dailyEntry.ts
│   │   │   └── utils/
│   │   │       ├── dateUtils.ts
│   │   │       └── validationUtils.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── frontend/
│   │   ├── src/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── firebase.json
│   └── functions/
│       ├── src/
│       │   ├── index.ts
│       │   ├── habits/
│       │   │   ├── onHabitDelete.ts
│       │   │   ├── onHabitUpdate.ts
│       │   │   └── recalculateSummary.ts
│       │   ├── dailyEntries/
│       │   │   ├── onDailyEntryWrite.ts
│       │   │   └── calculateStreaks.ts
│       │   └── notifications/
│       │       └── sendReminders.ts
│       ├── package.json
│       └── tsconfig.json
├── firebase.json
├── firestore.rules
├── package.json (root)
└── README.md
```

---

## 📋 **Implementation Phases**

### **Phase 1: Infrastructure & Foundation**

#### **1.1 Root Configuration**

**Root package.json** - Workspace configuration:
```json
{
  "name": "revival-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "dev:frontend": "npm run dev --workspace=packages/frontend",
    "dev:functions": "npm run dev --workspace=packages/functions",
    "deploy:frontend": "npm run deploy --workspace=packages/frontend",
    "deploy:functions": "npm run deploy --workspace=packages/functions"
  }
}
```

#### **1.2 Shared Package**

**packages/shared/src/types/index.ts**:
```typescript
export * from './user';
export * from './habit';
export * from './dailyEntry';
```

**packages/shared/src/types/habit.ts**:
```typescript
import { Timestamp } from 'firebase-admin/firestore';

export interface HabitDocument {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  goal: number;
  scheduledDays: { [day: string]: boolean }; // { "mon": true, "tue": false, ... }
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  sortOrder: number;
  
  // Denormalized summary (calculated by Cloud Functions)
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // 0-100
  lastCalculated: Timestamp;
}

export interface CreateHabitRequest {
  name: string;
  icon: string;
  color: string;
  goal: number;
  scheduledDays: { [day: string]: boolean };
}

export interface UpdateHabitRequest {
  name?: string;
  icon?: string;
  color?: string;
  goal?: number;
  scheduledDays?: { [day: string]: boolean };
}
```

**packages/shared/src/types/dailyEntry.ts**:
```typescript
import { Timestamp } from 'firebase-admin/firestore';

export interface DailyEntry {
  id: string;
  habitId: string;
  userId: string;
  date: Timestamp; // Midnight in user's timezone
  count: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UpdateEntryRequest {
  habitId: string;
  date: string; // YYYY-MM-DD format
  count: number;
}
```

**packages/shared/src/types/user.ts**:
```typescript
import { Timestamp } from 'firebase-admin/firestore';

export interface UserDocument {
  id: string;
  email: string;
  displayName?: string;
  timezone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSeenAt: Timestamp;
}
```

**packages/shared/src/utils/dateUtils.ts**:
```typescript
import { Timestamp } from 'firebase-admin/firestore';
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import { startOfDay } from 'date-fns';

export const dateUtils = {
  /**
   * Get midnight timestamp for today in user's timezone
   */
  getTodayMidnight(timezone: string): Timestamp {
    const now = new Date();
    const zonedNow = utcToZonedTime(now, timezone);
    const startOfDayZoned = startOfDay(zonedNow);
    const utcMidnight = zonedTimeToUtc(startOfDayZoned, timezone);
    return Timestamp.fromDate(utcMidnight);
  },

  /**
   * Convert date string (YYYY-MM-DD) to midnight timestamp in timezone
   */
  dateStringToTimestamp(dateString: string, timezone: string): Timestamp {
    const [year, month, day] = dateString.split('-').map(Number);
    const zonedDate = new Date(year, month - 1, day);
    const utcMidnight = zonedTimeToUtc(zonedDate, timezone);
    return Timestamp.fromDate(utcMidnight);
  },

  /**
   * Check if a date falls on scheduled days
   */
  isDateScheduled(date: Date, scheduledDays: { [day: string]: boolean }): boolean {
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayName = dayNames[date.getDay()];
    return scheduledDays[dayName] === true;
  }
};
```

**packages/shared/src/utils/validationUtils.ts**:
```typescript
import type { CreateHabitRequest, UpdateEntryRequest } from '../types';

export const validationUtils = {
  validateHabitName(name: string): boolean {
    return name.trim().length > 0 && name.length <= 35;
  },

  validateHabitGoal(goal: number): boolean {
    return goal > 0 && goal <= 100 && Number.isInteger(goal);
  },

  validateCreateHabitRequest(request: CreateHabitRequest): string[] {
    const errors: string[] = [];
    
    if (!this.validateHabitName(request.name)) {
      errors.push('Habit name must be 1-35 characters');
    }
    
    if (!this.validateHabitGoal(request.goal)) {
      errors.push('Goal must be a positive integer between 1-100');
    }
    
    const hasScheduledDay = Object.values(request.scheduledDays).some(Boolean);
    if (!hasScheduledDay) {
      errors.push('At least one day must be scheduled');
    }
    
    return errors;
  }
};
```

#### **1.3 Functions Package**

**packages/functions/src/index.ts**:
```typescript
export { onUserCreate } from './users/onUserCreate';
export { onHabitUpdate } from './habits/onHabitUpdate';
export { onHabitDelete } from './habits/onHabitDelete';
export { onDailyEntryWrite } from './dailyEntries/onDailyEntryWrite';
export { recalculateSummary } from './habits/recalculateSummary';
```
- Use consistent naming: `Document` for Firestore docs, `Request/Response` for API
- All timestamps use Firestore `Timestamp` type

#### **1.3 Cloud Functions Package Structure**

**Location**: `packages/cloud-functions/`

**Files to Create**:

```
packages/cloud-functions/
├── src/
│   ├── index.ts                    # Main exports
│   ├── functions/
│   │   ├── habits/
│   │   │   ├── onHabitEntryWrite.ts
│   │   │   └── index.ts
│   │   ├── users/
│   │   │   ├── onUserCreate.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── habitOperations.ts      # Cloud Functions specific habit logic
│   │   ├── userOperations.ts       # Cloud Functions specific user logic
│   │   ├── dateUtils.ts            # Date/timezone utilities
│   │   ├── validationUtils.ts      # Input validation
│   │   └── responseUtils.ts        # HTTP response helpers
│   └── constants.ts                # Cloud Functions constants
├── package.json
├── tsconfig.json
└── .eslintrc.js
```

---

### **Phase 2: Cloud Functions Implementation**

#### **2.1 Core Configuration**

**packages/cloud-functions/src/constants.ts**:

```typescript
export const CONSTANTS = {
  TIMEZONE: {
    DEFAULT: 'America/Los_Angeles',
  },
  VALIDATION: {
    HABIT_NAME_MAX_LENGTH: 50,
    HABIT_GOAL_MAX: 100,
    MAX_HABITS_PER_USER: 50,
  },
  CACHE: {
    SUMMARY_TTL_HOURS: 24,
  },
} as const;
```

#### **2.2 Utility Functions**

**packages/cloud-functions/src/lib/dateUtils.ts**:

```typescript
import { Timestamp } from 'firebase-admin/firestore';
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import { addDays, subDays, isEqual } from 'date-fns';

export const dateUtils = {
  /**
   * Get midnight timestamp for a date in user's timezone
   * This is the canonical way to represent a "day" in Firestore
   */
  getMidnightTimestamp: (date: Date, timezone: string): Timestamp => {
    const dateString = format(utcToZonedTime(date, timezone), 'yyyy-MM-dd', {
      timeZone: timezone,
    });
    const midnightInTimezone = zonedTimeToUtc(
      `${dateString}T00:00:00`,
      timezone
    );
    return Timestamp.fromDate(midnightInTimezone);
  },

  /**
   * Get today's midnight timestamp in user's timezone
   */
  getTodayMidnight: (timezone: string): Timestamp => {
    return dateUtils.getMidnightTimestamp(new Date(), timezone);
  },

  /**
   * Get yesterday's midnight timestamp in user's timezone
   */
  getYesterdayMidnight: (timezone: string): Timestamp => {
    const yesterday = subDays(new Date(), 1);
    return dateUtils.getMidnightTimestamp(yesterday, timezone);
  },

  /**
   * Check if a timestamp represents a date that falls on specified days of week
   */
  isTimestampInDays: (
    timestamp: Timestamp,
    days: number[],
    timezone: string
  ): boolean => {
    const dateInTimezone = utcToZonedTime(timestamp.toDate(), timezone);
    const dayOfWeek = dateInTimezone.getDay();
    return days.includes(dayOfWeek);
  },

  /**
   * Get date range for analytics (returns midnight timestamps)
   */
  getDateRange: (
    daysBack: number,
    timezone: string
  ): { start: Timestamp; end: Timestamp } => {
    const today = new Date();
    const startDate = subDays(today, daysBack);

    return {
      start: dateUtils.getMidnightTimestamp(startDate, timezone),
      end: dateUtils.getMidnightTimestamp(today, timezone),
    };
  },

  /**
   * Check if two timestamps represent the same day in a timezone
   */
  isSameDay: (
    timestamp1: Timestamp,
    timestamp2: Timestamp,
    timezone: string
  ): boolean => {
    const date1 = utcToZonedTime(timestamp1.toDate(), timezone);
    const date2 = utcToZonedTime(timestamp2.toDate(), timezone);

    return (
      format(date1, 'yyyy-MM-dd', { timeZone: timezone }) ===
      format(date2, 'yyyy-MM-dd', { timeZone: timezone })
    );
  },
};
```

**packages/cloud-functions/src/lib/validationUtils.ts**:

```typescript
import { CONSTANTS } from '../constants';
import type { CreateHabitRequest } from '@revival/shared-types';

export const validationUtils = {
  /**
   * Validate habit creation request
   */
  validateCreateHabitRequest: (data: CreateHabitRequest): string[] => {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Habit name is required');
    } else if (data.name.length > CONSTANTS.VALIDATION.HABIT_NAME_MAX_LENGTH) {
      errors.push(
        `Habit name must be less than ${CONSTANTS.VALIDATION.HABIT_NAME_MAX_LENGTH} characters`
      );
    }

    if (
      !data.goal ||
      data.goal < 1 ||
      data.goal > CONSTANTS.VALIDATION.HABIT_GOAL_MAX
    ) {
      errors.push(
        `Goal must be between 1 and ${CONSTANTS.VALIDATION.HABIT_GOAL_MAX}`
      );
    }

    if (!data.scheduledDays || Object.keys(data.scheduledDays).length === 0) {
      errors.push('At least one day must be selected');
    }

    if (!data.icon?.trim()) {
      errors.push('Icon is required');
    }

    if (!data.color?.match(/^#[0-9A-F]{6}$/i)) {
      errors.push('Invalid color format');
    }

    return errors;
  },

  /**
   * Validate user ID format
   */
  validateUserId: (userId: string): boolean => {
    return typeof userId === 'string' && userId.length > 0;
  },

  /**
   * Validate date string format (YYYY-MM-DD)
   */
  validateDateString: (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  },
};
```

#### **2.3 Service Layer**

**packages/cloud-functions/src/functions/habits/onHabitEntryWrite.ts**:

```typescript
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { habitService } from '../../lib/habitOperations';
import { userService } from '../../lib/userOperations';
import { logger } from 'firebase-functions';
import type { HabitEntry } from '@revival/shared-types';

/**
 * Triggered when a habit entry is created/updated
 * Uses INCREMENTAL streak calculation for performance
 */
export const onHabitEntryWrite = onDocumentWritten(
  'users/{userId}/habits/{habitId}/entries/{entryId}',
  async (event) => {
    const { userId, habitId } = event.params;

    try {
      logger.info(
        `Processing habit entry update for user: ${userId}, habit: ${habitId}`
      );

      // Get the entry data from the event
      const entryData = event.data?.after?.data() as HabitEntry;
      if (!entryData) {
        logger.warn('No entry data found in event');
        return;
      }

      // Get user timezone for proper date calculations
      const user = await userService.getUserById(userId);
      const userTimezone = user?.timezone || 'America/Los_Angeles';

      // Calculate new streak incrementally (only 2-3 reads vs 100+)
      const currentStreak =
        await habitService.calculateCurrentStreakIncremental(
          userId,
          habitId,
          entryData,
          userTimezone
        );

      // Update denormalized summary on habit document
      await habitService.updateHabitSummary(userId, habitId, {
        currentStreak,
        lastCompletedTimestamp:
          entryData.count >= 1 ? entryData.date : undefined,
      });

      logger.info(
        `Successfully updated habit summary for ${habitId}, streak: ${currentStreak}`
      );
    } catch (error) {
      logger.error('Error processing habit entry update:', error);
      throw error;
    }
  }
);
```

**packages/cloud-functions/src/functions/users/onUserCreate.ts**:

```typescript
import { onCall } from 'firebase-functions/v2/https';
import { onUserRecord } from 'firebase-functions/v2/identity';
import { db, collections } from '../../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import type { UserDocument } from '@revival/shared-types';

/**
 * CORRECT: Use Auth trigger, not Firestore trigger
 * Triggered when a new user signs up via Firebase Auth
 */
export const onUserCreate = onUserRecord.onCreate(async (event) => {
  const { uid, email, displayName, photoURL, providerData } = event.data;

  try {
    logger.info(`Creating user document for new user: ${uid}`);

    // Determine auth provider
    const provider =
      providerData?.[0]?.providerId === 'google.com'
        ? 'google.com'
        : 'password';

    // Create user document in Firestore
    const userDoc: UserDocument = {
      email: email || '',
      name: displayName || '',
      picture: photoURL || undefined,
      provider,
      createdAt: Timestamp.now(),
      timezone: 'America/Los_Angeles', // Default timezone
      lastSeenAt: Timestamp.now(),
    };

    await db.collection(collections.users).doc(uid).set(userDoc);

    logger.info(`Successfully created user document for: ${uid}`);
  } catch (error) {
    logger.error('Error creating user document:', error);
    throw error;
  }
});
```

---

### **Phase 3: Frontend Integration**

#### **3.1 Update Frontend Package Structure**

```
packages/frontend/
├── src/
│   ├── services/
│   │   ├── habitService.ts      # 🔄 Update to use Cloud Functions
│   │   ├── userService.ts       # 🆕 New service
│   │   └── apiService.ts        # 🆕 HTTP client wrapper
│   ├── hooks/
│   │   ├── useHabits.ts         # 🔄 Update to use Firestore
│   │   ├── useHabitEntries.ts   # 🆕 New hook
│   │   └── useRealtimeData.ts   # 🆕 Firestore listeners
│   └── context/
│       └── HabitProvider.tsx    # 🔄 Remove localStorage logic
```

#### **3.2 Updated Frontend Services**

**packages/frontend/src/services/apiService.ts**:

```typescript
import { auth } from '../config/firebase';
import type { ApiResponse } from '@revival/shared-types';

class ApiService {
  private baseUrl =
    process.env.REACT_APP_FUNCTIONS_URL || 'http://localhost:5001';

  /**
   * Get authenticated headers with Firebase ID token
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const idToken = await user.getIdToken();

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    };
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();
```

---

### **Phase 4: Testing & Quality Assurance**

#### **4.1 Testing Strategy**

- **Unit Tests**: Jest for utility functions and services
- **Integration Tests**: Firebase emulator for Cloud Functions
- **E2E Tests**: Cypress for critical user flows
- **Performance Tests**: Load testing for Cloud Functions

#### **4.2 Code Quality Tools**

```json
// packages/cloud-functions/package.json
{
  "name": "@revival/cloud-functions",
  "scripts": {
    "build": "tsc",
    "deploy": "firebase deploy --only functions",
    "serve": "npm run build && firebase emulators:start --only functions"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "date-fns": "^3.0.0",
    "date-fns-tz": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}

// packages/cloud-functions/.eslintrc.js
{
  "extends": [
    "@typescript-eslint/recommended",
    "google"
  ],
  "rules": {
    "max-len": ["error", { "code": 100 }],
    "object-curly-spacing": ["error", "always"],
    "indent": ["error", 2]
  }
}
```

---

## 🎯 **Implementation Timeline**

### **Week 1: Foundation**

- [ ] Complete shared-types package
- [ ] Set up cloud-functions package structure
- [ ] Implement core utilities and configuration

### **Week 2: Core Functions**

- [ ] Implement user management functions
- [ ] Implement habit CRUD operations
- [ ] Set up Firestore security rules

### **Week 3: Frontend Integration**

- [ ] Update frontend services
- [ ] Implement Firestore listeners
- [ ] Remove localStorage dependencies

### **Week 4: Testing & Optimization**

- [ ] Write comprehensive tests
- [ ] Performance optimization
- [ ] Deploy to staging environment

---

## 📊 **Success Metrics**

- **Performance**: Habit operations < 100ms
- **Reliability**: 99.9% uptime for Cloud Functions
- **Code Quality**: 90%+ test coverage
- **User Experience**: Real-time updates without page refresh
- **Scalability**: Support 1000+ concurrent users

---

## 🔧 **Development Standards**

### **TypeScript Standards**

- Strict mode enabled
- Explicit return types for all functions
- Interface over type for object shapes
- Consistent naming conventions

### **Error Handling**

- Structured error responses
- Comprehensive logging
- Graceful degradation
- User-friendly error messages

### **Security**

- Firestore security rules
- Input validation on all endpoints
- Rate limiting on Cloud Functions
- Proper authentication checks

This plan ensures a robust, scalable, and maintainable Cloud Functions backend implementation following industry best practices.
