import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Get all active sessions for the authenticated user
 */
export const getUserSessions = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    logger.info(`Getting sessions for user: ${userId}`);

    // Get all sessions for the user
    const sessionsRef = db.collection(`users/${userId}/userSessions`);
    const sessionsSnapshot = await sessionsRef.orderBy('loginAt', 'desc').get();

    const sessions = sessionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert timestamps for frontend compatibility
        loginAt: data.loginAt?.toDate().toISOString(),
        lastSeenAt: data.lastSeenAt?.toDate().toISOString(),
      };
    });

    logger.info(`Retrieved ${sessions.length} sessions for user: ${userId}`);
    return sessions;
  } catch (error) {
    logger.error('Error getting user sessions:', error);
    throw new HttpsError('internal', 'Failed to get user sessions');
  }
});