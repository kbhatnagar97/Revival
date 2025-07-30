import { apiService } from './apiService';

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
    // Generate a unique device ID
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, deviceId);
  }
  
  return deviceId;
};

export interface DeviceInfo {
  deviceId: string;
  type: 'mobile' | 'web' | 'desktop';
  osName: string;
  osVersion: string;
  deviceModel: string;
  fcmToken?: string;
}

export interface UserDevice {
  id: string;
  type: 'mobile' | 'web' | 'desktop';
  osName: string;
  osVersion: string;
  deviceModel: string;
  fcmToken?: string;
  isActive: boolean;
  lastSeenAt: string;
  registeredAt: string;
}

export const deviceService = {
  /**
   * Get current device information
   */
  getCurrentDeviceInfo: (): DeviceInfo => {
    const osInfo = getOperatingSystem();
    return {
      deviceId: getOrCreateDeviceId(),
      type: getDeviceType(),
      osName: osInfo.osName,
      osVersion: osInfo.osVersion,
      deviceModel: getBrowserInfo(),
      // FCM token would be set separately when push notifications are implemented
      fcmToken: undefined,
    };
  },

  /**
   * Register or update the current device
   */
  registerDevice: async (fcmToken?: string): Promise<{ success: boolean; deviceId: string }> => {
    const deviceInfo = deviceService.getCurrentDeviceInfo();
    
    if (fcmToken) {
      deviceInfo.fcmToken = fcmToken;
    }

    try {
      const result = await apiService.callFunction<{ success: boolean; deviceId: string }>('registerDevice', {
        deviceId: deviceInfo.deviceId,
        type: deviceInfo.type,
        osName: deviceInfo.osName,
        osVersion: deviceInfo.osVersion,
        deviceModel: deviceInfo.deviceModel,
        fcmToken: deviceInfo.fcmToken,
      });

      console.log('Device registered successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to register device:', error);
      throw error;
    }
  },

  /**
   * Get all registered devices for the current user
   */
  getUserDevices: async (): Promise<UserDevice[]> => {
    try {
      const result = await apiService.callFunction<{ devices: UserDevice[] }>('getUserDevices');
      return result.devices;
    } catch (error) {
      console.error('Failed to get user devices:', error);
      throw error;
    }
  },

  /**
   * Update FCM token for push notifications
   */
  updateFCMToken: async (fcmToken: string): Promise<void> => {
    const deviceInfo = deviceService.getCurrentDeviceInfo();
    
    try {
      await apiService.callFunction('registerDevice', {
        deviceId: deviceInfo.deviceId,
        type: deviceInfo.type,
        osName: deviceInfo.osName,
        osVersion: deviceInfo.osVersion,
        deviceModel: deviceInfo.deviceModel,
        fcmToken: fcmToken,
      });

      console.log('FCM token updated successfully');
    } catch (error) {
      console.error('Failed to update FCM token:', error);
      throw error;
    }
  },

  /**
   * Get the current device ID
   */
  getDeviceId: (): string => {
    return getOrCreateDeviceId();
  },
};