import { apiService } from './apiService';
import { deviceService } from './deviceService';

export interface UserSession {
  id: string;
  deviceId: string;
  ipAddress?: string;
  location?: string;
  userAgent: string;
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

  /**
   * Create a new session
   */
  async createSession(): Promise<{ success: boolean; sessionId: string }> {
    try {
      const deviceId = deviceService.getDeviceId();
      
      const result = await apiService.callFunction<{ success: boolean; sessionId: string }>('createSession', {
        deviceId,
        userAgent: navigator.userAgent,
        // IP address and location will be detected server-side
      });

      this.currentSessionId = result.sessionId;
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
    if (!this.currentSessionId) {
      console.warn('No active session to update heartbeat for');
      return;
    }

    try {
      const deviceId = deviceService.getDeviceId();
      
      await apiService.callFunction('updateSessionHeartbeat', {
        sessionId: this.currentSessionId,
        deviceId,
      });

      console.log('Session heartbeat updated successfully');
    } catch (error) {
      console.error('Failed to update session heartbeat:', error);
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
      console.warn('Heartbeat is already running');
      return;
    }

    // Send initial heartbeat
    this.updateHeartbeat();

    // Set up recurring heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.updateHeartbeat();
    }, this.HEARTBEAT_INTERVAL);

    console.log('Session heartbeat started');
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
    console.log('Session cleared');
  }

  /**
   * Initialize session on login
   */
  async initializeSession(): Promise<void> {
    try {
      // Create a new session
      await this.createSession();
      
      // Start heartbeat
      this.startHeartbeat();
      
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