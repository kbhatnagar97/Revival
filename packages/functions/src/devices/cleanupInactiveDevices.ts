import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Scheduled function to clean up inactive devices
 * Runs daily at 2 AM UTC to remove devices that haven't been seen in 30 days
 */
export const cleanupInactiveDevices = onSchedule('0 2 * * *', async () => {
  try {
    logger.info('Starting cleanup of inactive devices');

    // Calculate cutoff date (30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffTimestamp = Timestamp.fromDate(thirtyDaysAgo);

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    let totalDevicesRemoved = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Get inactive devices for this user
      const devicesRef = db.collection(`users/${userId}/devices`);
      const inactiveDevicesQuery = devicesRef.where('lastSeenAt', '<', cutoffTimestamp);
      const inactiveDevicesSnapshot = await inactiveDevicesQuery.get();

      if (!inactiveDevicesSnapshot.empty) {
        // Delete inactive devices in batch
        const batch = db.batch();
        
        inactiveDevicesSnapshot.docs.forEach(deviceDoc => {
          batch.delete(deviceDoc.ref);
        });

        await batch.commit();
        
        const removedCount = inactiveDevicesSnapshot.size;
        totalDevicesRemoved += removedCount;
        
        logger.info(`Removed ${removedCount} inactive devices for user: ${userId}`);
      }
    }

    logger.info(`Cleanup completed. Total devices removed: ${totalDevicesRemoved}`);
  } catch (error) {
    logger.error('Error during device cleanup:', error);
    throw error;
  }
});