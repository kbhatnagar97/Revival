"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateHabitSummary = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.recalculateHabitSummary = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
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
        // For now, this is a placeholder that just returns success
        // The actual recalculation logic would be implemented here
        // or we could call the existing recalculateSummary function
        return { success: true };
    }
    catch (error) {
        console.error('Error recalculating habit summary:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to recalculate habit summary');
    }
});
//# sourceMappingURL=recalculateHabitSummary.js.map