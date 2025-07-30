"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Create a new user session for tracking and security logging
 */
exports.createSession = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { deviceId, ipAddress, location } = request.data;
    // Validate required fields
    if (!deviceId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required field: deviceId');
    }
    try {
        firebase_functions_1.logger.info(`Creating session for user: ${userId}, device: ${deviceId}`);
        // Verify device exists
        const deviceRef = firebase_1.db.collection(`users/${userId}/devices`).doc(deviceId);
        const deviceDoc = await deviceRef.get();
        if (!deviceDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Device not found. Please register device first.');
        }
        const now = firebase_1.Timestamp.now();
        // Generate session ID (deviceId + timestamp for uniqueness)
        const sessionId = `${deviceId}_${now.seconds}`;
        // Create session document
        const sessionData = {
            deviceId,
            loginAt: now,
            lastSeenAt: now,
            ipAddress: ipAddress || undefined,
            location: location || undefined,
        };
        const sessionRef = firebase_1.db.collection(`users/${userId}/userSessions`).doc(sessionId);
        await sessionRef.set(sessionData);
        // Update device lastSeenAt
        await deviceRef.update({
            lastSeenAt: now,
        });
        firebase_functions_1.logger.info(`Created session: ${sessionId} for user: ${userId}`);
        return {
            success: true,
            message: 'Session created successfully',
            sessionId,
            loginAt: now.toDate().toISOString()
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error creating session:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to create session');
    }
});
//# sourceMappingURL=createSession.js.map