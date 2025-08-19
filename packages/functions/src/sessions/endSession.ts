import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * End a session by setting sessionEnd timestamp and marking as inactive
 * Should be called when user closes the app or logs out
 */
export const endSession = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { sessionId } = request.data;

  // Validate required fields
  if (!sessionId) {
    throw new HttpsError('invalid-argument', 'Missing required field: sessionId');
  }

  try {
    logger.info(`Ending session: ${sessionId} for user: ${userId}`);

    const now = Timestamp.now();

    // Update session with end time and mark as inactive
    const sessionRef = db.collection(`users/${userId}/userSessions`).doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      logger.error(`Session not found: ${sessionId} for user: ${userId}`);
      throw new HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionDoc.data();
    
    // Only end the session if it's still active
    if (sessionData?.isActive !== false && !sessionData?.sessionEnd) {
      await sessionRef.update({
        sessionEnd: now,
        isActive: false,
        lastSeenAt: now, // Update last seen to the end time
      });

      logger.info(`Session ${sessionId} ended successfully for user ${userId}`);
      
      return {
        success: true,
        message: 'Session ended successfully',
        sessionEnd: now.toDate().toISOString()
      };
    } else {
      logger.info(`Session ${sessionId} was already ended for user ${userId}`);
      
      return {
        success: true,
        message: 'Session was already ended',
        sessionEnd: sessionData?.sessionEnd?.toDate().toISOString() || null
      };
    }

  } catch (error) {
    logger.error('Error ending session:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to end session');
  }
});