// Core Cloud Functions as specified in CLOUD_FUNCTIONS_IMPLEMENTATION_PLAN.md

// User Functions
export { onUserCreate } from './users/onUserCreate';

// Habit CRUD Functions (Callable)
export { getUserHabits } from './habits/getUserHabits';
export { createHabit } from './habits/createHabit';
export { updateHabit } from './habits/updateHabit';
export { deleteHabit } from './habits/deleteHabit';

// Habit Entry CRUD Functions (Callable)
export { getHabitEntries } from './habits/getHabitEntries';
export { getHabitEntriesForHabit } from './habits/getHabitEntriesForHabit';
export { updateHabitEntry } from './habits/updateHabitEntry';
export { deleteHabitEntry } from './habits/deleteHabitEntry';

// Habit Trigger Functions (Firestore Triggers)
export { onHabitUpdate } from './habits/onHabitUpdate';
export { onHabitDelete } from './habits/onHabitDelete';
export { onHabitEntryWrite } from './habits/onHabitEntryWrite';
export { recalculateSummary } from './habits/recalculateSummary';
