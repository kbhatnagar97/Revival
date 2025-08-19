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
  
  // Extract OS name and version with enhanced detection
  let osName = 'Unidentified OS';
  let osVersion = 'Platform: ' + (navigator.platform || 'unknown');
  
  if (userAgent.includes('Windows')) {
    osName = 'Windows';
    const match = userAgent.match(/Windows NT ([\d.]+)/);
    if (match) {
      const version = match[1];
      // Map NT versions to user-friendly names with architecture
      const arch = /WOW64/.test(userAgent) ? ' (32-bit on 64-bit)' : /Win64/.test(userAgent) ? ' (64-bit)' : '';
      switch (version) {
        case '10.0':
          // Try to detect Windows 11
          if (/Edg\//.test(userAgent) && /Win64; x64/.test(userAgent)) {
            osVersion = '10/11' + arch;
          } else {
            osVersion = '10' + arch;
          }
          break;
        case '6.3': osVersion = '8.1' + arch; break;
        case '6.2': osVersion = '8' + arch; break;
        case '6.1': osVersion = '7' + arch; break;
        case '6.0': osVersion = 'Vista' + arch; break;
        case '5.1': osVersion = 'XP'; break;
        case '5.0': osVersion = '2000'; break;
        default: osVersion = 'NT ' + version + arch;
      }
    } else {
      osVersion = '9x/ME or Legacy';
    }
  } else if (userAgent.includes('Mac OS')) {
    osName = 'macOS';
    const match = userAgent.match(/Mac OS X ([\d_]+)/);
    if (match) {
      const version = match[1].replace(/_/g, '.');
      const parts = version.split('.');
      const major = parseInt(parts[1]);
      
      // Map to macOS version names
      const versionNames: { [key: number]: string } = {
        15: 'Catalina',
        14: 'Mojave',
        13: 'High Sierra',
        12: 'Sierra',
        11: 'El Capitan',
        10: 'Yosemite'
      };
      
      const versionName = versionNames[major];
      osVersion = versionName ? `${versionName} (${version})` : version;
    } else {
      // Check for modern macOS versions
      const modernMatch = userAgent.match(/Mac OS X (\d+\.\d+)/);
      if (modernMatch) {
        const version = modernMatch[1];
        const major = parseInt(version.split('.')[0]);
        const modernNames: { [key: number]: string } = {
          13: 'Ventura',
          12: 'Monterey',
          11: 'Big Sur'
        };
        const versionName = modernNames[major];
        osVersion = versionName ? `${versionName} (${version})` : version;
      } else {
        osVersion = 'Darwin-based System';
      }
    }
  } else if (userAgent.includes('Linux') && !userAgent.includes('Android')) {
    // Try to detect specific Linux distributions
    if (userAgent.includes('Ubuntu')) {
      osName = 'Ubuntu Linux';
      const ubuntuMatch = userAgent.match(/Ubuntu\/(\d+\.\d+)/);
      osVersion = ubuntuMatch ? ubuntuMatch[1] + ' LTS' : 'Distribution';
    } else if (userAgent.includes('Fedora')) {
      osName = 'Fedora Linux';
      osVersion = 'Workstation';
    } else if (userAgent.includes('SUSE')) {
      osName = 'SUSE Linux';
      osVersion = 'Enterprise';
    } else if (userAgent.includes('Red Hat')) {
      osName = 'Red Hat Enterprise Linux';
      osVersion = 'RHEL';
    } else if (userAgent.includes('CentOS')) {
      osName = 'CentOS Linux';
      osVersion = 'Server';
    } else if (userAgent.includes('Debian')) {
      osName = 'Debian Linux';
      osVersion = 'Stable';
    } else {
      osName = 'Linux';
      const arch = /x86_64/.test(userAgent) ? ' (64-bit)' : /i686/.test(userAgent) ? ' (32-bit)' : '';
      osVersion = 'Distribution' + arch;
    }
  } else if (userAgent.includes('Android')) {
    osName = 'Android';
    const match = userAgent.match(/Android ([\d.]+)/);
    if (match) {
      const version = match[1];
      const major = parseInt(version.split('.')[0]);
      
      // Map Android versions to names
      const androidNames: { [key: number]: string } = {
        13: 'Tiramisu',
        12: 'Snow Cone',
        11: 'Red Velvet Cake',
        10: 'Quince Tart',
        9: 'Pie',
        8: 'Oreo',
        7: 'Nougat',
        6: 'Marshmallow',
        5: 'Lollipop',
        4: 'KitKat/Jelly Bean'
      };
      
      const versionName = androidNames[major];
      osVersion = versionName ? `${version} ${versionName}` : version;
    } else {
      osVersion = 'Mobile Device';
    }
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    osName = 'iOS';
    const match = userAgent.match(/OS ([\d_]+)/);
    if (match) {
      const version = match[1].replace(/_/g, '.');
      const deviceType = userAgent.includes('iPhone') ? ' iPhone' : userAgent.includes('iPad') ? ' iPad' : ' iPod';
      osVersion = version + deviceType;
    } else {
      osVersion = userAgent.includes('iPhone') ? 'iPhone' : userAgent.includes('iPad') ? 'iPad' : 'iPod Touch';
    }
  } else if (userAgent.includes('CrOS')) {
    osName = 'Chrome OS';
    const match = userAgent.match(/CrOS ([^\s]+) ([\d.]+)/);
    if (match) {
      const arch = match[1];
      const version = match[2];
      osVersion = `${version} (${arch})`;
    } else {
      osVersion = 'Chromebook';
    }
  } else if (userAgent.includes('FreeBSD')) {
    osName = 'FreeBSD';
    const match = userAgent.match(/FreeBSD\/(\d+\.\d+)/);
    osVersion = match ? match[1] + ' Unix-like' : 'Unix-like System';
  } else if (userAgent.includes('OpenBSD')) {
    osName = 'OpenBSD';
    osVersion = 'Unix-like System';
  } else if (userAgent.includes('NetBSD')) {
    osName = 'NetBSD';
    osVersion = 'Unix-like System';
  } else if (userAgent.includes('SunOS')) {
    osName = 'Solaris';
    osVersion = 'Unix System';
  } else if (userAgent.includes('AIX')) {
    osName = 'IBM AIX';
    osVersion = 'Unix System';
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
  
  // Windows detection - Enhanced with more versions and build detection
  if (/Windows NT 10.0/.test(userAgent)) {
    // Try to detect Windows 11 more accurately
    const buildMatch = userAgent.match(/Windows NT 10\.0; Win64; x64.*rv:(\d+)/);
    if (buildMatch && parseInt(buildMatch[1]) >= 91) {
      return { name: "Windows", version: "11 (Build 22000+)" };
    }
    
    // Check for Windows 11 indicators
    if (/Windows NT 10.0.*Edg\//.test(userAgent) && /Win64; x64/.test(userAgent)) {
      return { name: "Windows", version: "10/11 (x64)" };
    }
    
    // Detect architecture
    if (/WOW64/.test(userAgent)) {
      return { name: "Windows", version: "10 (32-bit on 64-bit)" };
    } else if (/Win64; x64/.test(userAgent)) {
      return { name: "Windows", version: "10 (64-bit)" };
    } else if (/ARM64/.test(userAgent)) {
      return { name: "Windows", version: "10 (ARM64)" };
    }
    
    return { name: "Windows", version: "10" };
  }
  if (/Windows NT 6.3/.test(userAgent)) {
    const arch = /WOW64/.test(userAgent) ? " (32-bit on 64-bit)" : /Win64/.test(userAgent) ? " (64-bit)" : "";
    return { name: "Windows", version: `8.1${arch}` };
  }
  if (/Windows NT 6.2/.test(userAgent)) return { name: "Windows", version: "8" };
  if (/Windows NT 6.1/.test(userAgent)) {
    const arch = /WOW64/.test(userAgent) ? " (32-bit on 64-bit)" : /Win64/.test(userAgent) ? " (64-bit)" : "";
    return { name: "Windows", version: `7${arch}` };
  }
  if (/Windows NT 6.0/.test(userAgent)) return { name: "Windows", version: "Vista" };
  if (/Windows NT 5.1/.test(userAgent)) return { name: "Windows", version: "XP" };
  if (/Windows NT 5.0/.test(userAgent)) return { name: "Windows", version: "2000" };
  if (/Windows/.test(userAgent)) return { name: "Windows", version: "9x/ME" };
  
  // macOS detection - Enhanced with version mapping and architecture
  const macMatch = userAgent.match(/Mac OS X 10[._](\d+)[._]?(\d+)?/);
  if (macMatch) {
    const major = parseInt(macMatch[1]);
    const minor = macMatch[2] ? parseInt(macMatch[2]) : 0;
    
    // Map to actual macOS version names
    const versionMap: { [key: number]: string } = {
      15: "Catalina",
      14: "Mojave",
      13: "High Sierra",
      12: "Sierra",
      11: "El Capitan",
      10: "Yosemite",
      9: "Mavericks",
      8: "Mountain Lion",
      7: "Lion"
    };
    
    const versionName = versionMap[major] || `10.${major}`;
    const fullVersion = minor > 0 ? `${versionName} (10.${major}.${minor})` : versionName;
    
    // Detect Apple Silicon
    if (/Intel/.test(userAgent)) {
      return { name: "macOS", version: `${fullVersion} Intel` };
    } else if (/PPC/.test(userAgent)) {
      return { name: "macOS", version: `${fullVersion} PowerPC` };
    }
    
    return { name: "macOS", version: fullVersion };
  }
  
  // Check for newer macOS versions (Big Sur 11.0+, Monterey 12.0+, etc.)
  const modernMacMatch = userAgent.match(/Mac OS X (\d+)[._](\d+)[._]?(\d+)?/);
  if (modernMacMatch) {
    const major = parseInt(modernMacMatch[1]);
    const minor = parseInt(modernMacMatch[2]);
    const patch = modernMacMatch[3] ? parseInt(modernMacMatch[3]) : 0;
    
    const modernVersionMap: { [key: number]: string } = {
      13: "Ventura",
      12: "Monterey",
      11: "Big Sur"
    };
    
    const versionName = modernVersionMap[major] || `macOS ${major}`;
    return { name: "macOS", version: `${versionName} (${major}.${minor}${patch ? '.' + patch : ''})` };
  }
  
  // Generic Mac detection
  if (/Macintosh/.test(userAgent) || /Mac OS/.test(userAgent)) {
    const arch = /Intel/.test(userAgent) ? " Intel" : /PPC/.test(userAgent) ? " PowerPC" : "";
    return { name: "macOS", version: `Modern${arch}` };
  }
  
  // iOS detection - Enhanced with device type
  const iosMatch = userAgent.match(/OS (\d+)[._](\d+)[._]?(\d+)?/);
  if (iosMatch) {
    const major = iosMatch[1];
    const minor = iosMatch[2];
    const patch = iosMatch[3] || "0";
    
    let deviceType = "";
    if (/iPhone/.test(userAgent)) deviceType = " iPhone";
    else if (/iPad/.test(userAgent)) deviceType = " iPad";
    else if (/iPod/.test(userAgent)) deviceType = " iPod";
    
    return { name: "iOS", version: `${major}.${minor}.${patch}${deviceType}` };
  }
  
  // Check for iOS without detailed version info
  if (/iPhone/.test(userAgent)) return { name: "iOS", version: "iPhone" };
  if (/iPad/.test(userAgent)) return { name: "iOS", version: "iPad" };
  if (/iPod/.test(userAgent)) return { name: "iOS", version: "iPod Touch" };
  
  // Android detection - Enhanced with version names and device info
  const androidMatch = userAgent.match(/Android (\d+)\.?(\d+)?\.?(\d+)?/);
  if (androidMatch) {
    const major = parseInt(androidMatch[1]);
    const minor = androidMatch[2] ? parseInt(androidMatch[2]) : 0;
    const patch = androidMatch[3] ? parseInt(androidMatch[3]) : 0;
    
    // Map Android versions to names
    const androidVersionMap: { [key: number]: string } = {
      13: "Tiramisu",
      12: "Snow Cone",
      11: "Red Velvet Cake",
      10: "Quince Tart",
      9: "Pie",
      8: "Oreo",
      7: "Nougat",
      6: "Marshmallow",
      5: "Lollipop",
      4: "KitKat/Jelly Bean/Ice Cream Sandwich"
    };
    
    const versionName = androidVersionMap[major] || `API ${major}`;
    const fullVersion = `${major}.${minor}${patch ? '.' + patch : ''} ${versionName}`;
    
    // Try to extract device model
    const modelMatch = userAgent.match(/\(([^)]+)\)/);
    if (modelMatch) {
      const deviceInfo = modelMatch[1].split(';');
      const model = deviceInfo.find(part =>
        part.trim() &&
        !part.includes('Android') &&
        !part.includes('Mobile') &&
        !part.includes('wv')
      )?.trim();
      
      if (model) {
        return { name: "Android", version: `${fullVersion} (${model})` };
      }
    }
    
    return { name: "Android", version: fullVersion };
  }
  
  // Generic Android detection
  if (/Android/.test(userAgent)) {
    return { name: "Android", version: "Mobile Device" };
  }
  
  // Linux detection - Enhanced with distribution detection
  if (/Linux/.test(userAgent) && !/Android/.test(userAgent)) {
    // Try to detect specific Linux distributions from user agent
    if (/Ubuntu/.test(userAgent)) {
      const ubuntuMatch = userAgent.match(/Ubuntu\/(\d+\.\d+)/);
      return { name: "Ubuntu Linux", version: ubuntuMatch ? ubuntuMatch[1] : "LTS" };
    }
    if (/Fedora/.test(userAgent)) return { name: "Fedora Linux", version: "Workstation" };
    if (/SUSE/.test(userAgent)) return { name: "SUSE Linux", version: "Enterprise" };
    if (/Red Hat/.test(userAgent)) return { name: "Red Hat Enterprise Linux", version: "RHEL" };
    if (/CentOS/.test(userAgent)) return { name: "CentOS Linux", version: "Server" };
    if (/Debian/.test(userAgent)) return { name: "Debian Linux", version: "Stable" };
    if (/Mint/.test(userAgent)) return { name: "Linux Mint", version: "Desktop" };
    if (/Arch/.test(userAgent)) return { name: "Arch Linux", version: "Rolling" };
    
    // Detect architecture
    const arch = /x86_64/.test(userAgent) ? " (64-bit)" : /i686/.test(userAgent) ? " (32-bit)" : /aarch64/.test(userAgent) ? " (ARM64)" : "";
    return { name: "Linux", version: `Distribution${arch}` };
  }
  
  // Chrome OS detection - Enhanced
  if (/CrOS/.test(userAgent)) {
    const crosMatch = userAgent.match(/CrOS ([^\s]+) ([\d.]+)/);
    if (crosMatch) {
      const arch = crosMatch[1];
      const version = crosMatch[2];
      return { name: "Chrome OS", version: `${version} (${arch})` };
    }
    return { name: "Chrome OS", version: "Chromebook" };
  }
  
  // BSD variants
  if (/FreeBSD/.test(userAgent)) {
    const bsdMatch = userAgent.match(/FreeBSD\/(\d+\.\d+)/);
    return { name: "FreeBSD", version: bsdMatch ? bsdMatch[1] : "Unix-like" };
  }
  if (/OpenBSD/.test(userAgent)) return { name: "OpenBSD", version: "Unix-like" };
  if (/NetBSD/.test(userAgent)) return { name: "NetBSD", version: "Unix-like" };
  
  // Unix variants
  if (/SunOS/.test(userAgent)) return { name: "Solaris", version: "Unix System" };
  if (/AIX/.test(userAgent)) return { name: "IBM AIX", version: "Unix System" };
  
  // Fallback detection based on platform indicators
  if (/Windows/.test(userAgent)) return { name: "Windows", version: "NT-based" };
  if (/Mac/.test(userAgent)) return { name: "macOS", version: "Darwin-based" };
  if (/X11/.test(userAgent)) return { name: "Unix-like", version: "X11 System" };
  
  // Browser-based OS detection as last resort
  if (/Chrome/.test(userAgent)) {
    const platform = navigator.platform;
    if (platform.includes('Win')) return { name: "Windows", version: "Chrome Platform" };
    if (platform.includes('Mac')) return { name: "macOS", version: "Chrome Platform" };
    if (platform.includes('Linux')) return { name: "Linux", version: "Chrome Platform" };
  }
  
  // Final fallback with platform information
  const platform = navigator.platform || "unknown";
  return { name: "Unidentified OS", version: `Platform: ${platform}` };
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
  // Network information will be populated by the backend during session creation
  // Frontend doesn't need to make external API calls that cause CORS issues
  return {};
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
    const result = await apiService.callFunction<unknown>('getUserDevices');
    // Backend currently returns an array; handle both array and { devices } shapes
    if (Array.isArray(result)) {
      return result as UserDevice[];
    }
    const obj = result as { devices?: UserDevice[] };
    return obj.devices || [];
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