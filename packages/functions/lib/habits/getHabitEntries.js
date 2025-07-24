"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHabitEntries = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.getHabitEntries = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { startDate, endDate } = request.data;
    if (!startDate || !endDate) {
        throw new https_1.HttpsError('invalid-argument', 'startDate and endDate are required');
    }
    try {
        // Get habit entries for the date range
        const entriesSnapshot = await firebase_1.db
            .collection('habitEntries')
            .where('userId', '==', userId)
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();
        const entries = entriesSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return entries;
    }
    catch (error) {
        console.error('Error fetching habit entries:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch habit entries');
    }
});
//# sourceMappingURL=getHabitEntries.js.map