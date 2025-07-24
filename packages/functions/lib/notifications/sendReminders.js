"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReminders = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_functions_1 = require("firebase-functions");
const firebase_1 = require("../lib/firebase");
/**
 * Scheduled function to send daily habit reminders
 * Runs every day at 9 AM in each user's timezone
 */
exports.sendReminders = (0, scheduler_1.onSchedule)('0 9 * * *', async () => {
    try {
        firebase_functions_1.logger.info('Starting daily reminder process');
        // Get all active users
        const usersSnapshot = await firebase_1.db.collection('users').get();
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            // Get user's active habits
            const habitsSnapshot = await firebase_1.db
                .collection(`users/${userId}/habits`)
                .where('isActive', '==', true)
                .get();
            const habits = habitsSnapshot.docs.map(doc => doc.data());
            if (habits.length === 0) {
                continue;
            }
            // TODO: Implement actual notification sending
            // This would integrate with Firebase Cloud Messaging (FCM)
            // or email service to send reminders to users
            firebase_functions_1.logger.info(`Would send reminders to user ${userId} for ${habits.length} habits`);
        }
        firebase_functions_1.logger.info('Completed daily reminder process');
    }
    catch (error) {
        firebase_functions_1.logger.error('Error sending reminders:', error);
        throw error;
    }
});
//# sourceMappingURL=sendReminders.js.map