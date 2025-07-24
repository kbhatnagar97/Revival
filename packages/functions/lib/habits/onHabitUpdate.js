"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onHabitUpdate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const firebase_1 = require("../lib/firebase");
const config_1 = require("../lib/config");
/**
 * Triggered when a habit document is updated
 */
exports.onHabitUpdate = (0, firestore_1.onDocumentUpdated)(Object.assign(Object.assign({}, config_1.firestoreTriggerOptions), { document: 'users/{userId}/habits/{habitId}' }), async (event) => {
    var _a, _b, _c, _d;
    const { userId, habitId } = event.params;
    const beforeData = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.data();
    const afterData = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after) === null || _d === void 0 ? void 0 : _d.data();
    if (!beforeData || !afterData) {
        firebase_functions_1.logger.warn(`Missing habit data for ${habitId}`);
        return;
    }
    try {
        firebase_functions_1.logger.info(`Habit updated: ${habitId} for user: ${userId}`);
        // Update the lastCalculated timestamp
        await firebase_1.db.collection(`users/${userId}/habits`).doc(habitId).update({
            updatedAt: firebase_1.Timestamp.now(),
        });
        firebase_functions_1.logger.info(`Successfully processed habit update for: ${habitId}`);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error processing habit update:', error);
        throw error;
    }
});
//# sourceMappingURL=onHabitUpdate.js.map