"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderHabits = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Reorder habits by updating their order field
 * Used for drag-and-drop functionality in the frontend
 */
exports.reorderHabits = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { habitIds } = request.data;
    if (!habitIds || !Array.isArray(habitIds) || habitIds.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'habitIds must be a non-empty array');
    }
    try {
        firebase_functions_1.logger.info(`Reordering habits for user: ${userId}`, {
            habitIds,
            count: habitIds.length
        });
        // Use a batch to update all habits atomically
        const batch = firebase_1.db.batch();
        const now = firebase_1.Timestamp.now();
        // Update each habit with its new order
        habitIds.forEach((habitId, index) => {
            if (typeof habitId !== 'string' || habitId.trim() === '') {
                throw new https_1.HttpsError('invalid-argument', `Invalid habitId at index ${index}: ${habitId}`);
            }
            const habitRef = firebase_1.db.collection(`users/${userId}/habits`).doc(habitId);
            batch.update(habitRef, {
                order: index,
                updatedAt: now
            });
        });
        // Commit the batch
        await batch.commit();
        firebase_functions_1.logger.info(`Successfully reordered ${habitIds.length} habits for user: ${userId}`);
        return {
            success: true,
            message: `Successfully reordered ${habitIds.length} habits`,
            habitIds,
            updatedAt: now.toDate().toISOString()
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error reordering habits:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to reorder habits');
    }
});
//# sourceMappingURL=reorderHabits.js.map