"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSessionHeartbeat = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
/**
 * Update session heartbeat to track user activity
 * Should be called every 5 minutes while user is active
 */
exports.updateSessionHeartbeat = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { sessionId, deviceId, orientation } = request.data;
    // Validate required fields
    if (!sessionId || !deviceId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields: sessionId, deviceId');
    }
    try {
        firebase_functions_1.logger.info(`Updating heartbeat for session: ${sessionId}, user: ${userId}`);
        const db = (0, firestore_1.getFirestore)();
        const now = firestore_1.Timestamp.now();
        // Update session lastSeenAt
        const sessionRef = db.collection(`users/${userId}/userSessions`).doc(sessionId);
        const sessionDoc = await sessionRef.get();
        if (!sessionDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Session not found');
        }
        // Prepare update data
        const updateData = {
            lastSeenAt: now,
        };
        // Update orientation if provided
        if (orientation) {
            updateData.orientation = orientation;
        }
        await sessionRef.update(updateData);
        // Also update device lastSeenAt
        const deviceRef = db.collection(`users/${userId}/devices`).doc(deviceId);
        await deviceRef.update({
            lastSeenAt: now,
        });
        firebase_functions_1.logger.info(`Updated heartbeat for session: ${sessionId}`);
        return {
            success: true,
            message: 'Heartbeat updated successfully',
            lastSeenAt: now.toDate().toISOString()
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error updating session heartbeat:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to update session heartbeat');
    }
});
//# sourceMappingURL=updateSessionHeartbeat.js.map