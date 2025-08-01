import { apiService } from './apiService';
import { getTimezone, safeBase64Encode, safeSubstring, getScreenInfo } from '../utils/browserCompatibility';

// Device type detection utilities
const getDeviceType = (): 'mobile' | 'web' | 'desktop' => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for mobile devices
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'mobile';
  }
  
  // For web browsers, we'll consider it 'web' by default
  // In a real app, you might want more sophisticated detection
  return 'web';
};

const getOperatingSystem = (): { osName: string; osVersion: string } => {
  const userAgent = navigator.userAgent;
  
  // Extract OS name and version
  let osName = 'Unknown';
  let osVersion = 'Unknown';
  
  if (userAgent.includes('Windows')) {
    osName = 'Windows';
    const match = userAgent.match(/Windows NT ([\d.]+)/);
    osVersion = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Mac OS')) {
    osName = 'macOS';
    const match = userAgent.match(/Mac OS X ([\d_]+)/);
    osVersion = match ? match[1].replace(/_/g, '.') : 'Unknown';
  } else if (userAgent.includes('Linux')) {
    osName = 'Linux';
    osVersion = 'Unknown';
  } else if (userAgent.includes('Android')) {
    osName = 'Android';
    const match = userAgent.match(/Android ([\d.]+)/);
    osVersion = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    osName = 'iOS';
    const match = userAgent.match(/OS ([\d_]+)/);
    osVersion = match ? match[1].replace(/_/g, '.') : 'Unknown';
  }
  
  return { osName, osVersion };
};

const getBrowserInfo = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  
  return 'Unknown Browser';
};

// Generate a unique device ID (stored in localStorage)
const getOrCreateDeviceId = (): string => {
  const storageKey = 'revival_device_id';
  let deviceId = localStorage.getItem(storageKey);
  
  if (!deviceId) {
    // Create a more stable device ID based on browser characteristics
    // This helps reduce duplicate devices when localStorage is cleared
    const userAgent = navigator.userAgent;
    const screenInfo = getScreenInfo();
    const timezone = getTimezone();
    const language = navigator.language || 'en-US';
    
    // Create a fingerprint from stable browser characteristics
    const fingerprintData = `${userAgent}-${screenInfo}-${timezone}-${language}`;
    const encodedFingerprint = safeBase64Encode(fingerprintData);
    const fingerprint = encodedFingerprint
      .replace(/[+/=]/g, '') // Remove base64 padding and special chars
      .substring(0, 16); // Take first 16 chars
    
    // Add timestamp and random component for uniqueness
    const timestamp = Date.now().toString(36);
    const random = safeSubstring(Math.random().toString(36), 2, 6);
    
    deviceId = `device_${fingerprint}_${timestamp}_${random}`;
    localStorage.setItem(storageKey, deviceId);
    
    // Device ID generated
  } else {
    // Using existing device ID
  }
  
  return deviceId;
};

export interface DeviceHardware {
  screenResolution: string;
  pixelRatio: number;
  colorDepth: number;
  touchSupport: boolean;
  maxTouchPoints: number;
  hardwareConcurrency: number;
}

export interface DeviceOS {
  name: string;
  version: string;
}

export interface DeviceCapabilities {
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

export interface DeviceNetwork {
  hostname?: string;
  isp?: string;
}

export interface DeviceInfo {
  deviceId: string;
  userId: string;
  type: 'mobile' | 'web' | 'desktop';
  deviceModel?: string;
  fcmToken?: string;
  hardware: DeviceHardware;
  os: DeviceOS;
  capabilities: DeviceCapabilities;
  network: DeviceNetwork;
}

export interface UserDevice {
  id: string;
  type: 'mobile' | 'web' | 'desktop';
  deviceModel?: string;
  fcmToken?: string;
  hardware: DeviceHardware;
  os: DeviceOS;
  capabilities: DeviceCapabilities;
  network: DeviceNetwork;
  isActive: boolean;
  lastSeenAt: string;
  registeredAt: string;
}

// Enhanced detection functions
const getEnhancedHardwareInfo = (): DeviceHardware => {
  return {
    screenResolution: `${screen.width}x${screen.height}`,
    pixelRatio: window.devicePixelRatio || 1,
    colorDepth: screen.colorDepth || 24,
    touchSupport: 'ontouchstart' in window,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    hardwareConcurrency: navigator.hardwareConcurrency || 1
  };
};

const getEnhancedOSInfo = (): DeviceOS => {
  const userAgent = navigator.userAgent;
  
  // Windows detection
  if (/Windows NT 10.0/.test(userAgent)) return { name: "Windows", version: "10" };
  if (/Windows NT 6.3/.test(userAgent)) return { name: "Windows", version: "8.1" };
  if (/Windows NT 6.1/.test(userAgent)) return { name: "Windows", version: "7" };
  
  // macOS detection
  const macMatch = userAgent.match(/Mac OS X 10[._](\d+)[._]?(\d+)?/);
  if (macMatch) {
    return {
      name: "macOS",
      version: `10.${macMatch[1]}${macMatch[2] ? '.' + macMatch[2] : ''}`
    };
  }
  
  // iOS detection
  const iosMatch = userAgent.match(/OS (\d+)[._](\d+)/);
  if (iosMatch) {
    return { name: "iOS", version: `${iosMatch[1]}.${iosMatch[2]}` };
  }
  
  // Android detection
  const androidMatch = userAgent.match(/Android (\d+\.?\d*)/);
  if (androidMatch) {
    return { name: "Android", version: androidMatch[1] };
  }
  
  // Linux detection
  if (/Linux/.test(userAgent) && !/Android/.test(userAgent)) {
    return { name: "Linux", version: "Unknown" };
  }
  
  // Fallback to old method
  const osInfo = getOperatingSystem();
  return { name: osInfo.osName, version: osInfo.osVersion };
};

const getDeviceCapabilities = async (): Promise<DeviceCapabilities> => {
  const capabilities: DeviceCapabilities = {
    webGL: false,
    canvas: false,
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    serviceWorker: false,
    pushNotifications: false,
    geolocation: false,
    camera: false,
    microphone: false,
    vibration: false
  };

  try {
    // WebGL detection
    const canvas = document.createElement('canvas');
    capabilities.webGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    
    // Canvas detection
    capabilities.canvas = !!canvas.getContext('2d');
    
    // Storage detection
    capabilities.localStorage = typeof Storage !== 'undefined' && !!window.localStorage;
    capabilities.sessionStorage = typeof Storage !== 'undefined' && !!window.sessionStorage;
    capabilities.indexedDB = !!window.indexedDB;
    
    // Service Worker detection
    capabilities.serviceWorker = 'serviceWorker' in navigator;
    
    // Push notifications detection
    capabilities.pushNotifications = 'PushManager' in window;
    
    // Geolocation detection
    capabilities.geolocation = 'geolocation' in navigator;
    
    // Vibration detection
    capabilities.vibration = 'vibrate' in navigator;
    
    // Media devices detection (async)
    if (navigator.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        capabilities.camera = devices.some(device => device.kind === 'videoinput');
        capabilities.microphone = devices.some(device => device.kind === 'audioinput');
      } catch (error) {
        console.warn('Failed to detect media devices:', error);
        // Fallback detection
        capabilities.camera = !!navigator.mediaDevices?.getUserMedia;
        capabilities.microphone = !!navigator.mediaDevices?.getUserMedia;
      }
    }
  } catch (error) {
    console.error('Error detecting device capabilities:', error);
  }

  return capabilities;
};

const getEnhancedDeviceModel = (): string | undefined => {
  const userAgent = navigator.userAgent;
  
  // iPhone detection
  if (/iPhone/.test(userAgent)) {
    const match = userAgent.match(/iPhone[^;]*/);
    return match ? match[0] : "iPhone";
  }
  
  // iPad detection
  if (/iPad/.test(userAgent)) return "iPad";
  
  // Android detection
  if (/Android/.test(userAgent)) {
    const match = userAgent.match(/\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(';');
      return parts[1]?.trim() || "Android Device";
    }
  }
  
  // For web browsers, return undefined (will be null in Firestore)
  return undefined;
};

export const deviceService = {
  /**
   * Get current device information with enhanced detection
   */
  getCurrentDeviceInfo: async (userId: string): Promise<DeviceInfo> => {
    const capabilities = await getDeviceCapabilities();
    
    return {
      deviceId: getOrCreateDeviceId(),
      userId,
      type: getDeviceType(),
      deviceModel: getEnhancedDeviceModel(),
      fcmToken: undefined,
      hardware: getEnhancedHardwareInfo(),
      os: getEnhancedOSInfo(),
      capabilities,
      network: {
        // Network info will be populated server-side from IP
        hostname: undefined,
        isp: undefined
      }
    };
  },

  /**
   * Get current device information (legacy method for backward compatibility)
   */
  getCurrentDeviceInfoLegacy: (): Omit<DeviceInfo, 'userId' | 'hardware' | 'os' | 'capabilities'> => {
    return {
      deviceId: getOrCreateDeviceId(),
      type: getDeviceType(),
      deviceModel: getBrowserInfo(),
      fcmToken: undefined,
      network: {
        hostname: undefined,
        isp: undefined
      }
    };
  },

  /**
   * Check if device info has changed since last registration
   */
  hasDeviceInfoChanged: async (lastDeviceInfo?: Partial<DeviceInfo>, userId?: string): Promise<boolean> => {
    if (!lastDeviceInfo || !userId) return true;
    
    const currentInfo = await deviceService.getCurrentDeviceInfo(userId);
    
    return (
      lastDeviceInfo.type !== currentInfo.type ||
      lastDeviceInfo.os?.name !== currentInfo.os.name ||
      lastDeviceInfo.os?.version !== currentInfo.os.version ||
      lastDeviceInfo.deviceModel !== currentInfo.deviceModel ||
      lastDeviceInfo.hardware?.screenResolution !== currentInfo.hardware.screenResolution
    );
  },

  /**
   * Register or update the current device with enhanced data
   */
  registerDevice: async (userId: string, fcmToken?: string, forceUpdate = false): Promise<{ success: boolean; deviceId: string }> => {
    const deviceInfo = await deviceService.getCurrentDeviceInfo(userId);
    
    if (fcmToken) {
      deviceInfo.fcmToken = fcmToken;
    }

    // Check if we need to update (only if forced or device info changed)
    const lastDeviceInfoKey = `revival_last_device_info_${deviceInfo.deviceId}`;
    const lastDeviceInfo = localStorage.getItem(lastDeviceInfoKey);
    
    if (!forceUpdate && lastDeviceInfo) {
      try {
        const parsedLastInfo = JSON.parse(lastDeviceInfo);
        if (!(await deviceService.hasDeviceInfoChanged(parsedLastInfo, userId)) && !fcmToken) {
          return { success: true, deviceId: deviceInfo.deviceId };
        }
      } catch (error) {
        console.warn('Failed to parse last device info, proceeding with registration:', error);
      }
    }

    const result = await apiService.callFunction<{ success: boolean; deviceId: string }>('registerDevice', {
      deviceId: deviceInfo.deviceId,
      userId: deviceInfo.userId,
      type: deviceInfo.type,
      deviceModel: deviceInfo.deviceModel,
      fcmToken: deviceInfo.fcmToken,
      hardware: deviceInfo.hardware,
      os: deviceInfo.os,
      capabilities: deviceInfo.capabilities,
    });

    // Store the current device info for future comparisons
    localStorage.setItem(lastDeviceInfoKey, JSON.stringify({
      type: deviceInfo.type,
      os: deviceInfo.os,
      deviceModel: deviceInfo.deviceModel,
      hardware: deviceInfo.hardware,
      lastRegistered: new Date().toISOString()
    }));

    // Device registered successfully
    return result;
  },

  /**
   * Register device (legacy method for backward compatibility)
   */
  registerDeviceLegacy: async (fcmToken?: string): Promise<{ success: boolean; deviceId: string }> => {
    const deviceInfo = deviceService.getCurrentDeviceInfoLegacy();
    const osInfo = getOperatingSystem();
    
    if (fcmToken) {
      deviceInfo.fcmToken = fcmToken;
    }

    const result = await apiService.callFunction<{ success: boolean; deviceId: string }>('registerDevice', {
      deviceId: deviceInfo.deviceId,
      type: deviceInfo.type,
      osName: osInfo.osName,
      osVersion: osInfo.osVersion,
      deviceModel: deviceInfo.deviceModel,
      fcmToken: deviceInfo.fcmToken,
    });

    // Device registered successfully (legacy)
    return result;
  },

  /**
   * Get all registered devices for the current user
   */
  getUserDevices: async (): Promise<UserDevice[]> => {
    const result = await apiService.callFunction<{ devices: UserDevice[] }>('getUserDevices');
    return result.devices;
  },

  /**
   * Update FCM token for push notifications
   */
  updateFCMToken: async (userId: string, fcmToken: string): Promise<void> => {
    await deviceService.registerDeviceLegacy(fcmToken);
    // FCM token updated successfully
  },

  /**
   * Get the current device ID
   */
  getDeviceId: (): string => {
    return getOrCreateDeviceId();
  },
};