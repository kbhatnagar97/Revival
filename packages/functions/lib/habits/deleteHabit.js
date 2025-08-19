"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHabit = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Delete a habit and all its entries for the authenticated user
 */
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
        firebase_functions_1.logger.info(`Deleting habit: ${habitId} for user: ${userId}`);
        // Verify habit ownership
        const habitRef = firebase_1.db.collection(`users/${userId}/habits`).doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Habit not found');
        }
        // Delete the habit document (onHabitDelete trigger will clean up entries)
        await habitRef.delete();
        firebase_functions_1.logger.info(`Successfully deleted habit: ${habitId} for user: ${userId}`);
        return { success: true, message: 'Habit deleted successfully' };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error deleting habit:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to delete habit');
    }
});
//# sourceMappingURL=deleteHabit.js.map