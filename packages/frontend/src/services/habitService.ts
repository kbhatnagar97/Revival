import { apiService } from './apiService';

// Updated interfaces based on the Cloud Functions schema
export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  goal: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  days: number[]; // Days of week for weekly habits (0-6, Sunday=0)
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  analytics: {
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    totalCompletions: number;
    averageDaily: number;
    consistency: number;
    lastCompletedDate?: string;
  };
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD format
  count: number;
  completed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  icon: string;
  color: string;
  goal: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  days?: number[];
}

export interface UpdateHabitRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  goal?: number;
  frequency?: 'daily' | 'weekly' | 'monthly';
  days?: number[];
  isActive?: boolean;
}

export interface UpdateHabitEntryRequest {
  count?: number;
  completed?: boolean;
  notes?: string;
}

class HabitService {
  /**
   * Get all habits for the current user
   */
  async getUserHabits(): Promise<Habit[]> {
    return await apiService.callFunction<Habit[]>('getUserHabits');
  }

  /**
   * Create a new habit
   */
  async createHabit(habitData: CreateHabitRequest): Promise<Habit> {
    return await apiService.callFunction<Habit>('createHabit', habitData);
  }

  /**
   * Update an existing habit
   */
  async updateHabit(habitId: string, updates: UpdateHabitRequest): Promise<Habit> {
    return await apiService.callFunction<Habit>('updateHabit', {
      habitId,
      ...updates,
    });
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
    return await apiService.callFunction<Habit>('toggleHabitActive', { habitId });
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
