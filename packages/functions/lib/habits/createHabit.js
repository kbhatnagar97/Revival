"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHabit = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Create a new habit for the authenticated user
 */
exports.createHabit = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { name, description, icon, color, goal, frequency, days } = request.data;
    // Validate required fields
    if (!name || !icon || !color || !goal || !frequency) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields: name, icon, color, goal, frequency');
    }
    try {
        firebase_functions_1.logger.info(`Creating habit for user: ${userId}`, { name, goal, frequency });
        // Get current max sort order
        const habitsRef = firebase_1.db.collection(`users/${userId}/habits`);
        const existingHabits = await habitsRef.orderBy('sortOrder', 'desc').limit(1).get();
        const maxSortOrder = existingHabits.empty ? 0 : existingHabits.docs[0].data().sortOrder || 0;
        // Create new habit document
        const habitData = {
            name,
            description: description || '',
            icon,
            color,
            goal,
            frequency,
            days: days || [1, 2, 3, 4, 5, 6, 0], // Default to all days
            isActive: true,
            sortOrder: maxSortOrder + 1,
            createdAt: firebase_1.Timestamp.now(),
            updatedAt: firebase_1.Timestamp.now(),
            // Initialize analytics
            currentStreak: 0,
            longestStreak: 0,
            completionRate: 0,
            totalCompletions: 0,
            averageDaily: 0,
            consistency: 0,
            lastCompletedDate: null,
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