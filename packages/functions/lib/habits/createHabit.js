"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHabit = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
// Helper function to convert days array to scheduledDays object
function convertDaysToScheduledDays(days) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const defaultDays = [1, 2, 3, 4, 5, 6, 0]; // Default to all days
    const daysToUse = days || defaultDays;
    const scheduledDays = {};
    dayNames.forEach((dayName, index) => {
        scheduledDays[dayName] = daysToUse.includes(index);
    });
    return scheduledDays;
}
/**
 * Create a new habit for the authenticated user
 */
exports.createHabit = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { name, icon, color, goal, days } = request.data;
    // Validate required fields
    if (!name || !icon || !color || !goal) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields: name, icon, color, goal');
    }
    try {
        firebase_functions_1.logger.info(`Creating habit for user: ${userId}`, { name, goal });
        // Get current max sort order
        const habitsRef = firebase_1.db.collection(`users/${userId}/habits`);
        const existingHabits = await habitsRef.orderBy('sortOrder', 'desc').limit(1).get();
        const maxSortOrder = existingHabits.empty ? 0 : existingHabits.docs[0].data().sortOrder || 0;
        // Create new habit document
        const habitData = {
            name,
            icon,
            color,
            goal,
            scheduledDays: convertDaysToScheduledDays(days),
            status: 'active',
            reminder: null,
            analytics: {
                totalDebt: 0,
                totalSurplus: 0,
                currentStreak: 0,
                bestStreak: 0,
                totalCompletions: 0,
                allTimeConsistency: 0,
            },
            createdAt: firebase_1.Timestamp.now(),
            updatedAt: firebase_1.Timestamp.now(),
            order: maxSortOrder + 1,
        };
        const docRef = await habitsRef.add(habitData);
        const createdHabit = Object.assign(Object.assign({ id: docRef.id }, habitData), { createdAt: habitData.createdAt.toDate().toISOString(), updatedAt: habitData.updatedAt.toDate().toISOString() });
        firebase_functions_1.logger.info(`Successfully created habit: ${docRef.id} for user: ${userId}`);
        return createdHabit;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error creating habit:', error);
        throw new https_1.HttpsError('internal', 'Failed to create habit');
    }
});
//# sourceMappingURL=createHabit.js.map