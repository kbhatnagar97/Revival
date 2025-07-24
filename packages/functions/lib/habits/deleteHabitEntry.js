"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHabitEntry = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.deleteHabitEntry = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { habitId, date } = request.data;
    if (!habitId || !date) {
        throw new https_1.HttpsError('invalid-argument', 'habitId and date are required');
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
        // Find and delete the entry
        const entryQuery = await firebase_1.db
            .collection('habitEntries')
            .where('userId', '==', userId)
            .where('habitId', '==', habitId)
            .where('date', '==', date)
            .limit(1)
            .get();
        if (entryQuery.empty) {
            throw new https_1.HttpsError('not-found', 'Habit entry not found');
        }
        await entryQuery.docs[0].ref.delete();
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting habit entry:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to delete habit entry');
    }
});
//# sourceMappingURL=deleteHabitEntry.js.map