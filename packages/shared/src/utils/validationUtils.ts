import type { CreateHabitRequest } from '../types/habit';
import type { UpdateEntryRequest } from '../types/dailyEntry';

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
