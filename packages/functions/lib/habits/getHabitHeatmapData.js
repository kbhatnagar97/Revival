"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHabitHeatmapData = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.getHabitHeatmapData = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { habitId, year } = request.data;
    if (!habitId || !year) {
        throw new https_1.HttpsError('invalid-argument', 'habitId and year are required');
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
        // Get entries for the specified year
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        const entriesSnapshot = await firebase_1.db
            .collection('habitEntries')
            .where('userId', '==', userId)
            .where('habitId', '==', habitId)
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();
        // Build heatmap data object
        const heatmapData = {};
        entriesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            heatmapData[data.date] = data.count || 0;
        });
        return heatmapData;
    }
    catch (error) {
        console.error('Error getting habit heatmap data:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to get habit heatmap data');
    }
});
//# sourceMappingURL=getHabitHeatmapData.js.map