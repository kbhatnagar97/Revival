"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onHabitDelete = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const firebase_1 = require("../lib/firebase");
const config_1 = require("../lib/config");
/**
 * Triggered when a habit document is deleted
 * Cleans up associated daily entries
 */
exports.onHabitDelete = (0, firestore_1.onDocumentDeleted)(Object.assign(Object.assign({}, config_1.firestoreTriggerOptions), { document: 'users/{userId}/habits/{habitId}' }), async (event) => {
    const { userId, habitId } = event.params;
    try {
        firebase_functions_1.logger.info(`Cleaning up data for deleted habit: ${habitId}`);
        // Delete all daily entries for this habit
        const entriesRef = firebase_1.db.collection(`users/${userId}/habits/${habitId}/entries`);
        const entriesSnapshot = await entriesRef.get();
        const batch = firebase_1.db.batch();
        entriesSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        firebase_functions_1.logger.info(`Successfully cleaned up ${entriesSnapshot.size} entries for habit: ${habitId}`);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error cleaning up habit data:', error);
        throw error;
    }
});
//# sourceMappingURL=onHabitDelete.js.map