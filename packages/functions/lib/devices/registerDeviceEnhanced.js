"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDevice = exports.registerDeviceEnhanced = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const util_1 = require("util");
const dns_1 = require("dns");
const reverseLookup = (0, util_1.promisify)(dns_1.reverse);
// Helper function to get hostname from IP via reverse DNS lookup
async function getHostnameFromIP(ipAddress) {
    try {
        if (ipAddress === 'unknown' || ipAddress === '127.0.0.1' || ipAddress === '::1') {
            return null;
        }
        const hostnames = await reverseLookup(ipAddress);
        return Array.isArray(hostnames) && hostnames.length > 0 ? hostnames[0] : null;
    }
    catch (error) {
        console.warn(`Failed to get hostname for IP ${ipAddress}:`, error);
        return null;
    }
}
// Helper function to get network info from IP
async function getNetworkInfoFromIP(ipAddress) {
    try {
        // Get hostname via reverse DNS lookup
        const hostname = await getHostnameFromIP(ipAddress);
        // Get ISP info from IP geolocation service
        const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,isp,org`);
        const data = await response.json();
        if (data.status === 'success') {
            return {
                hostname: hostname,
                isp: data.isp || null
            };
        }
        return {
            hostname: hostname,
            isp: null
        };
    }
    catch (error) {
        console.error('Failed to get network info from IP:', error);
        return {
            hostname: null,
            isp: null
        };
    }
}
exports.registerDeviceEnhanced = (0, https_1.onCall)({ cors: true }, async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { deviceId, userId, type, deviceModel, fcmToken, hardware, os, capabilities, network } = request.data;
    // Validate required fields
    if (!deviceId || !userId || !type || !hardware || !os || !capabilities) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required device information');
    }
    // Verify user ID matches authenticated user
    if (request.auth.uid !== userId) {
        throw new https_1.HttpsError('permission-denied', 'User ID mismatch');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        const now = firestore_1.Timestamp.now();
        // Get client IP address for network info
        const rawIP = request.rawRequest.ip ||
            request.rawRequest.headers['x-forwarded-for'] ||
            'unknown';
        const ipAddress = Array.isArray(rawIP) ? rawIP[0] : rawIP;
        // Get network information from IP
        const networkInfo = network || await getNetworkInfoFromIP(ipAddress);
        // Check if device already exists
        const deviceRef = db
            .collection('users')
            .doc(userId)
            .collection('devices')
            .doc(deviceId);
        const existingDevice = await deviceRef.get();
        const deviceData = Object.assign({ deviceId,
            userId,
            type, deviceModel: deviceModel || null, fcmToken: fcmToken || null, hardware,
            os,
            capabilities, network: networkInfo, lastSeenAt: now }, (existingDevice.exists
            ? { updatedAt: now }
            : { firstRegisteredAt: now, createdAt: now }));
        // Save device document
        await deviceRef.set(deviceData, { merge: true });
        console.log(`Device ${deviceId} registered/updated for user ${userId}`);
        return {
            success: true,
            deviceId,
            message: existingDevice.exists ? 'Device updated' : 'Device registered'
        };
    }
    catch (error) {
        console.error('Error registering device:', error);
        throw new https_1.HttpsError('internal', 'Failed to register device');
    }
});
// Legacy function for backward compatibility
exports.registerDevice = (0, https_1.onCall)({ cors: true }, async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { deviceId, type, osName, osVersion, deviceModel, fcmToken } = request.data;
    // Validate required fields
    if (!deviceId || !type) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required device information');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        const now = firestore_1.Timestamp.now();
        const userId = request.auth.uid;
        // Check if device already exists
        const deviceRef = db
            .collection('users')
            .doc(userId)
            .collection('devices')
            .doc(deviceId);
        const existingDevice = await deviceRef.get();
        const deviceData = Object.assign({ type, deviceModel: deviceModel || null, osName: osName || 'Unknown', osVersion: osVersion || 'Unknown', fcmToken: fcmToken || null, lastSeenAt: now }, (existingDevice.exists
            ? {}
            : { firstRegisteredAt: now }));
        // Save device document
        await deviceRef.set(deviceData, { merge: true });
        console.log(`Device ${deviceId} registered/updated (legacy) for user ${userId}`);
        return {
            success: true,
            deviceId,
            message: existingDevice.exists ? 'Device updated' : 'Device registered'
        };
    }
    catch (error) {
        console.error('Error registering device (legacy):', error);
        throw new https_1.HttpsError('internal', 'Failed to register device');
    }
});
//# sourceMappingURL=registerDeviceEnhanced.js.map