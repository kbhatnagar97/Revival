import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Get all registered devices for the authenticated user
 */
export const getUserDevices = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    logger.info(`Getting devices for user: ${userId}`);

    // Get all devices for the user
    const devicesRef = db.collection(`users/${userId}/devices`);
    const devicesSnapshot = await devicesRef.orderBy('lastSeenAt', 'desc').get();

    const devices = devicesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert timestamps for frontend compatibility
        lastSeenAt: data.lastSeenAt?.toDate().toISOString(),
        firstRegisteredAt: data.firstRegisteredAt?.toDate().toISOString(),
      };
    });

    logger.info(`Retrieved ${devices.length} devices for user: ${userId}`);
    return devices;
  } catch (error) {
    logger.error('Error getting user devices:', error);
    throw new HttpsError('internal', 'Failed to get user devices');
  }
});