import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Scheduled function to clean up old sessions
 * Runs daily at 3 AM UTC to remove sessions older than 30 days (TTL policy)
 */
export const cleanupOldSessions = onSchedule('0 3 * * *', async () => {
  try {
    logger.info('Starting cleanup of old sessions');

    // Calculate cutoff date (30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffTimestamp = Timestamp.fromDate(thirtyDaysAgo);

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    let totalSessionsRemoved = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Get old sessions for this user
      const sessionsRef = db.collection(`users/${userId}/userSessions`);
      const oldSessionsQuery = sessionsRef.where('loginAt', '<', cutoffTimestamp);
      const oldSessionsSnapshot = await oldSessionsQuery.get();

      if (!oldSessionsSnapshot.empty) {
        // Delete old sessions in batch
        const batch = db.batch();
        
        oldSessionsSnapshot.docs.forEach(sessionDoc => {
          batch.delete(sessionDoc.ref);
        });

        await batch.commit();
        
        const removedCount = oldSessionsSnapshot.size;
        totalSessionsRemoved += removedCount;
        
        logger.info(`Removed ${removedCount} old sessions for user: ${userId}`);
      }
    }

    logger.info(`Session cleanup completed. Total sessions removed: ${totalSessionsRemoved}`);
  } catch (error) {
    logger.error('Error during session cleanup:', error);
    throw error;
  }
});