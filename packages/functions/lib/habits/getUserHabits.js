"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserHabits = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Get all habits for the authenticated user
 */
exports.getUserHabits = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    try {
        firebase_functions_1.logger.info(`Getting habits for user: ${userId}`);
        // Get all habits for the user
        const habitsRef = firebase_1.db.collection(`users/${userId}/habits`);
        const habitsSnapshot = await habitsRef.orderBy('order', 'asc').get();
        const habits = habitsSnapshot.docs.map(doc => {
            var _a, _b;
            const data = doc.data();
            return Object.assign(Object.assign({ id: doc.id }, data), { 
                // Convert timestamps for frontend compatibility
                createdAt: (_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString(), updatedAt: (_b = data.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate().toISOString() });
        });
        firebase_functions_1.logger.info(`Retrieved ${habits.length} habits for user: ${userId}`);
        return habits;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error getting user habits:', error);
        throw new https_1.HttpsError('internal', 'Failed to get user habits');
    }
});
//# sourceMappingURL=getUserHabits.js.map