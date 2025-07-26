"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHabitEntry = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Update or create a habit entry for a specific date
 * This will trigger onHabitEntryWrite for streak calculation
 */
exports.updateHabitEntry = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    var _a;
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { habitId, date, count, completed, notes } = request.data;
    if (!habitId || !date) {
        throw new https_1.HttpsError('invalid-argument', 'habitId and date are required');
    }
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        throw new https_1.HttpsError('invalid-argument', 'Date must be in YYYY-MM-DD format');
    }
    try {
        firebase_functions_1.logger.info(`Updating habit entry for habit: ${habitId}, date: ${date}, user: ${userId}`, {
            count,
            completed,
            notes: notes ? 'provided' : 'not provided'
        });
        // Verify habit ownership
        const habitRef = firebase_1.db.collection(`users/${userId}/habits`).doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Habit not found');
        }
        const habitData = habitDoc.data();
        if (!habitData) {
            throw new https_1.HttpsError('not-found', 'Habit data not found');
        }
        // Get or create the entry
        const entryRef = firebase_1.db.collection(`users/${userId}/habits/${habitId}/entries`).doc(date);
        const entryDoc = await entryRef.get();
        const now = firebase_1.Timestamp.now();
        let entryData;
        if (entryDoc.exists) {
            // Update existing entry
            const updates = {
                updatedAt: now,
            };
            if (count !== undefined)
                updates.count = count;
            if (completed !== undefined)
                updates.completed = completed;
            if (notes !== undefined)
                updates.notes = notes;
            // Determine completion status
            const finalCount = count !== undefined ? count : ((_a = entryDoc.data()) === null || _a === void 0 ? void 0 : _a.count) || 0;
            updates.completed = finalCount >= habitData.goal;
            await entryRef.update(updates);
            // Get updated entry
            const updatedDoc = await entryRef.get();
            entryData = updatedDoc.data();
        }
        else {
            // Create new entry
            const finalCount = count || 0;
            entryData = {
                count: finalCount,
                completed: finalCount >= habitData.goal,
                notes: notes || '',
                goalAtTime: habitData.goal, // Store goal at time of entry
                createdAt: now,
                updatedAt: now,
            };
            await entryRef.set(entryData);
        }
        if (!entryData) {
            throw new https_1.HttpsError('internal', 'Failed to create/update entry data');
        }
        const result = Object.assign(Object.assign({ id: date, habitId,
            date }, entryData), { createdAt: entryData.createdAt.toDate().toISOString(), updatedAt: entryData.updatedAt.toDate().toISOString() });
        firebase_functions_1.logger.info(`Successfully updated habit entry for habit: ${habitId}, date: ${date}`);
        return result;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error updating habit entry:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to update habit entry');
    }
});
//# sourceMappingURL=updateHabitEntry.js.map