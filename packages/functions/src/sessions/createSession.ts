import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';
import { UserSession } from '../lib/types';

/**
 * Create a new user session for tracking and security logging
 */
export const createSession = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { 
    deviceId, 
    ipAddress, 
    location 
  } = request.data;

  // Validate required fields
  if (!deviceId) {
    throw new HttpsError('invalid-argument', 'Missing required field: deviceId');
  }

  try {
    logger.info(`Creating session for user: ${userId}, device: ${deviceId}`);

    // Verify device exists
    const deviceRef = db.collection(`users/${userId}/devices`).doc(deviceId);
    const deviceDoc = await deviceRef.get();

    if (!deviceDoc.exists) {
      throw new HttpsError('not-found', 'Device not found. Please register device first.');
    }

    const now = Timestamp.now();
    
    // Generate session ID (deviceId + timestamp for uniqueness)
    const sessionId = `${deviceId}_${now.seconds}`;

    // Create session document
    const sessionData: UserSession = {
      deviceId,
      loginAt: now,
      lastSeenAt: now,
      ipAddress: ipAddress || undefined,
      location: location || undefined,
    };

    const sessionRef = db.collection(`users/${userId}/userSessions`).doc(sessionId);
    await sessionRef.set(sessionData);

    // Update device lastSeenAt
    await deviceRef.update({
      lastSeenAt: now,
    });

    logger.info(`Created session: ${sessionId} for user: ${userId}`);
    return { 
      success: true, 
      message: 'Session created successfully',
      sessionId,
      loginAt: now.toDate().toISOString()
    };
  } catch (error) {
    logger.error('Error creating session:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to create session');
  }
});