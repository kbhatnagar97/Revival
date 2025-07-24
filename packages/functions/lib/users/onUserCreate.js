"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreate = void 0;
const firebase_functions_1 = require("firebase-functions");
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
/**
 * Callable function to create user document when user signs up
 * Note: Using callable function instead of auth trigger for better frontend integration
 * Follows DATABASE_SCHEMA.md specifications
 */
exports.onUserCreate = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const uid = request.auth.uid;
    const { email, displayName, photoURL, provider } = request.data || {};
    try {
        firebase_functions_1.logger.info(`Creating/updating user document for user: ${uid}`);
        // Check if user document already exists
        const existingDoc = await firebase_1.db.collection('users').doc(uid).get();
        if (existingDoc.exists) {
            // User already exists, just update lastSeenAt
            await firebase_1.db.collection('users').doc(uid).update({
                lastSeenAt: firebase_1.Timestamp.now(),
            });
            firebase_functions_1.logger.info(`Updated existing user document for: ${uid}`);
            return { success: true, message: 'User document updated' };
        }
        // Create new user document matching DATABASE_SCHEMA.md
        const userDoc = {
            email: email || '',
            name: displayName || '',
            picture: photoURL || undefined,
            provider: provider || 'password',
            createdAt: firebase_1.Timestamp.now(),
            timezone: 'America/Los_Angeles', // Default timezone as per schema
            lastSeenAt: firebase_1.Timestamp.now(),
        };
        await firebase_1.db.collection('users').doc(uid).set(userDoc);
        firebase_functions_1.logger.info(`Successfully created user document for: ${uid}`);
        return { success: true, message: 'User document created' };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error creating user document:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to create user document');
    }
});
//# sourceMappingURL=onUserCreate.js.map