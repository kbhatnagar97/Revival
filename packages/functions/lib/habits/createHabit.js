"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHabit = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.createHabit = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { name, description, icon, color, goal, frequency, days } = request.data;
    // Validate required fields
    if (!name || !icon || !color || !goal || !frequency) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        // Get all habits to determine the next sort order
        const habitsSnapshot = await firebase_1.db
            .collection('habits')
            .where('userId', '==', userId)
            .get();
        // Find the highest sort order
        let maxSortOrder = -1;
        habitsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.sortOrder > maxSortOrder) {
                maxSortOrder = data.sortOrder;
            }
        });
        const nextSortOrder = maxSortOrder + 1;
        // Create habit document
        const habitData = {
            userId,
            name,
            description: description || '',
            icon,
            color,
            goal,
            frequency,
            days: days || [0, 1, 2, 3, 4, 5, 6], // Default to all days
            isActive: true,
            sortOrder: nextSortOrder,
            createdAt: firebase_1.Timestamp.now(),
            updatedAt: firebase_1.Timestamp.now(),
            analytics: {
                currentStreak: 0,
                longestStreak: 0,
                completionRate: 0,
                totalCompletions: 0,
                averageDaily: 0,
                consistency: 0,
            },
        };
        const habitRef = await firebase_1.db.collection('habits').add(habitData);
        return Object.assign(Object.assign({ id: habitRef.id }, habitData), { createdAt: habitData.createdAt.toDate().toISOString(), updatedAt: habitData.updatedAt.toDate().toISOString() });
    }
    catch (error) {
        console.error('Error creating habit:', error);
        throw new https_1.HttpsError('internal', 'Failed to create habit');
    }
});
//# sourceMappingURL=createHabit.js.map