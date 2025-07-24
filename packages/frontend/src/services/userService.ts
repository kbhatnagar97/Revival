import { apiService } from './apiService';

// User interfaces based on the shared types
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  timezone: string;
  createdAt: string;
  lastSeen: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    reminderTime?: string;
  };
}

interface UpdateUserProfileRequest {
  displayName?: string;
  timezone?: string;
  preferences?: Partial<UserProfile['preferences']>;
}

interface UserStats {
  totalHabits: number;
  activeHabits: number;
  completedToday: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

class UserService {
  /**
   * Get current user profile
   */
  async getUserProfile(): Promise<UserProfile> {
    return await apiService.callFunction<UserProfile>('getUserProfile');
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: UpdateUserProfileRequest): Promise<UserProfile> {
    return await apiService.callFunction<UserProfile>('updateUserProfile', updates);
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    return await apiService.callFunction<UserStats>('getUserStats');
  }

  /**
   * Update user's last seen timestamp
   */
  async updateLastSeen(): Promise<void> {
    await apiService.callFunction('updateLastSeen');
  }

  /**
   * Delete user account and all associated data
   */
  async deleteUserAccount(): Promise<void> {
    await apiService.callFunction('deleteUserAccount');
  }

  /**
   * Export user data (GDPR compliance)
   */
  async exportUserData(): Promise<Record<string, unknown>> {
    return await apiService.callFunction('exportUserData');
  }

  /**
   * Update user timezone
   */
  async updateTimezone(timezone: string): Promise<void> {
    await this.updateUserProfile({ timezone });
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: Partial<UserProfile['preferences']>): Promise<void> {
    await this.updateUserProfile({ preferences });
  }
}

export const userService = new UserService();
export type { UserProfile, UpdateUserProfileRequest, UserStats };
