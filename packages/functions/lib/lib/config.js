"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firestoreTriggerOptions = exports.callableFunctionOptions = exports.REGION = void 0;
// Firebase Functions configuration
exports.REGION = 'asia-south2';
// Function options for all callable functions
exports.callableFunctionOptions = {
    region: exports.REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
};
// Function options for Firestore triggers
exports.firestoreTriggerOptions = {
    region: exports.REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
};
//# sourceMappingURL=config.js.map