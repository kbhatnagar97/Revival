"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * End a session by setting sessionEnd timestamp and marking as inactive
 * Should be called when user closes the app or logs out
 */
exports.endSession = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    var _a;
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { sessionId } = request.data;
    // Validate required fields
    if (!sessionId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required field: sessionId');
    }
    try {
        firebase_functions_1.logger.info(`Ending session: ${sessionId} for user: ${userId}`);
        const now = firebase_1.Timestamp.now();
        // Update session with end time and mark as inactive
        const sessionRef = firebase_1.db.collection(`users/${userId}/userSessions`).doc(sessionId);
        const sessionDoc = await sessionRef.get();
        if (!sessionDoc.exists) {
            firebase_functions_1.logger.error(`Session not found: ${sessionId} for user: ${userId}`);
            throw new https_1.HttpsError('not-found', 'Session not found');
        }
        const sessionData = sessionDoc.data();
        // Only end the session if it's still active
        if ((sessionData === null || sessionData === void 0 ? void 0 : sessionData.isActive) !== false && !(sessionData === null || sessionData === void 0 ? void 0 : sessionData.sessionEnd)) {
            await sessionRef.update({
                sessionEnd: now,
                isActive: false,
                lastSeenAt: now, // Update last seen to the end time
            });
            firebase_functions_1.logger.info(`Session ${sessionId} ended successfully for user ${userId}`);
            return {
                success: true,
                message: 'Session ended successfully',
                sessionEnd: now.toDate().toISOString()
            };
        }
        else {
            firebase_functions_1.logger.info(`Session ${sessionId} was already ended for user ${userId}`);
            return {
                success: true,
                message: 'Session was already ended',
                sessionEnd: ((_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.sessionEnd) === null || _a === void 0 ? void 0 : _a.toDate().toISOString()) || null
            };
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('Error ending session:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to end session');
    }
});
//# sourceMappingURL=endSession.js.map