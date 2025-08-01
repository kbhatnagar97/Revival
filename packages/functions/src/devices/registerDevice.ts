import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';
import { UserDeviceDocument } from '../lib/types';

/**
 * Register or update a user device for tracking and notifications
 */
export const registerDevice = onCall(callableFunctionOptions, async (request) => {
  try {
    logger.info('=== REGISTER DEVICE START ===');
    logger.info('Request auth:', {
      uid: request.auth?.uid,
      hasAuth: !!request.auth
    });
    logger.info('Request data received:', JSON.stringify(request.data, null, 2));

    // Check if user is authenticated
    if (!request.auth) {
      logger.error('Authentication failed: No auth token');
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    logger.info(`Processing request for user: ${userId}`);

    const {
      deviceId,
      type,
      deviceModel,
      fcmToken,
      hardware,
      os,
      capabilities
    } = request.data;

    logger.info('Extracted fields:', {
      deviceId: deviceId || 'MISSING',
      type: type || 'MISSING',
      deviceModel: deviceModel || 'undefined',
      fcmToken: fcmToken ? 'PROVIDED' : 'undefined',
      hardware: hardware ? 'PROVIDED' : 'MISSING',
      os: os ? 'PROVIDED' : 'MISSING',
      capabilities: capabilities ? 'PROVIDED' : 'MISSING'
    });

    // Validate required fields
    if (!deviceId || !type || !hardware || !os || !capabilities) {
      const missingFields = [];
      if (!deviceId) missingFields.push('deviceId');
      if (!type) missingFields.push('type');
      if (!hardware) missingFields.push('hardware');
      if (!os) missingFields.push('os');
      if (!capabilities) missingFields.push('capabilities');
      
      logger.error('Validation failed - missing required fields:', missingFields);
      throw new HttpsError('invalid-argument', `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate device type
    if (!['mobile', 'web', 'desktop'].includes(type)) {
      logger.error('Validation failed - invalid device type:', type);
      throw new HttpsError('invalid-argument', 'Invalid device type. Must be mobile, web, or desktop');
    }

    logger.info('Validation passed, proceeding with device registration');

    const deviceRef = db.collection(`users/${userId}/devices`).doc(deviceId);
    logger.info('Device reference path:', `users/${userId}/devices/${deviceId}`);

    logger.info('Checking if device exists...');
    const existingDevice = await deviceRef.get();
    logger.info('Device exists check result:', { exists: existingDevice.exists });

    const now = Timestamp.now();
    logger.info('Current timestamp:', now.toDate().toISOString());

    if (existingDevice.exists) {
      logger.info('Updating existing device...');
      
      // Update existing device
      const updateData: Partial<UserDeviceDocument> = {
        type,
        hardware,
        os,
        capabilities,
        lastSeenAt: now,
        network: {
          // Network info will be populated server-side from IP
          hostname: undefined,
          isp: undefined
        }
      };

      // Update optional fields if provided (only if they have actual values)
      if (deviceModel !== undefined && deviceModel !== null) {
        updateData.deviceModel = deviceModel;
      }
      if (fcmToken !== undefined && fcmToken !== null) {
        updateData.fcmToken = fcmToken;
      }

      logger.info('Update data prepared:', JSON.stringify(updateData, null, 2));

      await deviceRef.update(updateData);
      
      logger.info(`Successfully updated existing device: ${deviceId} for user: ${userId}`);
      const result = {
        success: true,
        message: 'Device updated successfully',
        deviceId,
        isNew: false
      };
      logger.info('Returning result:', JSON.stringify(result, null, 2));
      return result;
    } else {
      logger.info('Creating new device...');
      
      // Create new device
      const deviceData: UserDeviceDocument = {
        type,
        hardware,
        os,
        capabilities,
        lastSeenAt: now,
        firstRegisteredAt: now,
        network: {
          // Network info will be populated server-side from IP
          hostname: undefined,
          isp: undefined
        }
      };

      // Only add optional fields if they have actual values (not undefined)
      if (deviceModel !== undefined && deviceModel !== null) {
        deviceData.deviceModel = deviceModel;
      }
      if (fcmToken !== undefined && fcmToken !== null) {
        deviceData.fcmToken = fcmToken;
      }

      logger.info('Device data prepared:', JSON.stringify(deviceData, null, 2));

      await deviceRef.set(deviceData);
      
      logger.info(`Successfully registered new device: ${deviceId} for user: ${userId}`);
      const result = {
        success: true,
        message: 'Device registered successfully',
        deviceId,
        isNew: true
      };
      logger.info('Returning result:', JSON.stringify(result, null, 2));
      return result;
    }
  } catch (error: any) {
    logger.error('=== REGISTER DEVICE ERROR ===');
    logger.error('Error type:', error?.constructor?.name);
    logger.error('Error message:', error?.message);
    logger.error('Error stack:', error?.stack);
    logger.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    if (error instanceof HttpsError) {
      logger.error('Re-throwing HttpsError:', { code: error.code, message: error.message });
      throw error;
    }
    
    logger.error('Throwing internal error');
    throw new HttpsError('internal', `Failed to register device: ${error?.message || 'Unknown error'}`);
  } finally {
    logger.info('=== REGISTER DEVICE END ===');
  }
});