"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateHabitEntries = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.bulkUpdateHabitEntries = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { updates } = request.data;
    if (!updates || !Array.isArray(updates)) {
        throw new https_1.HttpsError('invalid-argument', 'updates must be an array');
    }
    if (updates.length === 0) {
        return { success: true, updated: 0 };
    }
    try {
        // Verify all habits belong to the user
        const habitIds = [...new Set(updates.map(update => update.habitId))];
        const habitRefs = habitIds.map(id => firebase_1.db.collection('habits').doc(id));
        const habitDocs = await Promise.all(habitRefs.map(ref => ref.get()));
        for (const doc of habitDocs) {
            if (!doc.exists) {
                throw new https_1.HttpsError('not-found', `Habit not found: ${doc.id}`);
            }
            const data = doc.data();
            if ((data === null || data === void 0 ? void 0 : data.userId) !== userId) {
                throw new https_1.HttpsError('permission-denied', 'Not authorized to update these habits');
            }
        }
        // Process updates in batches (Firestore batch limit is 500)
        const batchSize = 500;
        let totalUpdated = 0;
        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = firebase_1.db.batch();
            const batchUpdates = updates.slice(i, i + batchSize);
            for (const update of batchUpdates) {
                const { habitId, date, count, completed } = update;
                // Find existing entry
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
                    updatedAt: firebase_1.Timestamp.now(),
                };
                if (entryQuery.empty) {
                    // Create new entry
                    const newEntryData = Object.assign(Object.assign({}, baseEntryData), { createdAt: firebase_1.Timestamp.now() });
                    const newEntryRef = firebase_1.db.collection('habitEntries').doc();
                    batch.set(newEntryRef, newEntryData);
                }
                else {
                    // Update existing entry
                    const entryRef = entryQuery.docs[0].ref;
                    batch.update(entryRef, baseEntryData);
                }
                totalUpdated++;
            }
            await batch.commit();
        }
        return { success: true, updated: totalUpdated };
    }
    catch (error) {
        console.error('Error bulk updating habit entries:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to bulk update habit entries');
    }
});
//# sourceMappingURL=bulkUpdateHabitEntries.js.map