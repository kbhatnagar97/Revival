"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHabitEntry = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.updateHabitEntry = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    var _a, _b;
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { habitId, date, count, completed, notes } = request.data;
    if (!habitId || !date) {
        throw new https_1.HttpsError('invalid-argument', 'habitId and date are required');
    }
    try {
        // Verify habit ownership
        const habitRef = firebase_1.db.collection('habits').doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Habit not found');
        }
        const habitData = habitDoc.data();
        if ((habitData === null || habitData === void 0 ? void 0 : habitData.userId) !== userId) {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to access this habit');
        }
        // Find existing entry or create new one
        const entryQuery = await firebase_1.db
            .collection('habitEntries')
            .where('userId', '==', userId)
            .where('habitId', '==', habitId)
            .where('date', '==', date)
            .limit(1)
            .get();
        const baseEntryData = {
            userId,
            habitId,
            date,
            count: count !== null && count !== void 0 ? count : 0,
            completed: completed !== null && completed !== void 0 ? completed : false,
            notes: notes || '',
            updatedAt: firebase_1.Timestamp.now(),
        };
        let entryRef;
        if (entryQuery.empty) {
            // Create new entry
            const newEntryData = Object.assign(Object.assign({}, baseEntryData), { createdAt: firebase_1.Timestamp.now() });
            entryRef = await firebase_1.db.collection('habitEntries').add(newEntryData);
        }
        else {
            // Update existing entry
            entryRef = entryQuery.docs[0].ref;
            await entryRef.update(baseEntryData);
        }
        // Get the final entry data
        const finalEntry = await entryRef.get();
        const finalData = finalEntry.data();
        return Object.assign(Object.assign({ id: entryRef.id }, finalData), { createdAt: (_a = finalData === null || finalData === void 0 ? void 0 : finalData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString(), updatedAt: (_b = finalData === null || finalData === void 0 ? void 0 : finalData.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate().toISOString() });
    }
    catch (error) {
        console.error('Error updating habit entry:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to update habit entry');
    }
});
//# sourceMappingURL=updateHabitEntry.js.map