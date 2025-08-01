/**
 * Browser compatibility utilities for handling Safari and other browser-specific issues
 */

export interface BrowserInfo {
  name: string;
  version: string;
  isSafari: boolean;
  isIOS: boolean;
  isMobile: boolean;
  supportsModernFeatures: boolean;
}

/**
 * Detect browser information and capabilities
 */
export const getBrowserInfo = (): BrowserInfo => {
  const userAgent = navigator.userAgent;
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  let name = 'Unknown';
  let version = 'Unknown';
  
  if (userAgent.includes('Chrome')) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/([\d.]+)/);
    version = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/([\d.]+)/);
    version = match ? match[1] : 'Unknown';
  } else if (isSafari) {
    name = 'Safari';
    const match = userAgent.match(/Version\/([\d.]+)/);
    version = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Edge')) {
    name = 'Edge';
    const match = userAgent.match(/Edge\/([\d.]+)/);
    version = match ? match[1] : 'Unknown';
  }
  
  // Check for modern feature support
  const supportsModernFeatures = !!(
    window.Intl &&
    window.Intl.DateTimeFormat &&
    typeof window.Intl.DateTimeFormat().resolvedOptions === 'function' &&
    typeof window.btoa === 'function' &&
    typeof Array.prototype.includes === 'function' &&
    typeof String.prototype.substring === 'function'
  );
  
  return {
    name,
    version,
    isSafari,
    isIOS,
    isMobile,
    supportsModernFeatures
  };
};

/**
 * Safely get timezone with fallbacks for older browsers
 */
export const getTimezone = (): string => {
  try {
    if (window.Intl && window.Intl.DateTimeFormat && typeof window.Intl.DateTimeFormat().resolvedOptions === 'function') {
      return window.Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    }
  } catch (error) {
    console.warn('Timezone detection failed:', error);
  }
  
  // Fallback: try to detect timezone from date
  try {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const hours = Math.abs(Math.floor(offset / 60));
    const minutes = Math.abs(offset % 60);
    const sign = offset <= 0 ? '+' : '-';
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('Fallback timezone detection failed:', error);
    return 'UTC';
  }
};

/**
 * Safely encode string to base64 with fallback
 */
export const safeBase64Encode = (str: string): string => {
  try {
    if (window.btoa) {
      return window.btoa(str);
    }
  } catch (error) {
    console.warn('Base64 encoding failed:', error);
  }
  
  // Simple fallback encoding (not actual base64, but consistent)
  return str.split('').map(char => char.charCodeAt(0).toString(16)).join('');
};

/**
 * Get safe substring (handles deprecated substr)
 */
export const safeSubstring = (str: string, start: number, length?: number): string => {
  if (typeof length === 'number') {
    return str.substring(start, start + length);
  }
  return str.substring(start);
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get safe screen information
 */
export const getScreenInfo = (): string => {
  try {
    const width = window.screen?.width || window.innerWidth || 1920;
    const height = window.screen?.height || window.innerHeight || 1080;
    const colorDepth = window.screen?.colorDepth || 24;
    return `${width}x${height}x${colorDepth}`;
  } catch (error) {
    console.warn('Screen info detection failed:', error);
    return '1920x1080x24';
  }
};

/**
 * Apply Safari-specific fixes
 */
export const applySafariFixes = (): void => {
  const browserInfo = getBrowserInfo();
  
  if (browserInfo.isSafari || browserInfo.isIOS) {
    // Add Safari-specific CSS class
    document.documentElement.classList.add('safari-browser');
    
    if (browserInfo.isIOS) {
      document.documentElement.classList.add('ios-device');
    }
    
    // Fix viewport issues on iOS Safari
    if (browserInfo.isIOS) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }
    }
    
    // Add touch-action CSS for better touch handling
    if (isTouchDevice()) {
      document.documentElement.style.touchAction = 'manipulation';
    }
  }
};

/**
 * Initialize browser compatibility fixes
 */
export const initBrowserCompatibility = (): void => {
  // Apply fixes when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySafariFixes);
  } else {
    applySafariFixes();
  }
  
  // Log browser info for debugging
  const browserInfo = getBrowserInfo();
  console.log('Browser compatibility info:', browserInfo);
};