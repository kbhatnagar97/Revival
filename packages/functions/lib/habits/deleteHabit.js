"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHabit = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.deleteHabit = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { habitId } = request.data;
    if (!habitId) {
        throw new https_1.HttpsError('invalid-argument', 'habitId is required');
    }
    try {
        const habitRef = firebase_1.db.collection('habits').doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Habit not found');
        }
        const habitData = habitDoc.data();
        if ((habitData === null || habitData === void 0 ? void 0 : habitData.userId) !== userId) {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to delete this habit');
        }
        // Delete all habit entries first
        const entriesSnapshot = await firebase_1.db
            .collection('habitEntries')
            .where('userId', '==', userId)
            .where('habitId', '==', habitId)
            .get();
        // Batch delete entries
        const batch = firebase_1.db.batch();
        entriesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        // Delete the habit
        batch.delete(habitRef);
        await batch.commit();
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting habit:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to delete habit');
    }
});
//# sourceMappingURL=deleteHabit.js.map