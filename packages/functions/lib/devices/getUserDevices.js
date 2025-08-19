"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDevices = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Get all registered devices for the authenticated user
 */
exports.getUserDevices = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    try {
        firebase_functions_1.logger.info(`Getting devices for user: ${userId}`);
        // Get all devices for the user
        const devicesRef = firebase_1.db.collection(`users/${userId}/devices`);
        const devicesSnapshot = await devicesRef.orderBy('lastSeenAt', 'desc').get();
        const devices = devicesSnapshot.docs.map(doc => {
            var _a, _b;
            const data = doc.data();
            return Object.assign(Object.assign({ id: doc.id }, data), { 
                // Convert timestamps for frontend compatibility
                lastSeenAt: (_a = data.lastSeenAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString(), firstRegisteredAt: (_b = data.firstRegisteredAt) === null || _b === void 0 ? void 0 : _b.toDate().toISOString() });
        });
        firebase_functions_1.logger.info(`Retrieved ${devices.length} devices for user: ${userId}`);
        return devices;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error getting user devices:', error);
        throw new https_1.HttpsError('internal', 'Failed to get user devices');
    }
});
//# sourceMappingURL=getUserDevices.js.map