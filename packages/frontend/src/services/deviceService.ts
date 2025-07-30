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

const getOperatingSystem = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  
  return 'Unknown';
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
  deviceType: 'mobile' | 'web' | 'desktop';
  operatingSystem: string;
  deviceModel: string;
  fcmToken?: string;
}

export interface UserDevice {
  id: string;
  deviceType: 'mobile' | 'web' | 'desktop';
  operatingSystem: string;
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
    return {
      deviceId: getOrCreateDeviceId(),
      deviceType: getDeviceType(),
      operatingSystem: getOperatingSystem(),
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
        deviceType: deviceInfo.deviceType,
        operatingSystem: deviceInfo.operatingSystem,
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
        deviceType: deviceInfo.deviceType,
        operatingSystem: deviceInfo.operatingSystem,
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