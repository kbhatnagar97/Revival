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
    var _a, _b, _c;
    try {
        // Check if user is authenticated
        if (!request.auth) {
            firebase_functions_1.logger.error('Unauthenticated request to onUserCreate');
            throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const uid = request.auth.uid;
        const userData = request.data || {};
        const { email, displayName, photoURL, provider } = userData;
        firebase_functions_1.logger.info(`Creating/updating user document for user: ${uid}`, {
            email: email || 'not provided',
            displayName: displayName || 'not provided',
            provider: provider || 'not provided',
            authToken: {
                email: request.auth.token.email,
                name: request.auth.token.name,
                signInProvider: (_a = request.auth.token.firebase) === null || _a === void 0 ? void 0 : _a.sign_in_provider
            }
        });
        // Get user email from auth token if not provided in data
        const userEmail = email || request.auth.token.email || '';
        const userName = displayName || request.auth.token.name || '';
        const userPhoto = photoURL || request.auth.token.picture;
        // Determine provider from auth token if not provided
        let userProvider = 'password';
        if (provider) {
            userProvider = provider === 'google.com' ? 'google.com' : 'password';
        }
        else if ((_b = request.auth.token.firebase) === null || _b === void 0 ? void 0 : _b.sign_in_provider) {
            userProvider = request.auth.token.firebase.sign_in_provider === 'google.com' ? 'google.com' : 'password';
        }
        // Validate required fields
        if (!userEmail) {
            firebase_functions_1.logger.error('No email provided for user creation', { uid, userData });
            throw new https_1.HttpsError('invalid-argument', 'Email is required for user creation');
        }
        if (!userName) {
            firebase_functions_1.logger.error('No display name provided for user creation', { uid, userData });
            throw new https_1.HttpsError('invalid-argument', 'Display name is required for user creation');
        }
        // Check if user document already exists
        const existingDoc = await firebase_1.db.collection('users').doc(uid).get();
        if (existingDoc.exists) {
            // User already exists, just update lastSeenAt
            await firebase_1.db.collection('users').doc(uid).update({
                lastSeenAt: firebase_1.Timestamp.now(),
            });
            firebase_functions_1.logger.info(`Updated existing user document for: ${uid}`);
            return {
                success: true,
                message: 'User document updated',
                user: existingDoc.data()
            };
        }
        // Create new user document matching DATABASE_SCHEMA.md
        const userDoc = {
            email: userEmail,
            displayName: userName,
            picture: userPhoto || undefined,
            provider: userProvider,
            createdAt: firebase_1.Timestamp.now(),
            timezone: 'Asia/Kolkata', // Default timezone (Delhi/India)
            lastSeenAt: firebase_1.Timestamp.now(),
        };
        await firebase_1.db.collection('users').doc(uid).set(userDoc);
        firebase_functions_1.logger.info(`Successfully created user document for: ${uid}`);
        return {
            success: true,
            message: 'User document created',
            user: userDoc
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error in onUserCreate function:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            uid: (_c = request.auth) === null || _c === void 0 ? void 0 : _c.uid,
            data: request.data
        });
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', `Failed to create user document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
//# sourceMappingURL=onUserCreate.js.map