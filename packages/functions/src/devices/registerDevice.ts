import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';
import { UserDeviceDocument } from '../lib/types';

/**
 * Register or update a user device for tracking and notifications
 */
export const registerDevice = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { 
    deviceId, 
    type, 
    deviceModel, 
    osName, 
    osVersion, 
    fcmToken 
  } = request.data;

  // Validate required fields
  if (!deviceId || !type || !osName || !osVersion) {
    throw new HttpsError('invalid-argument', 'Missing required fields: deviceId, type, osName, osVersion');
  }

  // Validate device type
  if (!['mobile', 'web', 'desktop'].includes(type)) {
    throw new HttpsError('invalid-argument', 'Invalid device type. Must be mobile, web, or desktop');
  }

  try {
    logger.info(`Registering device for user: ${userId}`, { deviceId, type, osName });

    const deviceRef = db.collection(`users/${userId}/devices`).doc(deviceId);
    const existingDevice = await deviceRef.get();

    const now = Timestamp.now();

    if (existingDevice.exists) {
      // Update existing device
      const updateData: Partial<UserDeviceDocument> = {
        type,
        osName,
        osVersion,
        lastSeenAt: now,
      };

      // Update optional fields if provided
      if (deviceModel !== undefined) updateData.deviceModel = deviceModel;
      if (fcmToken !== undefined) updateData.fcmToken = fcmToken;

      await deviceRef.update(updateData);
      
      logger.info(`Updated existing device: ${deviceId} for user: ${userId}`);
      return { 
        success: true, 
        message: 'Device updated successfully',
        deviceId,
        isNew: false
      };
    } else {
      // Create new device
      const deviceData: UserDeviceDocument = {
        type,
        deviceModel: deviceModel || undefined,
        osName,
        osVersion,
        fcmToken: fcmToken || undefined,
        lastSeenAt: now,
        firstRegisteredAt: now,
      };

      await deviceRef.set(deviceData);
      
      logger.info(`Registered new device: ${deviceId} for user: ${userId}`);
      return { 
        success: true, 
        message: 'Device registered successfully',
        deviceId,
        isNew: true
      };
    }
  } catch (error) {
    logger.error('Error registering device:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to register device');
  }
});