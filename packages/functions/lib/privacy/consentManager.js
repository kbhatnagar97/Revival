"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeConsent = exports.updateConsentPreferences = exports.getConsentHistory = exports.storeConsentRecord = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
exports.storeConsentRecord = (0, https_1.onCall)({ cors: true }, async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { consentType, consent, country, countryCode, timestamp, ipAddress } = request.data;
    // Validate required fields
    if (!consentType || !consent || !country || !countryCode || !timestamp) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required consent information');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        const userId = request.auth.uid;
        const now = firestore_1.Timestamp.now();
        // Store consent record for compliance
        const consentRef = db
            .collection('users')
            .doc(userId)
            .collection('consentRecords')
            .doc();
        const consentRecord = {
            consentType,
            consent,
            country,
            countryCode,
            timestamp: firestore_1.Timestamp.fromDate(new Date(timestamp)),
            ipAddress,
            userAgent: request.rawRequest.headers['user-agent'] || 'Unknown',
            createdAt: now,
            userId
        };
        await consentRef.set(consentRecord);
        // Also update user's current consent status
        const userRef = db.collection('users').doc(userId);
        await userRef.set({
            consent: {
                type: consentType,
                status: consent,
                lastUpdated: now,
                country,
                countryCode
            },
            updatedAt: now
        }, { merge: true });
        console.log(`Consent record stored for user ${userId}: ${consentType}`);
        return {
            success: true,
            message: 'Consent recorded successfully'
        };
    }
    catch (error) {
        console.error('Error storing consent record:', error);
        throw new https_1.HttpsError('internal', 'Failed to store consent record');
    }
});
exports.getConsentHistory = (0, https_1.onCall)({ cors: true }, async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        const userId = request.auth.uid;
        // Get user's consent history
        const consentRecords = await db
            .collection('users')
            .doc(userId)
            .collection('consentRecords')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        const history = consentRecords.docs.map(doc => (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: doc.data().createdAt.toDate().toISOString(), timestamp: doc.data().timestamp.toDate().toISOString() })));
        return {
            success: true,
            history
        };
    }
    catch (error) {
        console.error('Error getting consent history:', error);
        throw new https_1.HttpsError('internal', 'Failed to get consent history');
    }
});
exports.updateConsentPreferences = (0, https_1.onCall)({ cors: true }, async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { consentType, consent } = request.data;
    // Validate required fields
    if (!consentType || !consent) {
        throw new https_1.HttpsError('invalid-argument', 'Missing consent information');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        const userId = request.auth.uid;
        const now = firestore_1.Timestamp.now();
        // Get client IP address
        const rawIP = request.rawRequest.ip ||
            request.rawRequest.headers['x-forwarded-for'] ||
            'unknown';
        const ipAddress = Array.isArray(rawIP) ? rawIP[0] : rawIP;
        // Store new consent record
        const consentRef = db
            .collection('users')
            .doc(userId)
            .collection('consentRecords')
            .doc();
        const consentRecord = {
            consentType,
            consent,
            timestamp: now,
            ipAddress,
            userAgent: request.rawRequest.headers['user-agent'] || 'Unknown',
            createdAt: now,
            userId,
            action: 'update'
        };
        await consentRef.set(consentRecord);
        // Update user's current consent status
        const userRef = db.collection('users').doc(userId);
        await userRef.set({
            consent: {
                type: consentType,
                status: consent,
                lastUpdated: now
            },
            updatedAt: now
        }, { merge: true });
        console.log(`Consent preferences updated for user ${userId}: ${consentType}`);
        return {
            success: true,
            message: 'Consent preferences updated successfully'
        };
    }
    catch (error) {
        console.error('Error updating consent preferences:', error);
        throw new https_1.HttpsError('internal', 'Failed to update consent preferences');
    }
});
exports.revokeConsent = (0, https_1.onCall)({ cors: true }, async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        const userId = request.auth.uid;
        const now = firestore_1.Timestamp.now();
        // Get client IP address
        const rawIP = request.rawRequest.ip ||
            request.rawRequest.headers['x-forwarded-for'] ||
            'unknown';
        const ipAddress = Array.isArray(rawIP) ? rawIP[0] : rawIP;
        // Store revocation record
        const consentRef = db
            .collection('users')
            .doc(userId)
            .collection('consentRecords')
            .doc();
        const revocationRecord = {
            action: 'revoke',
            timestamp: now,
            ipAddress,
            userAgent: request.rawRequest.headers['user-agent'] || 'Unknown',
            createdAt: now,
            userId
        };
        await consentRef.set(revocationRecord);
        // Remove consent from user document
        const userRef = db.collection('users').doc(userId);
        await userRef.set({
            consent: null,
            updatedAt: now
        }, { merge: true });
        console.log(`Consent revoked for user ${userId}`);
        return {
            success: true,
            message: 'Consent revoked successfully'
        };
    }
    catch (error) {
        console.error('Error revoking consent:', error);
        throw new https_1.HttpsError('internal', 'Failed to revoke consent');
    }
});
//# sourceMappingURL=consentManager.js.map