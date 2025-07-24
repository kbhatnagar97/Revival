"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHabit = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.updateHabit = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    var _a, _b;
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const _c = request.data, { habitId } = _c, updates = __rest(_c, ["habitId"]);
    if (!habitId) {
        throw new https_1.HttpsError('invalid-argument', 'habitId is required');
    }
    try {
        const habitRef = firebase_1.db.collection('habits').doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Habit not found');
        }
        const habitData = habitDoc.data();
        if ((habitData === null || habitData === void 0 ? void 0 : habitData.userId) !== userId) {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to update this habit');
        }
        // Prepare update data
        const updateData = Object.assign(Object.assign({}, updates), { updatedAt: firebase_1.Timestamp.now() });
        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });
        await habitRef.update(updateData);
        // Get updated habit
        const updatedHabit = await habitRef.get();
        const updatedData = updatedHabit.data();
        return Object.assign(Object.assign({ id: habitId }, updatedData), { createdAt: (_a = updatedData === null || updatedData === void 0 ? void 0 : updatedData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString(), updatedAt: (_b = updatedData === null || updatedData === void 0 ? void 0 : updatedData.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate().toISOString() });
    }
    catch (error) {
        console.error('Error updating habit:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to update habit');
    }
});
//# sourceMappingURL=updateHabit.js.map