import { apiService } from './apiService';
import { getTimezone, safeBase64Encode, safeSubstring, getScreenInfo } from '../utils/browserCompatibility';
import { auth } from '../config/firebase';

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
  let osName = 'Generic OS';
  let osVersion = 'Latest';
  
  if (userAgent.includes('Windows')) {
    osName = 'Windows';
    const match = userAgent.match(/Windows NT ([\d.]+)/);
    if (match) {
      const version = match[1];
      // Map NT versions to user-friendly names
      switch (version) {
        case '10.0': osVersion = '10'; break;
        case '6.3': osVersion = '8.1'; break;
        case '6.2': osVersion = '8'; break;
        case '6.1': osVersion = '7'; break;
        case '6.0': osVersion = 'Vista'; break;
        case '5.1': osVersion = 'XP'; break;
        default: osVersion = version;
      }
    } else {
      osVersion = 'Generic';
    }
  } else if (userAgent.includes('Mac OS')) {
    osName = 'macOS';
    const match = userAgent.match(/Mac OS X ([\d_]+)/);
    osVersion = match ? match[1].replace(/_/g, '.') : 'Latest';
  } else if (userAgent.includes('Linux') && !userAgent.includes('Android')) {
    osName = 'Linux';
    osVersion = 'Generic';
  } else if (userAgent.includes('Android')) {
    osName = 'Android';
    const match = userAgent.match(/Android ([\d.]+)/);
    osVersion = match ? match[1] : 'Latest';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    osName = 'iOS';
    const match = userAgent.match(/OS ([\d_]+)/);
    osVersion = match ? match[1].replace(/_/g, '.') : 'Latest';
  } else if (userAgent.includes('CrOS')) {
    osName = 'Chrome OS';
    const match = userAgent.match(/CrOS [^\s]+ ([\d.]+)/);
    osVersion = match ? match[1] : 'Latest';
  }
  
  return { osName, osVersion };
};

const getBrowserInfo = (): string => {
  const userAgent = navigator.userAgent;
  
  // More specific browser detection
  if (userAgent.includes('Edg/')) return 'Microsoft Edge';
  if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) return 'Google Chrome';
  if (userAgent.includes('Firefox/')) return 'Mozilla Firefox';
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari';
  if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) return 'Opera';
  if (userAgent.includes('Brave/')) return 'Brave';
  if (userAgent.includes('Vivaldi/')) return 'Vivaldi';
  if (userAgent.includes('SamsungBrowser/')) return 'Samsung Internet';
  if (userAgent.includes('UCBrowser/')) return 'UC Browser';
  
  // Fallback detection
  if (userAgent.includes('Chrome')) return 'Chromium-based';
  if (userAgent.includes('Firefox')) return 'Firefox-based';
  if (userAgent.includes('Safari')) return 'WebKit-based';
  if (userAgent.includes('Edge')) return 'Edge-based';
  if (userAgent.includes('Trident/')) return 'Internet Explorer';
  
  // Final fallback
  return 'Generic Browser';
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
  
  // Windows detection - Enhanced with more versions
  if (/Windows NT 10.0/.test(userAgent)) {
    // Check for Windows 11 (build 22000+)
    if (/Windows NT 10.0.*rv:11/.test(userAgent) || /Windows NT 10.0.*Edg\//.test(userAgent)) {
      return { name: "Windows", version: "11" };
    }
    return { name: "Windows", version: "10" };
  }
  if (/Windows NT 6.3/.test(userAgent)) return { name: "Windows", version: "8.1" };
  if (/Windows NT 6.2/.test(userAgent)) return { name: "Windows", version: "8" };
  if (/Windows NT 6.1/.test(userAgent)) return { name: "Windows", version: "7" };
  if (/Windows NT 6.0/.test(userAgent)) return { name: "Windows", version: "Vista" };
  if (/Windows NT 5.1/.test(userAgent)) return { name: "Windows", version: "XP" };
  if (/Windows/.test(userAgent)) return { name: "Windows", version: "Legacy" };
  
  // macOS detection - Enhanced with more versions
  const macMatch = userAgent.match(/Mac OS X 10[._](\d+)[._]?(\d+)?/);
  if (macMatch) {
    const major = parseInt(macMatch[1]);
    const minor = macMatch[2] ? parseInt(macMatch[2]) : 0;
    
    // Map to macOS version names for recent versions
    if (major >= 15) return { name: "macOS", version: `${10 + major}.${minor}` };
    if (major === 14) return { name: "macOS", version: "Mojave" };
    if (major === 13) return { name: "macOS", version: "High Sierra" };
    if (major === 12) return { name: "macOS", version: "Sierra" };
    
    return { name: "macOS", version: `10.${major}${minor ? '.' + minor : ''}` };
  }
  
  // Check for newer macOS versions that don't use the old format
  if (/Macintosh/.test(userAgent) || /Mac OS/.test(userAgent)) {
    return { name: "macOS", version: "Latest" };
  }
  
  // iOS detection - Enhanced
  const iosMatch = userAgent.match(/OS (\d+)[._](\d+)/);
  if (iosMatch) {
    return { name: "iOS", version: `${iosMatch[1]}.${iosMatch[2]}` };
  }
  
  // Check for iOS without version info
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return { name: "iOS", version: "Latest" };
  }
  
  // Android detection - Enhanced
  const androidMatch = userAgent.match(/Android (\d+\.?\d*\.?\d*)/);
  if (androidMatch) {
    return { name: "Android", version: androidMatch[1] };
  }
  
  // Check for Android without version info
  if (/Android/.test(userAgent)) {
    return { name: "Android", version: "Latest" };
  }
  
  // Linux detection - Enhanced
  if (/Linux/.test(userAgent) && !/Android/.test(userAgent)) {
    // Try to detect specific Linux distributions
    if (/Ubuntu/.test(userAgent)) return { name: "Ubuntu", version: "Latest" };
    if (/Fedora/.test(userAgent)) return { name: "Fedora", version: "Latest" };
    if (/SUSE/.test(userAgent)) return { name: "SUSE", version: "Latest" };
    if (/Red Hat/.test(userAgent)) return { name: "Red Hat", version: "Latest" };
    if (/CentOS/.test(userAgent)) return { name: "CentOS", version: "Latest" };
    if (/Debian/.test(userAgent)) return { name: "Debian", version: "Latest" };
    
    return { name: "Linux", version: "Generic" };
  }
  
  // Chrome OS detection
  if (/CrOS/.test(userAgent)) {
    const crosMatch = userAgent.match(/CrOS [^\s]+ ([\d.]+)/);
    return {
      name: "Chrome OS",
      version: crosMatch ? crosMatch[1] : "Latest"
    };
  }
  
  // FreeBSD, OpenBSD, NetBSD
  if (/FreeBSD/.test(userAgent)) return { name: "FreeBSD", version: "Latest" };
  if (/OpenBSD/.test(userAgent)) return { name: "OpenBSD", version: "Latest" };
  if (/NetBSD/.test(userAgent)) return { name: "NetBSD", version: "Latest" };
  
  // Fallback - try to extract any OS info from user agent
  if (/Windows/.test(userAgent)) return { name: "Windows", version: "Generic" };
  if (/Mac/.test(userAgent)) return { name: "macOS", version: "Generic" };
  if (/X11/.test(userAgent)) return { name: "Unix", version: "Generic" };
  
  // Final fallback - use browser info as OS indicator
  if (/Chrome/.test(userAgent)) return { name: "Web Browser", version: "Chrome-based" };
  if (/Firefox/.test(userAgent)) return { name: "Web Browser", version: "Firefox-based" };
  if (/Safari/.test(userAgent)) return { name: "Web Browser", version: "Safari-based" };
  if (/Edge/.test(userAgent)) return { name: "Web Browser", version: "Edge-based" };
  
  // Absolute fallback
  return { name: "Generic OS", version: "Latest" };
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

const getNetworkInfo = async (): Promise<{ hostname?: string; isp?: string }> => {
  try {
    // Try to get network information from FindIP API
    const response = await fetch('https://findip.net/api/v1/ip/me?auth=free');
    const data = await response.json();
    
    if (data.status === 'success' && data.data) {
      return {
        hostname: data.data.organization || data.data.isp || undefined,
        isp: data.data.isp || data.data.organization || undefined
      };
    }
    
    // Fallback to ip-api.com if FindIP fails
    const fallbackResponse = await fetch('http://ip-api.com/json/?fields=org,isp');
    const fallbackData = await fallbackResponse.json();
    
    if (fallbackData.status === 'success') {
      return {
        hostname: fallbackData.org || fallbackData.isp || undefined,
        isp: fallbackData.isp || fallbackData.org || undefined
      };
    }
    
    return {};
  } catch (error) {
    console.warn('Failed to detect network info:', error);
    // Return empty object with undefined values (will be omitted by Firestore)
    return {};
  }
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
    const [capabilities, network] = await Promise.all([
      getDeviceCapabilities(),
      getNetworkInfo()
    ]);
    
    return {
      deviceId: getOrCreateDeviceId(),
      userId,
      type: getDeviceType(),
      deviceModel: getEnhancedDeviceModel(),
      fcmToken: undefined,
      hardware: getEnhancedHardwareInfo(),
      os: getEnhancedOSInfo(),
      capabilities,
      network
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
      network: deviceInfo.network
    });

    // Store the current device info for future comparisons
    localStorage.setItem(lastDeviceInfoKey, JSON.stringify({
      type: deviceInfo.type,
      os: deviceInfo.os,
      deviceModel: deviceInfo.deviceModel,
      hardware: deviceInfo.hardware,
      network: deviceInfo.network,
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
  updateFCMToken: async (fcmToken: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    await deviceService.registerDevice(currentUser.uid, fcmToken);
    // FCM token updated successfully
  },

  /**
   * Get the current device ID
   */
  getDeviceId: (): string => {
    return getOrCreateDeviceId();
  },
};