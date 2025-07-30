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
  const { sessionId, deviceId } = request.data;

  // Validate required fields
  if (!sessionId || !deviceId) {
    throw new HttpsError('invalid-argument', 'Missing required fields: sessionId, deviceId');
  }

  try {
    logger.info(`Updating heartbeat for session: ${sessionId}, user: ${userId}`);

    const now = Timestamp.now();

    // Update session lastSeenAt
    const sessionRef = db.collection(`users/${userId}/userSessions`).doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new HttpsError('not-found', 'Session not found');
    }

    await sessionRef.update({
      lastSeenAt: now,
    });

    // Also update device lastSeenAt
    const deviceRef = db.collection(`users/${userId}/devices`).doc(deviceId);
    await deviceRef.update({
      lastSeenAt: now,
    });

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