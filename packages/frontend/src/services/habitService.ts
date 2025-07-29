import { apiService } from './apiService';

// Updated interfaces based on the Cloud Functions schema
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  goal: number;
  scheduledDays: { [day: string]: boolean }; // e.g., { "Monday": true, "Friday": true }
  status: 'active' | 'paused' | 'archived';
  reminder?: { isEnabled?: boolean; time?: string; message?: string; } | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  analytics: {
    totalDebt: number;
    totalSurplus: number;
    currentStreak: number;
    bestStreak: number;
    totalCompletions: number;
    allTimeConsistency: number;
  };
  
  // Legacy fields for backward compatibility - will be converted by helper functions
  days?: number[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface HabitEntry {
  id: string;                      // Generated ID combining date and habitId
  habitId: string;
  date: string;                    // YYYY-MM-DD format
  count: number;
  completed: boolean;
  goalAtTime: number;              // Goal when entry was created
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyEntry {
  date: string;                    // YYYY-MM-DD format
  habits: HabitEntry[];            // Array of habit entries for this date
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitRequest {
  name: string;
  icon: string;
  color: string;
  goal: number;
  days?: number[]; // Will be converted to scheduledDays by backend
}

export interface UpdateHabitRequest {
  name?: string;
  icon?: string;
  color?: string;
  goal?: number;
  days?: number[]; // Will be converted to scheduledDays by backend
  isActive?: boolean; // Will be converted to status by backend
  sortOrder?: number; // Will be converted to order by backend
  status?: 'active' | 'paused' | 'archived';
  reminder?: { isEnabled?: boolean; time?: string; message?: string; } | null;
}

export interface UpdateHabitEntryRequest {
  count?: number;
  completed?: boolean;
  notes?: string;
}

// Helper functions for schema conversion

function convertScheduledDaysToDays(scheduledDays: { [day: string]: boolean }): number[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const days: number[] = [];
  dayNames.forEach((dayName, index) => {
    if (scheduledDays[dayName]) {
      days.push(index);
    }
  });
  return days;
}

// Helper function to ensure habit has legacy fields for backward compatibility
function ensureLegacyFields(habit: Habit): Habit {
  return {
    ...habit,
    // Add legacy fields for backward compatibility
    days: habit.scheduledDays ? convertScheduledDaysToDays(habit.scheduledDays) : [0, 1, 2, 3, 4, 5, 6],
    isActive: habit.status === 'active',
    sortOrder: habit.order,
  };
}

class HabitService {
  /**
   * Get all habits for the current user
   */
  async getUserHabits(): Promise<Habit[]> {
    const habits = await apiService.callFunction<Habit[]>('getUserHabits');
    return habits.map(ensureLegacyFields);
  }

  /**
   * Create a new habit
   */
  async createHabit(habitData: CreateHabitRequest): Promise<Habit> {
    const habit = await apiService.callFunction<Habit>('createHabit', habitData);
    return ensureLegacyFields(habit);
  }

  /**
   * Update an existing habit
   */
  async updateHabit(habitId: string, updates: UpdateHabitRequest): Promise<Habit> {
    const habit = await apiService.callFunction<Habit>('updateHabit', {
      habitId,
      ...updates,
    });
    return ensureLegacyFields(habit);
  }

  /**
   * Delete a habit and all its entries
   */
  async deleteHabit(habitId: string): Promise<void> {
    await apiService.callFunction('deleteHabit', { habitId });
  }

  /**
   * Reorder habits
   */
  async reorderHabits(habitIds: string[]): Promise<void> {
    await apiService.callFunction('reorderHabits', { habitIds });
  }

  /**
   * Toggle habit active status
   */
  async toggleHabitActive(habitId: string): Promise<Habit> {
    const habit = await apiService.callFunction<Habit>('toggleHabitActive', { habitId });
    return ensureLegacyFields(habit);
  }

  /**
   * Get habit entries for a date range
   */
  async getHabitEntries(startDate: string, endDate: string): Promise<HabitEntry[]> {
    return await apiService.callFunction<HabitEntry[]>('getHabitEntries', {
      startDate,
      endDate,
    });
  }

  /**
   * Get habit entries for a specific habit
   */
  async getHabitEntriesForHabit(habitId: string, startDate?: string, endDate?: string): Promise<HabitEntry[]> {
    return await apiService.callFunction<HabitEntry[]>('getHabitEntriesForHabit', {
      habitId,
      startDate,
      endDate,
    });
  }

  /**
   * Update or create a habit entry for a specific date
   */
  async updateHabitEntry(
    habitId: string,
    date: string,
    updates: UpdateHabitEntryRequest
  ): Promise<HabitEntry> {
    return await apiService.callFunction<HabitEntry>('updateHabitEntry', {
      habitId,
      date,
      ...updates,
    });
  }

  /**
   * Delete a habit entry
   */
  async deleteHabitEntry(habitId: string, date: string): Promise<void> {
    await apiService.callFunction('deleteHabitEntry', {
      habitId,
      date,
    });
  }

  /**
   * Get habit statistics for a specific habit
   */
  async getHabitStats(habitId: string): Promise<Habit['analytics']> {
    return await apiService.callFunction<Habit['analytics']>('getHabitStats', { habitId });
  }

  /**
   * Recalculate habit summary/analytics
   */
  async recalculateHabitSummary(habitId: string): Promise<void> {
    await apiService.callFunction('recalculateHabitSummary', { habitId });
  }

  /**
   * Get habit completion data for calendar heatmap
   */
  async getHabitHeatmapData(habitId: string, year: number): Promise<Record<string, number>> {
    return await apiService.callFunction<Record<string, number>>('getHabitHeatmapData', {
      habitId,
      year,
    });
  }

  /**
   * Bulk update habit entries (for drag-and-drop operations)
   */
  async bulkUpdateHabitEntries(updates: Array<{
    habitId: string;
    date: string;
    count: number;
    completed: boolean;
  }>): Promise<void> {
    await apiService.callFunction('bulkUpdateHabitEntries', { updates });
  }
}

export const habitService = new HabitService();
