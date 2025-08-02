"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectUserLocation = exports.createSession = exports.createSessionEnhanced = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
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
        console.log(`[getHostnameFromIP] Attempting reverse DNS lookup for: ${ipAddress}`);
        // Set a timeout for DNS lookup
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('DNS lookup timeout')), 5000);
        });
        const lookupPromise = reverseLookup(ipAddress);
        const hostnames = await Promise.race([lookupPromise, timeoutPromise]);
        if (Array.isArray(hostnames) && hostnames.length > 0) {
            console.log(`[getHostnameFromIP] Resolved hostname: ${hostnames[0]}`);
            return hostnames[0];
        }
        console.log(`[getHostnameFromIP] No hostname found for IP: ${ipAddress}`);
        return null;
    }
    catch (error) {
        console.log(`[getHostnameFromIP] Failed to resolve hostname for ${ipAddress}:`, error instanceof Error ? error.message : String(error));
        return null;
    }
}
// Helper function to get location and network info from IP address
async function getLocationAndNetworkFromIP(ipAddress) {
    console.log(`[getLocationAndNetworkFromIP] Processing IP: ${ipAddress}`);
    // Enhanced fallback data with more meaningful defaults
    const fallbackData = {
        location: {
            country: 'Unknown',
            countryCode: 'XX',
            region: 'Unknown',
            city: 'Unknown',
            timezone: 'UTC',
            timezoneOffset: 0
        },
        network: {
            hostname: 'Unknown',
            isp: 'Unknown ISP',
            asn: 'Unknown ASN'
        }
    };
    try {
        // Only skip API call for truly local/invalid IPs
        if (!ipAddress || ipAddress === 'unknown' || ipAddress === '127.0.0.1' || ipAddress === '::1') {
            console.log(`[getLocationAndNetworkFromIP] Skipping local/invalid IP: ${ipAddress}`);
            return fallbackData;
        }
        // Check for private IP ranges more precisely
        const isPrivateIP = ipAddress.startsWith('192.168.') ||
            ipAddress.startsWith('10.') ||
            (ipAddress.startsWith('172.') &&
                parseInt(ipAddress.split('.')[1]) >= 16 &&
                parseInt(ipAddress.split('.')[1]) <= 31);
        if (isPrivateIP) {
            console.log(`[getLocationAndNetworkFromIP] Skipping private IP: ${ipAddress}`);
            return fallbackData;
        }
        console.log(`[getLocationAndNetworkFromIP] Making API call for IP: ${ipAddress}`);
        // Using a free IP geolocation service with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10 second timeout
        const response = await fetch(`https://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,region,city,timezone,offset,isp,as,org,query`, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Revival-App/1.0',
                'Accept': 'application/json'
            }
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`[getLocationAndNetworkFromIP] API response:`, JSON.stringify(data, null, 2));
        if (data.status === 'success') {
            // Get hostname via reverse DNS lookup (with error handling)
            let hostname = 'Unknown';
            try {
                const resolvedHostname = await getHostnameFromIP(ipAddress);
                hostname = resolvedHostname || `${data.isp || 'Unknown'} Network`;
            }
            catch (error) {
                hostname = `${data.isp || 'Unknown'} Network`;
            }
            const result = {
                location: {
                    country: data.country || 'Unknown',
                    countryCode: data.countryCode || 'XX',
                    region: data.region || data.regionName || 'Unknown',
                    city: data.city || 'Unknown',
                    timezone: data.timezone || 'UTC',
                    timezoneOffset: typeof data.offset === 'number' ? data.offset : 0
                },
                network: {
                    hostname: hostname,
                    isp: data.isp || data.org || 'Unknown ISP',
                    asn: data.as || 'Unknown ASN'
                }
            };
            console.log(`[getLocationAndNetworkFromIP] Successful result:`, JSON.stringify(result, null, 2));
            return result;
        }
        else {
            console.warn(`[getLocationAndNetworkFromIP] API returned failure status:`, data);
        }
    }
    catch (error) {
        console.error(`[getLocationAndNetworkFromIP] Error processing IP ${ipAddress}:`, error instanceof Error ? error.message : String(error));
    }
    console.log(`[getLocationAndNetworkFromIP] Returning fallback data for IP: ${ipAddress}`);
    return fallbackData;
}
exports.createSessionEnhanced = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    var _a;
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { deviceId, browser, orientation, security } = request.data;
    // Validate required fields
    if (!deviceId || !browser || !orientation || !security) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required session information');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        const now = firestore_1.Timestamp.now();
        const userId = request.auth.uid;
        // Get client IP address with detailed logging
        const rawIP = request.rawRequest.ip ||
            request.rawRequest.headers['x-forwarded-for'] ||
            ((_a = request.rawRequest.connection) === null || _a === void 0 ? void 0 : _a.remoteAddress) ||
            'unknown';
        const ipAddress = Array.isArray(rawIP) ? rawIP[0] : rawIP;
        console.log(`[createSessionEnhanced] Detected IP address: ${ipAddress} (raw: ${JSON.stringify(rawIP)})`);
        // Get location and network data from IP
        console.log(`[createSessionEnhanced] Fetching location and network data for IP: ${ipAddress}`);
        const { location: locationData, network: networkData } = await getLocationAndNetworkFromIP(ipAddress);
        console.log(`[createSessionEnhanced] Location data:`, JSON.stringify(locationData, null, 2));
        console.log(`[createSessionEnhanced] Network data:`, JSON.stringify(networkData, null, 2));
        // Generate session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Create session document
        const sessionRef = db
            .collection('users')
            .doc(userId)
            .collection('userSessions')
            .doc(sessionId);
        const sessionData = {
            deviceId,
            loginAt: now,
            lastSeenAt: now,
            ipAddress,
            browser,
            orientation,
            location: {
                ipAddress,
                country: locationData.country,
                countryCode: locationData.countryCode,
                region: locationData.region,
                city: locationData.city,
                timezone: locationData.timezone,
                timezoneOffset: locationData.timezoneOffset
            },
            security,
            network: networkData
        };
        console.log(`[createSessionEnhanced] Final session data:`, JSON.stringify(sessionData, null, 2));
        await sessionRef.set(sessionData);
        console.log(`[createSessionEnhanced] Session ${sessionId} created successfully for user ${userId}`);
        return {
            success: true,
            sessionId,
            message: 'Session created successfully'
        };
    }
    catch (error) {
        console.error('Error creating enhanced session:', error);
        throw new https_1.HttpsError('internal', 'Failed to create session');
    }
});
// Legacy function for backward compatibility
exports.createSession = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { deviceId, userAgent } = request.data;
    // Validate required fields
    if (!deviceId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing device ID');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        const now = firestore_1.Timestamp.now();
        const userId = request.auth.uid;
        // Get client IP address
        const rawIP = request.rawRequest.ip ||
            request.rawRequest.headers['x-forwarded-for'] ||
            'unknown';
        const ipAddress = Array.isArray(rawIP) ? rawIP[0] : rawIP;
        // Generate session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Create session document (legacy format)
        const sessionRef = db
            .collection('users')
            .doc(userId)
            .collection('userSessions')
            .doc(sessionId);
        const sessionData = {
            deviceId,
            loginAt: now,
            lastSeenAt: now,
            ipAddress,
            userAgent: userAgent || 'Unknown',
            isActive: true,
            createdAt: now
        };
        await sessionRef.set(sessionData);
        console.log(`Legacy session ${sessionId} created for user ${userId} on device ${deviceId}`);
        return {
            success: true,
            sessionId,
            message: 'Session created successfully'
        };
    }
    catch (error) {
        console.error('Error creating legacy session:', error);
        throw new https_1.HttpsError('internal', 'Failed to create session');
    }
});
// Function to detect user location (for consent requirements)
exports.detectUserLocation = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    var _a;
    try {
        // Get client IP address
        const rawIP = request.rawRequest.ip ||
            request.rawRequest.headers['x-forwarded-for'] ||
            ((_a = request.rawRequest.connection) === null || _a === void 0 ? void 0 : _a.remoteAddress) ||
            'unknown';
        const ipAddress = Array.isArray(rawIP) ? rawIP[0] : rawIP;
        const { location: locationData } = await getLocationAndNetworkFromIP(ipAddress);
        return Object.assign({ success: true }, locationData);
    }
    catch (error) {
        console.error('Error detecting user location:', error);
        // Return fallback data instead of throwing error
        return {
            success: true,
            country: 'Unknown',
            countryCode: 'XX',
            region: null,
            city: null,
            timezone: 'UTC',
            timezoneOffset: 0
        };
    }
});
//# sourceMappingURL=createSessionEnhanced.js.map