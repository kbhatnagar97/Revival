import { apiService } from './apiService';
import { deviceService } from './deviceService';

export interface BrowserInfo {
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

export interface SessionLocation {
  ipAddress: string;
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  timezone: string;
  timezoneOffset: number;
}

export interface SessionSecurity {
  httpsSupport: boolean;
  secureContext: boolean;
}

export interface SessionNetwork {
  hostname?: string;
  isp?: string;
  asn?: string;
}

export interface UserSession {
  id: string;
  deviceId: string;
  ipAddress?: string;
  browser: BrowserInfo;
  orientation: 'portrait' | 'landscape';
  location: SessionLocation;
  security: SessionSecurity;
  network: SessionNetwork;
  isActive: boolean;
  lastSeenAt: string;
  createdAt: string;
}

export interface SessionHeartbeatManager {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

class SessionManager {
  private currentSessionId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly SESSION_STORAGE_KEY = 'revival_session_id';
  private readonly SESSION_TIMESTAMP_KEY = 'revival_session_timestamp';
  private readonly SESSION_EXPIRY_HOURS = 24; // Sessions expire after 24 hours of inactivity

  /**
   * Get enhanced browser information
   */
  private getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent;
    
    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';
    
    // Browser detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/([\d.]+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/([\d.]+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Gecko';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/([\d.]+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'WebKit';
    } else if (userAgent.includes('Edge')) {
      name = 'Edge';
      const match = userAgent.match(/Edge\/([\d.]+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'EdgeHTML';
    } else if (userAgent.includes('Edg/')) {
      name = 'Edge';
      const match = userAgent.match(/Edg\/([\d.]+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    }
    
    return {
      name,
      version,
      engine,
      userAgent,
      language: navigator.language,
      languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === "1"
    };
  }

  /**
   * Get current screen orientation
   */
  private getOrientation(): 'portrait' | 'landscape' {
    if (screen.orientation) {
      return screen.orientation.angle === 0 || screen.orientation.angle === 180
        ? 'portrait' : 'landscape';
    }
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  /**
   * Get security context
   */
  private getSecurityContext(): SessionSecurity {
    return {
      httpsSupport: location.protocol === 'https:',
      secureContext: window.isSecureContext || false
    };
  }

  /**
   * Save session ID to localStorage with timestamp
   */
  private saveSessionToStorage(sessionId: string): void {
    try {
      localStorage.setItem(this.SESSION_STORAGE_KEY, sessionId);
      localStorage.setItem(this.SESSION_TIMESTAMP_KEY, new Date().toISOString());
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }
  }

  /**
   * Load session ID from localStorage if still valid
   */
  private loadSessionFromStorage(): string | null {
    try {
      const sessionId = localStorage.getItem(this.SESSION_STORAGE_KEY);
      const timestamp = localStorage.getItem(this.SESSION_TIMESTAMP_KEY);
      
      if (!sessionId || !timestamp) {
        return null;
      }

      // Check if session is still valid (within expiry hours)
      const sessionTime = new Date(timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > this.SESSION_EXPIRY_HOURS) {
        console.log('Stored session expired, will create new session');
        this.clearSessionFromStorage();
        return null;
      }

      console.log('Restored session from storage:', sessionId);
      return sessionId;
    } catch (error) {
      console.warn('Failed to load session from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear session from localStorage
   */
  private clearSessionFromStorage(): void {
    try {
      localStorage.removeItem(this.SESSION_STORAGE_KEY);
      localStorage.removeItem(this.SESSION_TIMESTAMP_KEY);
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error);
    }
  }

  /**
   * Create a new session
   */
  async createSession(): Promise<{ success: boolean; sessionId: string }> {
    try {
      const deviceId = deviceService.getDeviceId();
      const browserInfo = this.getBrowserInfo();
      const orientation = this.getOrientation();
      const security = this.getSecurityContext();
      
      const result = await apiService.callFunction<{ success: boolean; sessionId: string }>('createSession', {
        deviceId,
        browser: browserInfo,
        orientation,
        security,
        // IP address and location will be detected server-side
      });

      this.currentSessionId = result.sessionId;
      this.saveSessionToStorage(result.sessionId);
      console.log('Session created successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Update session heartbeat
   */
  async updateHeartbeat(): Promise<void> {
    // Try to restore session if we don't have one
    if (!this.currentSessionId) {
      const restoredSessionId = this.loadSessionFromStorage();
      if (restoredSessionId) {
        this.currentSessionId = restoredSessionId;
        console.log('Restored session from storage for heartbeat');
      } else {
        console.warn('No active session to update heartbeat for - attempting to create new session');
        try {
          await this.createSession();
          console.log('Created new session for heartbeat');
        } catch (error) {
          console.error('Failed to create session for heartbeat:', error);
          return;
        }
      }
    }

    try {
      const deviceId = deviceService.getDeviceId();
      const orientation = this.getOrientation();
      
      await apiService.callFunction('updateSessionHeartbeat', {
        sessionId: this.currentSessionId,
        deviceId,
        orientation, // Update orientation on each heartbeat
      });

      console.log('Session heartbeat updated successfully');
    } catch (error) {
      console.error('Failed to update session heartbeat:', error);
      
      // If heartbeat fails, the session might be invalid - clear it and try to create a new one
      if (error instanceof Error && error.message.includes('session not found')) {
        console.log('Session not found on server, clearing local session and creating new one');
        this.currentSessionId = null;
        this.clearSessionFromStorage();
        
        try {
          await this.createSession();
          console.log('Created new session after heartbeat failure');
        } catch (createError) {
          console.error('Failed to create new session after heartbeat failure:', createError);
        }
      }
      
      // Don't throw here - heartbeat failures shouldn't break the app
    }
  }

  /**
   * Get all sessions for the current user
   */
  async getUserSessions(): Promise<UserSession[]> {
    try {
      const result = await apiService.callFunction<{ sessions: UserSession[] }>('getUserSessions');
      return result.sessions;
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      throw error;
    }
  }

  /**
   * Start the heartbeat mechanism
   */
  startHeartbeat(): void {
    if (this.heartbeatInterval) {
      console.warn('Heartbeat is already running, skipping duplicate start');
      return;
    }

    console.log('Starting session heartbeat...');

    // Send initial heartbeat
    this.updateHeartbeat();

    // Set up recurring heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.updateHeartbeat();
    }, this.HEARTBEAT_INTERVAL);

    console.log('Session heartbeat started successfully');
  }

  /**
   * Stop the heartbeat mechanism
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('Session heartbeat stopped');
    }
  }

  /**
   * Check if heartbeat is running
   */
  isHeartbeatRunning(): boolean {
    return this.heartbeatInterval !== null;
  }

  /**
   * Get the current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Clear the current session (on logout)
   */
  clearSession(): void {
    this.stopHeartbeat();
    this.currentSessionId = null;
    this.clearSessionFromStorage();
    console.log('Session cleared');
  }

  /**
   * Initialize session on login
   */
  async initializeSession(): Promise<void> {
    // Prevent duplicate initialization
    if (this.heartbeatInterval) {
      console.log('Session already initialized with active heartbeat, skipping');
      return;
    }

    try {
      console.log('Initializing session...');
      
      // Try to restore existing session first
      const restoredSessionId = this.loadSessionFromStorage();
      if (restoredSessionId) {
        this.currentSessionId = restoredSessionId;
        console.log('Restored existing session:', restoredSessionId);
        
        // Verify the session is still valid by sending a heartbeat
        try {
          await this.updateHeartbeat();
          console.log('Restored session is valid');
        } catch (error) {
          console.log('Restored session is invalid, creating new session:', error);
          this.currentSessionId = null;
          this.clearSessionFromStorage();
          await this.createSession();
        }
      } else {
        // Create a new session
        await this.createSession();
      }
      
      // Start heartbeat only if not already running
      if (!this.heartbeatInterval) {
        this.startHeartbeat();
      }
      
      console.log('Session initialized successfully');
    } catch (error) {
      console.error('Failed to initialize session:', error);
      throw error;
    }
  }

  /**
   * Handle page visibility changes to optimize heartbeat
   */
  handleVisibilityChange(): void {
    if (document.hidden) {
      // Page is hidden, we might want to reduce heartbeat frequency
      // For now, we'll keep the same interval
      console.log('Page hidden - session tracking continues');
    } else {
      // Page is visible, send immediate heartbeat
      console.log('Page visible - sending heartbeat');
      this.updateHeartbeat();
    }
  }
}

// Create a singleton instance
const sessionManager = new SessionManager();

// Set up page visibility listener
document.addEventListener('visibilitychange', () => {
  sessionManager.handleVisibilityChange();
});

// Set up beforeunload listener to clean up on page close
window.addEventListener('beforeunload', () => {
  sessionManager.stopHeartbeat();
});

export const sessionService = {
  /**
   * Create a new session
   */
  createSession: () => sessionManager.createSession(),

  /**
   * Update session heartbeat manually
   */
  updateHeartbeat: () => sessionManager.updateHeartbeat(),

  /**
   * Get all user sessions
   */
  getUserSessions: () => sessionManager.getUserSessions(),

  /**
   * Start heartbeat mechanism
   */
  startHeartbeat: () => sessionManager.startHeartbeat(),

  /**
   * Stop heartbeat mechanism
   */
  stopHeartbeat: () => sessionManager.stopHeartbeat(),

  /**
   * Check if heartbeat is running
   */
  isHeartbeatRunning: () => sessionManager.isHeartbeatRunning(),

  /**
   * Get current session ID
   */
  getCurrentSessionId: () => sessionManager.getCurrentSessionId(),

  /**
   * Clear session (on logout)
   */
  clearSession: () => sessionManager.clearSession(),

  /**
   * Initialize session (on login)
   */
  initializeSession: () => sessionManager.initializeSession(),

  /**
   * Get heartbeat manager for advanced control
   */
  getHeartbeatManager: (): SessionHeartbeatManager => ({
    start: () => sessionManager.startHeartbeat(),
    stop: () => sessionManager.stopHeartbeat(),
    isRunning: () => sessionManager.isHeartbeatRunning(),
  }),
};