"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHabitEntriesForHabit = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.getHabitEntriesForHabit = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { habitId, startDate, endDate } = request.data;
    if (!habitId) {
        throw new https_1.HttpsError('invalid-argument', 'habitId is required');
    }
    try {
        // Verify habit ownership
        const habitRef = firebase_1.db.collection('habits').doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Habit not found');
        }
        const habitData = habitDoc.data();
        if ((habitData === null || habitData === void 0 ? void 0 : habitData.userId) !== userId) {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to access this habit');
        }
        // Build query
        let query = firebase_1.db
            .collection('habitEntries')
            .where('userId', '==', userId)
            .where('habitId', '==', habitId);
        if (startDate) {
            query = query.where('date', '>=', startDate);
        }
        if (endDate) {
            query = query.where('date', '<=', endDate);
        }
        query = query.orderBy('date', 'desc');
        const entriesSnapshot = await query.get();
        const entries = entriesSnapshot.docs.map(doc => {
            var _a, _b;
            return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString(), updatedAt: (_b = doc.data().updatedAt) === null || _b === void 0 ? void 0 : _b.toDate().toISOString() }));
        });
        return entries;
    }
    catch (error) {
        console.error('Error getting habit entries:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to get habit entries');
    }
});
//# sourceMappingURL=getHabitEntriesForHabit.js.map