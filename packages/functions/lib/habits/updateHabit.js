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
const firebase_functions_1 = require("firebase-functions");
/**
 * Update an existing habit for the authenticated user
 */
exports.updateHabit = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    var _a, _b, _c, _d;
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const _e = request.data, { habitId, days, sortOrder, isActive } = _e, updates = __rest(_e, ["habitId", "days", "sortOrder", "isActive"]);
    if (!habitId) {
        throw new https_1.HttpsError('invalid-argument', 'habitId is required');
    }
    // Helper function to convert days array to scheduledDays object if needed
    function convertDaysToScheduledDays(days) {
        if (!days)
            return undefined;
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const scheduledDays = {};
        dayNames.forEach((dayName, index) => {
            scheduledDays[dayName] = days.includes(index);
        });
        return scheduledDays;
    }
    try {
        firebase_functions_1.logger.info(`Updating habit: ${habitId} for user: ${userId}`, updates);
        // Verify habit ownership
        const habitRef = firebase_1.db.collection(`users/${userId}/habits`).doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Habit not found');
        }
        // Prepare update data with schema conversions
        const updateData = Object.assign(Object.assign({}, updates), { updatedAt: firebase_1.Timestamp.now() });
        // Convert legacy fields to new schema
        if (days !== undefined) {
            updateData.scheduledDays = convertDaysToScheduledDays(days);
        }
        if (sortOrder !== undefined) {
            updateData.order = sortOrder;
        }
        if (isActive !== undefined) {
            updateData.status = isActive ? 'active' : 'paused';
        }
        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });
        await habitRef.update(updateData);
        // Get updated habit
        const updatedDoc = await habitRef.get();
        const updatedHabit = Object.assign(Object.assign({ id: updatedDoc.id }, updatedDoc.data()), { createdAt: (_b = (_a = updatedDoc.data()) === null || _a === void 0 ? void 0 : _a.createdAt) === null || _b === void 0 ? void 0 : _b.toDate().toISOString(), updatedAt: (_d = (_c = updatedDoc.data()) === null || _c === void 0 ? void 0 : _c.updatedAt) === null || _d === void 0 ? void 0 : _d.toDate().toISOString() });
        firebase_functions_1.logger.info(`Successfully updated habit: ${habitId} for user: ${userId}`);
        return updatedHabit;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error updating habit:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to update habit');
    }
});
//# sourceMappingURL=updateHabit.js.map