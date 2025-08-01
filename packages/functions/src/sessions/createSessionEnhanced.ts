import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { promisify } from 'util';
import { reverse } from 'dns';

const reverseLookup = promisify(reverse);

interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  userAgent: string;
  language: string;
  languages: string[];
  platform: string;
  cookiesEnabled: boolean;
  doNotTrack: boolean;
}

interface SessionSecurity {
  httpsSupport: boolean;
  secureContext: boolean;
}

interface CreateSessionRequest {
  deviceId: string;
  browser: BrowserInfo;
  orientation: 'portrait' | 'landscape';
  security: SessionSecurity;
}

// Helper function to get hostname from IP via reverse DNS lookup
async function getHostnameFromIP(ipAddress: string): Promise<string | null> {
  try {
    if (ipAddress === 'unknown' || ipAddress === '127.0.0.1' || ipAddress === '::1') {
      return null;
    }
    
    const hostnames = await reverseLookup(ipAddress);
    return Array.isArray(hostnames) && hostnames.length > 0 ? hostnames[0] : null;
  } catch (error) {
    // Failed to get hostname for IP
    return null;
  }
}

// Helper function to get location and network info from IP address
async function getLocationAndNetworkFromIP(ipAddress: string) {
  // Fallback data
  const fallbackData = {
    location: {
      country: 'Unknown',
      countryCode: 'XX',
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
    // Skip API call for local/unknown IPs
    if (!ipAddress || ipAddress === 'unknown' || ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
      return fallbackData;
    }

    // Using a free IP geolocation service with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`https://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,region,city,timezone,offset,isp,as,org`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Revival-App/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Get hostname via reverse DNS lookup (with error handling)
      let hostname = null;
      try {
        hostname = await getHostnameFromIP(ipAddress);
      } catch (error) {
        // Ignore hostname lookup errors
      }
      
      return {
        location: {
          country: data.country || 'Unknown',
          countryCode: data.countryCode || 'XX',
          region: data.region || null,
          city: data.city || null,
          timezone: data.timezone || 'UTC',
          timezoneOffset: data.offset || 0
        },
        network: {
          hostname: hostname,
          isp: data.isp || null,
          asn: data.as || null
        }
      };
    }
  } catch (error) {
    console.warn('Failed to get location and network from IP:', error instanceof Error ? error.message : String(error));
  }
  
  return fallbackData;
}

export const createSessionEnhanced = onCall(
  { cors: true },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const {
      deviceId,
      browser,
      orientation,
      security
    } = request.data as CreateSessionRequest;

    // Validate required fields
    if (!deviceId || !browser || !orientation || !security) {
      throw new HttpsError('invalid-argument', 'Missing required session information');
    }

    try {
      const db = getFirestore();
      const now = Timestamp.now();
      const userId = request.auth.uid;

      // Get client IP address
      const rawIP = request.rawRequest.ip ||
                   request.rawRequest.headers['x-forwarded-for'] ||
                   request.rawRequest.connection?.remoteAddress ||
                   'unknown';
      
      const ipAddress = Array.isArray(rawIP) ? rawIP[0] : rawIP;

      // Get location and network data from IP
      const { location: locationData, network: networkData } = await getLocationAndNetworkFromIP(ipAddress);

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
          ...locationData
        },
        security,
        network: networkData,
        createdAt: now,
        updatedAt: now
      };

      await sessionRef.set(sessionData);

      // Enhanced session created successfully

      return {
        success: true,
        sessionId,
        message: 'Session created successfully'
      };

    } catch (error) {
      console.error('Error creating enhanced session:', error);
      throw new HttpsError('internal', 'Failed to create session');
    }
  }
);

// Legacy function for backward compatibility
export const createSession = onCall(
  { cors: true },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { deviceId, userAgent } = request.data;

    // Validate required fields
    if (!deviceId) {
      throw new HttpsError('invalid-argument', 'Missing device ID');
    }

    try {
      const db = getFirestore();
      const now = Timestamp.now();
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

    } catch (error) {
      console.error('Error creating legacy session:', error);
      throw new HttpsError('internal', 'Failed to create session');
    }
  }
);

// Function to detect user location (for consent requirements)
export const detectUserLocation = onCall(
  { cors: true },
  async (request) => {
    try {
      // Get client IP address
      const rawIP = request.rawRequest.ip ||
                   request.rawRequest.headers['x-forwarded-for'] ||
                   request.rawRequest.connection?.remoteAddress ||
                   'unknown';
      
      const ipAddress = Array.isArray(rawIP) ? rawIP[0] : rawIP;

      const { location: locationData } = await getLocationAndNetworkFromIP(ipAddress);

      return {
        success: true,
        ...locationData
      };

    } catch (error) {
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
  }
);