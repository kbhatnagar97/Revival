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
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { deviceId, type, deviceModel, osName, osVersion, fcmToken } = request.data;
    // Validate required fields
    if (!deviceId || !type || !osName || !osVersion) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields: deviceId, type, osName, osVersion');
    }
    // Validate device type
    if (!['mobile', 'web', 'desktop'].includes(type)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid device type. Must be mobile, web, or desktop');
    }
    try {
        firebase_functions_1.logger.info(`Registering device for user: ${userId}`, { deviceId, type, osName });
        const deviceRef = firebase_1.db.collection(`users/${userId}/devices`).doc(deviceId);
        const existingDevice = await deviceRef.get();
        const now = firebase_1.Timestamp.now();
        if (existingDevice.exists) {
            // Update existing device
            const updateData = {
                type,
                osName,
                osVersion,
                lastSeenAt: now,
            };
            // Update optional fields if provided
            if (deviceModel !== undefined)
                updateData.deviceModel = deviceModel;
            if (fcmToken !== undefined)
                updateData.fcmToken = fcmToken;
            await deviceRef.update(updateData);
            firebase_functions_1.logger.info(`Updated existing device: ${deviceId} for user: ${userId}`);
            return {
                success: true,
                message: 'Device updated successfully',
                deviceId,
                isNew: false
            };
        }
        else {
            // Create new device
            const deviceData = {
                type,
                deviceModel: deviceModel || undefined,
                osName,
                osVersion,
                fcmToken: fcmToken || undefined,
                lastSeenAt: now,
                firstRegisteredAt: now,
            };
            await deviceRef.set(deviceData);
            firebase_functions_1.logger.info(`Registered new device: ${deviceId} for user: ${userId}`);
            return {
                success: true,
                message: 'Device registered successfully',
                deviceId,
                isNew: true
            };
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('Error registering device:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to register device');
    }
});
//# sourceMappingURL=registerDevice.js.map