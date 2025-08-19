"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleHabitActive = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.toggleHabitActive = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    var _a, _b;
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
            throw new https_1.HttpsError('permission-denied', 'Not authorized to modify this habit');
        }
        const newActiveStatus = !habitData.isActive;
        await habitRef.update({
            isActive: newActiveStatus,
            updatedAt: firebase_1.Timestamp.now(),
        });
        // Get updated habit
        const updatedHabit = await habitRef.get();
        const updatedData = updatedHabit.data();
        return Object.assign(Object.assign({ id: habitId }, updatedData), { createdAt: (_a = updatedData === null || updatedData === void 0 ? void 0 : updatedData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString(), updatedAt: (_b = updatedData === null || updatedData === void 0 ? void 0 : updatedData.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate().toISOString() });
    }
    catch (error) {
        console.error('Error toggling habit active status:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to toggle habit active status');
    }
});
//# sourceMappingURL=toggleHabitActive.js.map