"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldSessions = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Scheduled function to clean up old sessions
 * Runs daily at 3 AM UTC to remove sessions older than 30 days (TTL policy)
 */
exports.cleanupOldSessions = (0, scheduler_1.onSchedule)('0 3 * * *', async () => {
    try {
        firebase_functions_1.logger.info('Starting cleanup of old sessions');
        // Calculate cutoff date (30 days ago)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffTimestamp = firebase_1.Timestamp.fromDate(thirtyDaysAgo);
        // Get all users
        const usersSnapshot = await firebase_1.db.collection('users').get();
        let totalSessionsRemoved = 0;
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            // Get old sessions for this user
            const sessionsRef = firebase_1.db.collection(`users/${userId}/userSessions`);
            const oldSessionsQuery = sessionsRef.where('loginAt', '<', cutoffTimestamp);
            const oldSessionsSnapshot = await oldSessionsQuery.get();
            if (!oldSessionsSnapshot.empty) {
                // Delete old sessions in batch
                const batch = firebase_1.db.batch();
                oldSessionsSnapshot.docs.forEach(sessionDoc => {
                    batch.delete(sessionDoc.ref);
                });
                await batch.commit();
                const removedCount = oldSessionsSnapshot.size;
                totalSessionsRemoved += removedCount;
                firebase_functions_1.logger.info(`Removed ${removedCount} old sessions for user: ${userId}`);
            }
        }
        firebase_functions_1.logger.info(`Session cleanup completed. Total sessions removed: ${totalSessionsRemoved}`);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error during session cleanup:', error);
        throw error;
    }
});
//# sourceMappingURL=cleanupOldSessions.js.map