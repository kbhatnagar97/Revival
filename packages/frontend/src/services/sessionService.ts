import { apiService } from './apiService';
import { deviceService } from './deviceService';
import { authService } from './authService';

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
  sessionStart: string;
  lastSeenAt: string;
  sessionEnd: string | null;
  createdAt?: string; // For backward compatibility
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
    // Check if user is authenticated
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to create session');
    }

    try {
      const deviceId = deviceService.getDeviceId();
      const browserInfo = this.getBrowserInfo();
      const orientation = this.getOrientation();
      const security = this.getSecurityContext();
      
      const result = await apiService.callFunction<{ success: boolean; sessionId: string }>('createSessionEnhanced', {
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
    // Check if user is authenticated
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      console.log('User not authenticated, skipping heartbeat update');
      return;
    }

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
   * End the current session properly. Local cleanup first, then server call if authenticated.
   */
  async endSession(): Promise<void> {
    if (!this.currentSessionId) {
      console.log('No active session to end');
      return;
    }

    // Capture and clear immediately to avoid duplicate endings in concurrent flows
    const sessionId = this.currentSessionId;
    console.log('Ending session:', sessionId);

    // Local cleanup first
    this.stopHeartbeat();
    this.currentSessionId = null;
    this.clearSessionFromStorage();
    console.log('Session ended and cleared locally');

    // If user is no longer authenticated, skip server call to avoid 401
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      console.log('User not authenticated, skipping server endSession call');
      return;
    }

    try {
      await apiService.callFunction('endSession', { sessionId });
      console.log('Session ended successfully on server');
    } catch (error) {
      console.error('Failed to end session on server:', error);
      // Already cleaned up locally; nothing more to do
    }
  }

  /**
   * Clear the current session (on logout) - now calls endSession
   */
  clearSession(): void {
    // For immediate cleanup (like logout), we'll do synchronous cleanup
    // but also try to end the session on the server
    if (this.currentSessionId) {
      // Fire and forget the server call
      this.endSession().catch(error => {
        console.warn('Failed to end session on server during clearSession:', error);
      });
    } else {
      this.stopHeartbeat();
      this.clearSessionFromStorage();
      console.log('Session cleared');
    }
  }

  /**
   * Initialize session on login or app startup
   */
  async initializeSession(): Promise<void> {
    // Check if user is authenticated
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      console.log('User not authenticated, skipping session initialization');
      return;
    }

    // Prevent duplicate initialization
    if (this.heartbeatInterval) {
      console.log('Session already initialized with active heartbeat, skipping');
      return;
    }

    try {
      console.log('Initializing session...');
      
      // Check if there's a stored session from a previous app session
      const restoredSessionId = this.loadSessionFromStorage();
      if (restoredSessionId) {
        console.log('Found stored session from previous app session:', restoredSessionId);
        
        // End the previous session first (it should be marked as ended since user closed the app)
        try {
          await apiService.callFunction('endSession', {
            sessionId: restoredSessionId
          });
          console.log('Ended previous session:', restoredSessionId);
        } catch (error) {
          console.warn('Failed to end previous session (may already be ended):', error);
        }
        
        // Clear the old session from storage
        this.clearSessionFromStorage();
      }
      
      // Always create a new session when initializing (new app session)
      await this.createSession();
      console.log('Created new session for this app session');
      
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
    // Check if user is authenticated before handling visibility changes
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      console.log('User not authenticated, skipping visibility change handling');
      return;
    }

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

// Set up beforeunload listener to properly end session on page close
window.addEventListener('beforeunload', () => {
  // Use sendBeacon for reliable session ending during page unload
  const currentSessionId = sessionManager.getCurrentSessionId();
  if (currentSessionId) {
    try {
      // Try to end session via beacon (more reliable during unload)
      const endSessionData = JSON.stringify({
        data: { sessionId: currentSessionId }
      });
      
      // This is a simplified approach - in a real implementation you'd need the proper Firebase callable endpoint
      navigator.sendBeacon('/api/endSession', endSessionData);
    } catch (error) {
      console.warn('Failed to send session end beacon:', error);
    }
  }
  
  sessionManager.stopHeartbeat();
});

// Also handle visibility change to end session when tab becomes hidden for extended periods
let hiddenTimer: NodeJS.Timeout | null = null;
const HIDDEN_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Start timer to end session if hidden for too long
    hiddenTimer = setTimeout(async () => {
      console.log('Tab hidden for extended period, ending session');
      await sessionManager.endSession();
    }, HIDDEN_SESSION_TIMEOUT);
  } else {
    // Clear timer if tab becomes visible again
    if (hiddenTimer) {
      clearTimeout(hiddenTimer);
      hiddenTimer = null;
    }
    // Handle visibility change as before
    sessionManager.handleVisibilityChange();
  }
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
   * End current session properly
   */
  endSession: () => sessionManager.endSession(),

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