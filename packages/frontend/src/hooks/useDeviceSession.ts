import { useState, useEffect, useCallback } from 'react';
import { deviceService, type UserDevice } from '../services/deviceService';
import { sessionService, type UserSession } from '../services/sessionService';
import { authService } from '../services/authService';

export interface DeviceSessionState {
  devices: UserDevice[];
  sessions: UserSession[];
  currentDeviceId: string | null;
  currentSessionId: string | null;
  isHeartbeatRunning: boolean;
  loading: boolean;
  error: string | null;
}

export const useDeviceSession = () => {
  const [state, setState] = useState<DeviceSessionState>({
    devices: [],
    sessions: [],
    currentDeviceId: null,
    currentSessionId: null,
    isHeartbeatRunning: false,
    loading: false,
    error: null,
  });

  // Load devices and sessions
  const loadDevicesAndSessions = useCallback(async () => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      setState(prev => ({
        ...prev,
        devices: [],
        sessions: [],
        currentDeviceId: null,
        currentSessionId: null,
        isHeartbeatRunning: false,
        error: null,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [devices, sessions] = await Promise.all([
        deviceService.getUserDevices(),
        sessionService.getUserSessions(),
      ]);

      setState(prev => ({
        ...prev,
        devices,
        sessions,
        currentDeviceId: deviceService.getDeviceId(),
        currentSessionId: sessionService.getCurrentSessionId(),
        isHeartbeatRunning: sessionService.isHeartbeatRunning(),
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to load devices and sessions:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  }, []);

  // Register a new device
  const registerDevice = useCallback(async (fcmToken?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await deviceService.registerDevice(fcmToken);
      await loadDevicesAndSessions(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to register device:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to register device',
      }));
    }
  }, [loadDevicesAndSessions]);

  // Update FCM token
  const updateFCMToken = useCallback(async (fcmToken: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await deviceService.updateFCMToken(fcmToken);
      await loadDevicesAndSessions(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to update FCM token:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update FCM token',
      }));
    }
  }, [loadDevicesAndSessions]);

  // Start session tracking
  const startSessionTracking = useCallback(async () => {
    try {
      await sessionService.initializeSession();
      setState(prev => ({
        ...prev,
        currentSessionId: sessionService.getCurrentSessionId(),
        isHeartbeatRunning: sessionService.isHeartbeatRunning(),
      }));
    } catch (error) {
      console.error('Failed to start session tracking:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start session tracking',
      }));
    }
  }, []);

  // Stop session tracking
  const stopSessionTracking = useCallback(() => {
    sessionService.clearSession();
    setState(prev => ({
      ...prev,
      currentSessionId: null,
      isHeartbeatRunning: false,
    }));
  }, []);

  // Manual heartbeat update
  const updateHeartbeat = useCallback(async () => {
    try {
      await sessionService.updateHeartbeat();
    } catch (error) {
      console.error('Failed to update heartbeat:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update heartbeat',
      }));
    }
  }, []);

  // Get current device info
  const getCurrentDeviceInfo = useCallback(() => {
    return deviceService.getCurrentDeviceInfo();
  }, []);

  // Get active devices (devices seen in the last 30 days)
  const getActiveDevices = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return state.devices.filter(device => {
      const lastSeen = new Date(device.lastSeenAt);
      return lastSeen > thirtyDaysAgo;
    });
  }, [state.devices]);

  // Get active sessions (sessions seen in the last 24 hours)
  const getActiveSessions = useCallback(() => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return state.sessions.filter(session => {
      const lastSeen = new Date(session.lastSeenAt);
      return lastSeen > twentyFourHoursAgo;
    });
  }, [state.sessions]);

  // Load data when component mounts or user changes
  useEffect(() => {
    loadDevicesAndSessions();
  }, [loadDevicesAndSessions]);

  // Set up auth state listener to handle login/logout
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (user) {
        // User logged in, load their devices and sessions
        loadDevicesAndSessions();
      } else {
        // User logged out, clear state
        setState({
          devices: [],
          sessions: [],
          currentDeviceId: null,
          currentSessionId: null,
          isHeartbeatRunning: false,
          loading: false,
          error: null,
        });
      }
    });

    return unsubscribe;
  }, [loadDevicesAndSessions]);

  return {
    // State
    ...state,
    
    // Computed values
    activeDevices: getActiveDevices(),
    activeSessions: getActiveSessions(),
    
    // Actions
    loadDevicesAndSessions,
    registerDevice,
    updateFCMToken,
    startSessionTracking,
    stopSessionTracking,
    updateHeartbeat,
    getCurrentDeviceInfo,
    
    // Utilities
    getActiveDevices,
    getActiveSessions,
  };
};

export default useDeviceSession;