"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHabitEntry = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Delete a habit entry for a specific date
 * Now works with the new daily entries collection structure
 */
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
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        throw new https_1.HttpsError('invalid-argument', 'Date must be in YYYY-MM-DD format');
    }
    try {
        firebase_functions_1.logger.info(`Deleting habit entry for habit: ${habitId}, date: ${date}, user: ${userId}`);
        // Verify habit ownership
        const habitRef = firebase_1.db.collection(`users/${userId}/habits`).doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Habit not found');
        }
        // Get the daily entry
        const entryRef = firebase_1.db.collection(`users/${userId}/entries`).doc(date);
        const entryDoc = await entryRef.get();
        if (!entryDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Daily entry not found');
        }
        const dailyEntry = entryDoc.data();
        const habitIndex = dailyEntry.habits.findIndex(h => h.habitId === habitId);
        if (habitIndex === -1) {
            throw new https_1.HttpsError('not-found', 'Habit entry not found for this date');
        }
        // Remove the habit from the habits array
        dailyEntry.habits.splice(habitIndex, 1);
        if (dailyEntry.habits.length === 0) {
            // If no habits remain, delete the entire daily entry
            await entryRef.delete();
            firebase_functions_1.logger.info(`Deleted entire daily entry for date: ${date} (no habits remaining)`);
        }
        else {
            // Update the daily entry with the remaining habits
            await entryRef.update({
                habits: dailyEntry.habits,
                updatedAt: firebase_1.Timestamp.now()
            });
            firebase_functions_1.logger.info(`Removed habit ${habitId} from daily entry for date: ${date}`);
        }
        firebase_functions_1.logger.info(`Successfully deleted habit entry for habit: ${habitId}, date: ${date}`);
        return { success: true, message: 'Habit entry deleted successfully' };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error deleting habit entry:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to delete habit entry');
    }
});
//# sourceMappingURL=deleteHabitEntry.js.map