"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSessions = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Get all active sessions for the authenticated user
 */
exports.getUserSessions = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    try {
        firebase_functions_1.logger.info(`Getting sessions for user: ${userId}`);
        // Get all sessions for the user
        const sessionsRef = firebase_1.db.collection(`users/${userId}/userSessions`);
        const sessionsSnapshot = await sessionsRef.orderBy('sessionStart', 'desc').get();
        const sessions = sessionsSnapshot.docs.map(doc => {
            var _a, _b, _c;
            const data = doc.data();
            return Object.assign(Object.assign({ id: doc.id }, data), { 
                // Convert timestamps for frontend compatibility
                sessionStart: (_a = data.sessionStart) === null || _a === void 0 ? void 0 : _a.toDate().toISOString(), lastSeenAt: (_b = data.lastSeenAt) === null || _b === void 0 ? void 0 : _b.toDate().toISOString(), sessionEnd: ((_c = data.sessionEnd) === null || _c === void 0 ? void 0 : _c.toDate().toISOString()) || null });
        });
        firebase_functions_1.logger.info(`Retrieved ${sessions.length} sessions for user: ${userId}`);
        return sessions;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error getting user sessions:', error);
        throw new https_1.HttpsError('internal', 'Failed to get user sessions');
    }
});
//# sourceMappingURL=getUserSessions.js.map