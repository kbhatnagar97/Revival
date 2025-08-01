"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDevice = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Register or update a user device for tracking and notifications
 */
exports.registerDevice = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    var _a, _b;
    try {
        firebase_functions_1.logger.info('=== REGISTER DEVICE START ===');
        firebase_functions_1.logger.info('Request auth:', {
            uid: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid,
            hasAuth: !!request.auth
        });
        firebase_functions_1.logger.info('Request data received:', JSON.stringify(request.data, null, 2));
        // Check if user is authenticated
        if (!request.auth) {
            firebase_functions_1.logger.error('Authentication failed: No auth token');
            throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const userId = request.auth.uid;
        firebase_functions_1.logger.info(`Processing request for user: ${userId}`);
        const { deviceId, type, deviceModel, osName, osVersion, fcmToken } = request.data;
        firebase_functions_1.logger.info('Extracted fields:', {
            deviceId: deviceId || 'MISSING',
            type: type || 'MISSING',
            deviceModel: deviceModel || 'undefined',
            osName: osName || 'MISSING',
            osVersion: osVersion || 'MISSING',
            fcmToken: fcmToken ? 'PROVIDED' : 'undefined'
        });
        // Validate required fields
        if (!deviceId || !type || !osName || !osVersion) {
            const missingFields = [];
            if (!deviceId)
                missingFields.push('deviceId');
            if (!type)
                missingFields.push('type');
            if (!osName)
                missingFields.push('osName');
            if (!osVersion)
                missingFields.push('osVersion');
            firebase_functions_1.logger.error('Validation failed - missing required fields:', missingFields);
            throw new https_1.HttpsError('invalid-argument', `Missing required fields: ${missingFields.join(', ')}`);
        }
        // Validate device type
        if (!['mobile', 'web', 'desktop'].includes(type)) {
            firebase_functions_1.logger.error('Validation failed - invalid device type:', type);
            throw new https_1.HttpsError('invalid-argument', 'Invalid device type. Must be mobile, web, or desktop');
        }
        firebase_functions_1.logger.info('Validation passed, proceeding with device registration');
        const deviceRef = firebase_1.db.collection(`users/${userId}/devices`).doc(deviceId);
        firebase_functions_1.logger.info('Device reference path:', `users/${userId}/devices/${deviceId}`);
        firebase_functions_1.logger.info('Checking if device exists...');
        const existingDevice = await deviceRef.get();
        firebase_functions_1.logger.info('Device exists check result:', { exists: existingDevice.exists });
        const now = firebase_1.Timestamp.now();
        firebase_functions_1.logger.info('Current timestamp:', now.toDate().toISOString());
        if (existingDevice.exists) {
            firebase_functions_1.logger.info('Updating existing device...');
            // Update existing device
            const updateData = {
                type,
                osName,
                osVersion,
                lastSeenAt: now,
            };
            // Update optional fields if provided (only if they have actual values)
            if (deviceModel !== undefined && deviceModel !== null) {
                updateData.deviceModel = deviceModel;
            }
            if (fcmToken !== undefined && fcmToken !== null) {
                updateData.fcmToken = fcmToken;
            }
            firebase_functions_1.logger.info('Update data prepared:', JSON.stringify(updateData, null, 2));
            await deviceRef.update(updateData);
            firebase_functions_1.logger.info(`Successfully updated existing device: ${deviceId} for user: ${userId}`);
            const result = {
                success: true,
                message: 'Device updated successfully',
                deviceId,
                isNew: false
            };
            firebase_functions_1.logger.info('Returning result:', JSON.stringify(result, null, 2));
            return result;
        }
        else {
            firebase_functions_1.logger.info('Creating new device...');
            // Create new device
            const deviceData = {
                type,
                osName,
                osVersion,
                lastSeenAt: now,
                firstRegisteredAt: now,
            };
            // Only add optional fields if they have actual values (not undefined)
            if (deviceModel !== undefined && deviceModel !== null) {
                deviceData.deviceModel = deviceModel;
            }
            if (fcmToken !== undefined && fcmToken !== null) {
                deviceData.fcmToken = fcmToken;
            }
            firebase_functions_1.logger.info('Device data prepared:', JSON.stringify(deviceData, null, 2));
            await deviceRef.set(deviceData);
            firebase_functions_1.logger.info(`Successfully registered new device: ${deviceId} for user: ${userId}`);
            const result = {
                success: true,
                message: 'Device registered successfully',
                deviceId,
                isNew: true
            };
            firebase_functions_1.logger.info('Returning result:', JSON.stringify(result, null, 2));
            return result;
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('=== REGISTER DEVICE ERROR ===');
        firebase_functions_1.logger.error('Error type:', (_b = error === null || error === void 0 ? void 0 : error.constructor) === null || _b === void 0 ? void 0 : _b.name);
        firebase_functions_1.logger.error('Error message:', error === null || error === void 0 ? void 0 : error.message);
        firebase_functions_1.logger.error('Error stack:', error === null || error === void 0 ? void 0 : error.stack);
        firebase_functions_1.logger.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        if (error instanceof https_1.HttpsError) {
            firebase_functions_1.logger.error('Re-throwing HttpsError:', { code: error.code, message: error.message });
            throw error;
        }
        firebase_functions_1.logger.error('Throwing internal error');
        throw new https_1.HttpsError('internal', `Failed to register device: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
    }
    finally {
        firebase_functions_1.logger.info('=== REGISTER DEVICE END ===');
    }
});
//# sourceMappingURL=registerDevice.js.map