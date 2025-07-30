"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupInactiveDevices = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Scheduled function to clean up inactive devices
 * Runs daily at 2 AM UTC to remove devices that haven't been seen in 30 days
 */
exports.cleanupInactiveDevices = (0, scheduler_1.onSchedule)('0 2 * * *', async () => {
    try {
        firebase_functions_1.logger.info('Starting cleanup of inactive devices');
        // Calculate cutoff date (30 days ago)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffTimestamp = firebase_1.Timestamp.fromDate(thirtyDaysAgo);
        // Get all users
        const usersSnapshot = await firebase_1.db.collection('users').get();
        let totalDevicesRemoved = 0;
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            // Get inactive devices for this user
            const devicesRef = firebase_1.db.collection(`users/${userId}/devices`);
            const inactiveDevicesQuery = devicesRef.where('lastSeenAt', '<', cutoffTimestamp);
            const inactiveDevicesSnapshot = await inactiveDevicesQuery.get();
            if (!inactiveDevicesSnapshot.empty) {
                // Delete inactive devices in batch
                const batch = firebase_1.db.batch();
                inactiveDevicesSnapshot.docs.forEach(deviceDoc => {
                    batch.delete(deviceDoc.ref);
                });
                await batch.commit();
                const removedCount = inactiveDevicesSnapshot.size;
                totalDevicesRemoved += removedCount;
                firebase_functions_1.logger.info(`Removed ${removedCount} inactive devices for user: ${userId}`);
            }
        }
        firebase_functions_1.logger.info(`Cleanup completed. Total devices removed: ${totalDevicesRemoved}`);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error during device cleanup:', error);
        throw error;
    }
});
//# sourceMappingURL=cleanupInactiveDevices.js.map