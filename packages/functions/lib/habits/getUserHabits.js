"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserHabits = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.getUserHabits = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    try {
        // Get user's habits from Firestore
        const habitsSnapshot = await firebase_1.db
            .collection('habits')
            .where('userId', '==', userId)
            .where('isActive', '==', true)
            .orderBy('sortOrder')
            .get();
        const habits = habitsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return habits;
    }
    catch (error) {
        console.error('Error fetching user habits:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch habits');
    }
});
//# sourceMappingURL=getUserHabits.js.map