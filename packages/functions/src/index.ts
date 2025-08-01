// Core Cloud Functions as specified in CLOUD_FUNCTIONS_IMPLEMENTATION_PLAN.md

// User Functions
export { onUserCreate } from './users/onUserCreate';

// Habit CRUD Functions (Callable)
export { getUserHabits } from './habits/getUserHabits';
export { createHabit } from './habits/createHabit';
export { updateHabit } from './habits/updateHabit';
export { deleteHabit } from './habits/deleteHabit';
export { reorderHabits } from './habits/reorderHabits';

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

// Migration Functions (Schema Migration)
export { migrateToDailyEntries, cleanupOldHabitEntries } from './migration/migrateToDaily Entries';

// Device Management Functions (Phase 3)
export { registerDevice } from './devices/registerDevice';
export { getUserDevices } from './devices/getUserDevices';
export { cleanupInactiveDevices } from './devices/cleanupInactiveDevices';

// Session Management Functions (Phase 3)
export { createSession } from './sessions/createSession';
export { updateSessionHeartbeat } from './sessions/updateSessionHeartbeat';
export { getUserSessions } from './sessions/getUserSessions';
export { cleanupOldSessions } from './sessions/cleanupOldSessions';

// Enhanced Session Functions
export { createSessionEnhanced, detectUserLocation } from './sessions/createSessionEnhanced';

// Privacy and Consent Functions
export { storeConsentRecord, getConsentHistory, updateConsentPreferences, revokeConsent } from './privacy/consentManager';
