import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { promisify } from 'util';
import { reverse } from 'dns';

const reverseLookup = promisify(reverse);

interface DeviceHardware {
  screenResolution: string;
  pixelRatio: number;
  colorDepth: number;
  touchSupport: boolean;
  maxTouchPoints: number;
  hardwareConcurrency: number;
}

interface DeviceOS {
  name: string;
  version: string;
}

interface DeviceCapabilities {
  webGL: boolean;
  canvas: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  serviceWorker: boolean;
  pushNotifications: boolean;
  geolocation: boolean;
  camera: boolean;
  microphone: boolean;
  vibration: boolean;
}

interface RegisterDeviceRequest {
  deviceId: string;
  userId: string;
  type: 'mobile' | 'web' | 'desktop';
  deviceModel?: string;
  fcmToken?: string;
  hardware: DeviceHardware;
  os: DeviceOS;
  capabilities: DeviceCapabilities;
  network?: {
    hostname?: string;
    isp?: string;
  };
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
    console.warn(`Failed to get hostname for IP ${ipAddress}:`, error);
    return null;
  }
}

// Helper function to get network info from IP
async function getNetworkInfoFromIP(ipAddress: string) {
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
  } catch (error) {
    console.error('Failed to get network info from IP:', error);
    return {
      hostname: null,
      isp: null
    };
  }
}

export const registerDeviceEnhanced = onCall(
  { cors: true },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const {
      deviceId,
      userId,
      type,
      deviceModel,
      fcmToken,
      hardware,
      os,
      capabilities,
      network
    } = request.data as RegisterDeviceRequest;

    // Validate required fields
    if (!deviceId || !userId || !type || !hardware || !os || !capabilities) {
      throw new HttpsError('invalid-argument', 'Missing required device information');
    }

    // Verify user ID matches authenticated user
    if (request.auth.uid !== userId) {
      throw new HttpsError('permission-denied', 'User ID mismatch');
    }

    try {
      const db = getFirestore();
      const now = Timestamp.now();

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

      const deviceData = {
        deviceId,
        userId,
        type,
        deviceModel: deviceModel || null,
        fcmToken: fcmToken || null,
        hardware,
        os,
        capabilities,
        network: networkInfo,
        lastSeenAt: now,
        ...(existingDevice.exists
          ? { updatedAt: now }
          : { firstRegisteredAt: now, createdAt: now }
        )
      };

      // Save device document
      await deviceRef.set(deviceData, { merge: true });

      console.log(`Device ${deviceId} registered/updated for user ${userId}`);

      return {
        success: true,
        deviceId,
        message: existingDevice.exists ? 'Device updated' : 'Device registered'
      };

    } catch (error) {
      console.error('Error registering device:', error);
      throw new HttpsError('internal', 'Failed to register device');
    }
  }
);

// Legacy function for backward compatibility
export const registerDevice = onCall(
  { cors: true },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const {
      deviceId,
      type,
      osName,
      osVersion,
      deviceModel,
      fcmToken
    } = request.data;

    // Validate required fields
    if (!deviceId || !type) {
      throw new HttpsError('invalid-argument', 'Missing required device information');
    }

    try {
      const db = getFirestore();
      const now = Timestamp.now();
      const userId = request.auth.uid;

      // Check if device already exists
      const deviceRef = db
        .collection('users')
        .doc(userId)
        .collection('devices')
        .doc(deviceId);

      const existingDevice = await deviceRef.get();

      const deviceData = {
        type,
        deviceModel: deviceModel || null,
        osName: osName || 'Unknown',
        osVersion: osVersion || 'Unknown',
        fcmToken: fcmToken || null,
        lastSeenAt: now,
        ...(existingDevice.exists 
          ? {}
          : { firstRegisteredAt: now }
        )
      };

      // Save device document
      await deviceRef.set(deviceData, { merge: true });

      console.log(`Device ${deviceId} registered/updated (legacy) for user ${userId}`);

      return {
        success: true,
        deviceId,
        message: existingDevice.exists ? 'Device updated' : 'Device registered'
      };

    } catch (error) {
      console.error('Error registering device (legacy):', error);
      throw new HttpsError('internal', 'Failed to register device');
    }
  }
);