 import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Update session heartbeat to track user activity
 * Should be called every 5 minutes while user is active
 */
export const updateSessionHeartbeat = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { sessionId, deviceId, orientation } = request.data;

  // Validate required fields
  if (!sessionId || !deviceId) {
    throw new HttpsError('invalid-argument', 'Missing required fields: sessionId, deviceId');
  }

  try {
    logger.info(`Updating heartbeat for session: ${sessionId}, user: ${userId}, deviceId: ${deviceId}, orientation: ${orientation}`);

    const now = Timestamp.now();

    // Update session lastSeenAt
    const sessionRef = db.collection(`users/${userId}/userSessions`).doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      logger.error(`Session not found: ${sessionId} for user: ${userId}`);
      throw new HttpsError('not-found', 'Session not found');
    }

    logger.info(`Session found, updating heartbeat data`);

    // Prepare update data
    const updateData: any = {
      lastSeenAt: now,
    };

    // Update orientation if provided
    if (orientation) {
      updateData.orientation = orientation;
    }

    await sessionRef.update(updateData);

    // Also update device lastSeenAt (if device exists)
    try {
      const deviceRef = db.collection(`users/${userId}/devices`).doc(deviceId);
      const deviceDoc = await deviceRef.get();
      
      if (deviceDoc.exists) {
        await deviceRef.update({
          lastSeenAt: now,
        });
        logger.info(`Updated device lastSeenAt for device: ${deviceId}`);
      } else {
        logger.warn(`Device not found for heartbeat update: ${deviceId}`);
      }
    } catch (deviceError) {
      logger.error(`Error updating device lastSeenAt: ${deviceError}`);
      // Don't fail the entire heartbeat if device update fails
    }

    logger.info(`Updated heartbeat for session: ${sessionId}`);
    return { 
      success: true, 
      message: 'Heartbeat updated successfully',
      lastSeenAt: now.toDate().toISOString()
    };
  } catch (error) {
    logger.error('Error updating session heartbeat:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to update session heartbeat');
  }
});