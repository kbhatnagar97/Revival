"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderHabits = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.reorderHabits = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { habitIds } = request.data;
    if (!habitIds || !Array.isArray(habitIds)) {
        throw new https_1.HttpsError('invalid-argument', 'habitIds must be an array');
    }
    try {
        // Use a transaction to ensure atomic updates
        await firebase_1.db.runTransaction(async (transaction) => {
            // Verify all habits belong to the user
            const habitRefs = habitIds.map(id => firebase_1.db.collection('habits').doc(id));
            const habitDocs = await Promise.all(habitRefs.map(ref => transaction.get(ref)));
            // Validate ownership
            for (const doc of habitDocs) {
                if (!doc.exists) {
                    throw new https_1.HttpsError('not-found', `Habit not found: ${doc.id}`);
                }
                const data = doc.data();
                if ((data === null || data === void 0 ? void 0 : data.userId) !== userId) {
                    throw new https_1.HttpsError('permission-denied', 'Not authorized to reorder these habits');
                }
            }
            // Update sort orders
            habitIds.forEach((habitId, index) => {
                const habitRef = firebase_1.db.collection('habits').doc(habitId);
                transaction.update(habitRef, {
                    sortOrder: index,
                    updatedAt: firebase_1.Timestamp.now(),
                });
            });
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error reordering habits:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to reorder habits');
    }
});
//# sourceMappingURL=reorderHabits.js.map