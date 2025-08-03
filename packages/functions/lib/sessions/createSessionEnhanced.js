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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    console.log(`[getLocationAndNetworkFromIP] Processing IP: ${ipAddress}`);
    // Minimal fallback data - only used when APIs completely fail
    const fallbackData = {
        location: {
            country: null,
            countryCode: null,
            region: null,
            city: null,
            timezone: 'UTC',
            timezoneOffset: 0
        },
        network: {
            hostname: null,
            isp: null,
            asn: null
        }
    };
    try {
        // Only skip API call for truly local/invalid IPs - be much more permissive
        if (!ipAddress || ipAddress === 'unknown' || ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress === 'localhost') {
            console.log(`[getLocationAndNetworkFromIP] Skipping local/invalid IP: ${ipAddress}`);
            return fallbackData;
        }
        // REMOVE private IP filtering - let the API handle it and return actual data
        // Many "private" IPs from cloud providers are actually valid public IPs
        console.log(`[getLocationAndNetworkFromIP] Processing IP (no private IP filtering): ${ipAddress}`);
        console.log(`[getLocationAndNetworkFromIP] Making API call for IP: ${ipAddress}`);
        // Try multiple geolocation services for better reliability
        let data = null;
        let apiUsed = 'none';
        // First try ip-api.com (most comprehensive)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,region,regionName,city,timezone,offset,isp,as,org,query,lat,lon`, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Revival-App/1.0',
                    'Accept': 'application/json'
                }
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                data = await response.json();
                apiUsed = 'ip-api.com';
                console.log(`[getLocationAndNetworkFromIP] ip-api.com response:`, JSON.stringify(data, null, 2));
            }
            else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        catch (error) {
            console.warn(`[getLocationAndNetworkFromIP] ip-api.com failed:`, error instanceof Error ? error.message : String(error));
            // Fallback to FindIP API (free and comprehensive)
            try {
                const controller2 = new AbortController();
                const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
                const response2 = await fetch(`https://findip.net/${ipAddress}/?token=free`, {
                    signal: controller2.signal,
                    headers: {
                        'User-Agent': 'Revival-App/1.0',
                        'Accept': 'application/json'
                    }
                });
                clearTimeout(timeoutId2);
                if (response2.ok) {
                    const findIpData = await response2.json();
                    // Convert FindIP format to ip-api.com format
                    data = {
                        status: 'success',
                        country: ((_b = (_a = findIpData.country) === null || _a === void 0 ? void 0 : _a.names) === null || _b === void 0 ? void 0 : _b.en) || findIpData.country_name,
                        countryCode: ((_c = findIpData.country) === null || _c === void 0 ? void 0 : _c.iso_code) || findIpData.country_code,
                        region: ((_f = (_e = (_d = findIpData.subdivisions) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.names) === null || _f === void 0 ? void 0 : _f.en) || findIpData.region,
                        regionName: ((_j = (_h = (_g = findIpData.subdivisions) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.names) === null || _j === void 0 ? void 0 : _j.en) || findIpData.region,
                        city: ((_l = (_k = findIpData.city) === null || _k === void 0 ? void 0 : _k.names) === null || _l === void 0 ? void 0 : _l.en) || findIpData.city,
                        timezone: ((_m = findIpData.location) === null || _m === void 0 ? void 0 : _m.time_zone) || findIpData.timezone,
                        offset: ((_o = findIpData.location) === null || _o === void 0 ? void 0 : _o.time_zone_offset) || 0,
                        isp: ((_p = findIpData.traits) === null || _p === void 0 ? void 0 : _p.isp) || findIpData.isp || findIpData.organization,
                        as: ((_q = findIpData.traits) === null || _q === void 0 ? void 0 : _q.autonomous_system_organization) || findIpData.asn,
                        org: ((_r = findIpData.traits) === null || _r === void 0 ? void 0 : _r.organization) || findIpData.organization,
                        query: ipAddress,
                        lat: (_s = findIpData.location) === null || _s === void 0 ? void 0 : _s.latitude,
                        lon: (_t = findIpData.location) === null || _t === void 0 ? void 0 : _t.longitude
                    };
                    apiUsed = 'findip.net';
                    console.log(`[getLocationAndNetworkFromIP] findip.net response converted:`, JSON.stringify(data, null, 2));
                }
            }
            catch (error2) {
                console.error(`[getLocationAndNetworkFromIP] Both APIs failed:`, error2 instanceof Error ? error2.message : String(error2));
            }
        }
        if (data && (data.status === 'success' || apiUsed === 'findip.net')) {
            console.log(`[getLocationAndNetworkFromIP] Successfully got data from ${apiUsed}`);
            // Get hostname via reverse DNS lookup (with error handling)
            let hostname = null;
            try {
                hostname = await getHostnameFromIP(ipAddress);
                console.log(`[getLocationAndNetworkFromIP] Resolved hostname: ${hostname}`);
            }
            catch (error) {
                console.log(`[getLocationAndNetworkFromIP] Hostname resolution failed, will use ISP-based hostname`);
            }
            const result = {
                location: {
                    country: data.country || 'Unknown',
                    countryCode: data.countryCode || 'XX',
                    region: data.region || data.regionName || null,
                    city: data.city || null,
                    timezone: data.timezone || 'UTC',
                    timezoneOffset: typeof data.offset === 'number' ? data.offset : 0
                },
                network: {
                    hostname: hostname || (data.isp ? `${data.isp} Network` : null),
                    isp: data.isp || data.org || null,
                    asn: data.as || null
                }
            };
            console.log(`[getLocationAndNetworkFromIP] Final result from ${apiUsed}:`, JSON.stringify(result, null, 2));
            return result;
        }
        else {
            console.error(`[getLocationAndNetworkFromIP] All APIs failed or returned invalid data`);
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
            sessionStart: now,
            lastSeenAt: now,
            sessionEnd: null, // Will be set when session ends
            isActive: true,
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
            sessionStart: now,
            lastSeenAt: now,
            sessionEnd: null,
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