"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onHabitEntryWrite = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const firebase_1 = require("../lib/firebase");
const config_1 = require("../lib/config");
/**
 * Triggered when a daily entry is created/updated
 * Now processes changes to the daily entries collection
 * Recalculates streaks for all affected habits
 */
exports.onHabitEntryWrite = (0, firestore_1.onDocumentWritten)(Object.assign(Object.assign({}, config_1.firestoreTriggerOptions), { document: 'users/{userId}/entries/{date}' }), async (event) => {
    var _a, _b, _c, _d;
    const { userId, date } = event.params;
    try {
        firebase_functions_1.logger.info(`Processing daily entry update for user: ${userId}, date: ${date}`);
        const beforeData = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.data();
        const afterData = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after) === null || _d === void 0 ? void 0 : _d.data();
        if (!afterData && !beforeData) {
            firebase_functions_1.logger.warn('No entry data found in event');
            return;
        }
        // Determine which habits were affected by comparing before and after
        const affectedHabits = new Set();
        // Add habits from before data (for deletions or updates)
        if (beforeData === null || beforeData === void 0 ? void 0 : beforeData.habits) {
            beforeData.habits.forEach(habit => affectedHabits.add(habit.habitId));
        }
        // Add habits from after data (for creations or updates)
        if (afterData === null || afterData === void 0 ? void 0 : afterData.habits) {
            afterData.habits.forEach(habit => affectedHabits.add(habit.habitId));
        }
        firebase_functions_1.logger.info(`Processing ${affectedHabits.size} affected habits: ${Array.from(affectedHabits).join(', ')}`);
        // Process each affected habit
        for (const habitId of affectedHabits) {
            await processHabitStreakUpdate(userId, habitId, date, beforeData, afterData);
        }
        firebase_functions_1.logger.info(`Successfully processed daily entry update for ${affectedHabits.size} habits`);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error processing daily entry update:', error);
        throw error;
    }
});
/**
 * Process streak updates for a specific habit
 */
async function processHabitStreakUpdate(userId, habitId, date, beforeData, afterData) {
    var _a, _b;
    try {
        // Get habit document to access current analytics and goal
        const habitRef = firebase_1.db.collection(`users/${userId}/habits`).doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            firebase_functions_1.logger.warn(`Habit not found: ${habitId}`);
            return;
        }
        const habitData = habitDoc.data();
        if (!habitData) {
            firebase_functions_1.logger.warn(`No habit data found for: ${habitId}`);
            return;
        }
        // Find habit entry data in before and after states
        const beforeHabitEntry = (_a = beforeData === null || beforeData === void 0 ? void 0 : beforeData.habits) === null || _a === void 0 ? void 0 : _a.find(h => h.habitId === habitId);
        const afterHabitEntry = (_b = afterData === null || afterData === void 0 ? void 0 : afterData.habits) === null || _b === void 0 ? void 0 : _b.find(h => h.habitId === habitId);
        // Determine completion status changes
        const wasCompletedBefore = beforeHabitEntry ? beforeHabitEntry.count >= beforeHabitEntry.goalAtTime : false;
        const isCompletedNow = afterHabitEntry ? afterHabitEntry.count >= afterHabitEntry.goalAtTime : false;
        // Only update if completion status changed
        if (wasCompletedBefore === isCompletedNow) {
            firebase_functions_1.logger.info(`No completion status change for habit ${habitId} on ${date}, skipping streak update`);
            return;
        }
        // Get current analytics or initialize if missing
        const currentAnalytics = habitData.analytics || {
            totalDebt: 0,
            totalSurplus: 0,
            currentStreak: 0,
            bestStreak: 0,
            totalCompletions: 0,
            allTimeConsistency: 0
        };
        let newCurrentStreak = currentAnalytics.currentStreak;
        let newBestStreak = currentAnalytics.bestStreak;
        let newTotalCompletions = currentAnalytics.totalCompletions;
        let newTotalDebt = currentAnalytics.totalDebt;
        let newTotalSurplus = currentAnalytics.totalSurplus;
        if (isCompletedNow && !wasCompletedBefore) {
            // Habit was completed (new completion)
            newCurrentStreak += 1;
            newTotalCompletions += 1;
            // Check for surplus (count > goal)
            if (afterHabitEntry && afterHabitEntry.count > afterHabitEntry.goalAtTime) {
                newTotalSurplus += (afterHabitEntry.count - afterHabitEntry.goalAtTime);
            }
            // Update best streak if current is better
            if (newCurrentStreak > newBestStreak) {
                newBestStreak = newCurrentStreak;
            }
        }
        else if (!isCompletedNow && wasCompletedBefore) {
            // Habit completion was removed
            newCurrentStreak = Math.max(0, newCurrentStreak - 1);
            newTotalCompletions = Math.max(0, newTotalCompletions - 1);
            // Add to debt if this was a missed completion
            newTotalDebt += 1;
        }
        // Calculate all-time consistency (total completions / total scheduled days)
        // For now, use a simple approximation - in production, you'd calculate actual scheduled days
        const totalScheduledDays = Math.max(1, newTotalCompletions + newTotalDebt);
        const newAllTimeConsistency = (newTotalCompletions / totalScheduledDays) * 100;
        // Update habit document with new nested analytics
        await habitRef.update({
            'analytics.currentStreak': newCurrentStreak,
            'analytics.bestStreak': newBestStreak,
            'analytics.totalCompletions': newTotalCompletions,
            'analytics.totalDebt': newTotalDebt,
            'analytics.totalSurplus': newTotalSurplus,
            'analytics.allTimeConsistency': newAllTimeConsistency,
            updatedAt: firebase_1.Timestamp.now()
        });
        firebase_functions_1.logger.info(`Updated habit ${habitId} analytics: streak=${newCurrentStreak}, total=${newTotalCompletions}, completed=${isCompletedNow}`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error processing streak update for habit ${habitId}:`, error);
        throw error;
    }
}
//# sourceMappingURL=onHabitEntryWrite.js.map