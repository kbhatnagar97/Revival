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
    logger.info(`[createSession] Starting session creation for user: ${userId}, device: ${deviceId}`);
    logger.info(`[createSession] Request data:`, JSON.stringify({ deviceId, ipAddress, location }));

    // Verify device exists
    const deviceRef = db.collection(`users/${userId}/devices`).doc(deviceId);
    const deviceDoc = await deviceRef.get();

    if (!deviceDoc.exists) {
      logger.error(`[createSession] Device not found: ${deviceId} for user: ${userId}`);
      throw new HttpsError('not-found', 'Device not found. Please register device first.');
    }

    logger.info(`[createSession] Device verified successfully: ${deviceId}`);

    const now = Timestamp.now();
    
    // Generate session ID (deviceId + timestamp for uniqueness)
    const sessionId = `${deviceId}_${now.seconds}`;
    logger.info(`[createSession] Generated session ID: ${sessionId}`);

    // Create session document with only defined fields
    const sessionData: Partial<UserSession> = {
      deviceId,
      loginAt: now,
      lastSeenAt: now,
    };

    // Only add optional fields if they have actual values (not undefined/null)
    if (ipAddress !== undefined && ipAddress !== null && ipAddress !== '') {
      sessionData.ipAddress = ipAddress;
    }
    if (location !== undefined && location !== null && location !== '') {
      sessionData.location = location;
    }

    logger.info(`[createSession] Session data to save:`, JSON.stringify(sessionData, null, 2));

    const sessionRef = db.collection(`users/${userId}/userSessions`).doc(sessionId);
    await sessionRef.set(sessionData as UserSession);

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