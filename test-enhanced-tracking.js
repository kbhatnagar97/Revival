/**
 * Test Script for Enhanced Device and Session Tracking
 * Run this in browser console to test all functionality
 */

// Test Configuration
const TEST_CONFIG = {
  userId: 'test-user-123',
  enableLogging: true
};

// Logging utility
const log = (message, data = null) => {
  if (TEST_CONFIG.enableLogging) {
    console.log(`🧪 [TEST] ${message}`, data || '');
  }
};

// Test Results Storage
const testResults = {
  deviceDetection: {},
  sessionDetection: {},
  consentDetection: {},
  errors: []
};

/**
 * Test Device Detection Capabilities
 */
async function testDeviceDetection() {
  log('Testing Device Detection...');
  
  try {
    // Test hardware detection
    const hardware = {
      screenResolution: `${screen.width}x${screen.height}`,
      pixelRatio: window.devicePixelRatio || 1,
      colorDepth: screen.colorDepth || 24,
      touchSupport: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 1
    };
    
    testResults.deviceDetection.hardware = hardware;
    log('✅ Hardware Detection', hardware);
    
    // Test OS detection
    const userAgent = navigator.userAgent;
    let osName = 'Unknown', osVersion = 'Unknown';
    
    if (/Windows NT 10.0/.test(userAgent)) { osName = "Windows"; osVersion = "10"; }
    else if (/Windows NT 6.3/.test(userAgent)) { osName = "Windows"; osVersion = "8.1"; }
    else if (/Mac OS X 10[._](\d+)/.test(userAgent)) {
      osName = "macOS";
      const match = userAgent.match(/Mac OS X 10[._](\d+)[._]?(\d+)?/);
      osVersion = match ? `10.${match[1]}${match[2] ? '.' + match[2] : ''}` : 'Unknown';
    }
    else if (/iPhone|iPad/.test(userAgent)) {
      osName = "iOS";
      const match = userAgent.match(/OS (\d+)[._](\d+)/);
      osVersion = match ? `${match[1]}.${match[2]}` : 'Unknown';
    }
    else if (/Android/.test(userAgent)) {
      osName = "Android";
      const match = userAgent.match(/Android (\d+\.?\d*)/);
      osVersion = match ? match[1] : 'Unknown';
    }
    
    const os = { name: osName, version: osVersion };
    testResults.deviceDetection.os = os;
    log('✅ OS Detection', os);
    
    // Test capabilities detection
    const capabilities = {
      webGL: !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('webgl'),
      canvas: !!document.createElement('canvas').getContext('2d'),
      localStorage: typeof Storage !== 'undefined' && !!window.localStorage,
      sessionStorage: typeof Storage !== 'undefined' && !!window.sessionStorage,
      indexedDB: !!window.indexedDB,
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      geolocation: 'geolocation' in navigator,
      camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      vibration: 'vibrate' in navigator
    };
    
    testResults.deviceDetection.capabilities = capabilities;
    log('✅ Capabilities Detection', capabilities);
    
    // Test device type detection
    const deviceType = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) 
      ? 'mobile' : 'web';
    
    testResults.deviceDetection.type = deviceType;
    log('✅ Device Type Detection', deviceType);
    
    return true;
  } catch (error) {
    testResults.errors.push(`Device Detection Error: ${error.message}`);
    log('❌ Device Detection Failed', error);
    return false;
  }
}

/**
 * Test Session Detection Capabilities
 */
function testSessionDetection() {
  log('Testing Session Detection...');
  
  try {
    // Test browser detection
    const userAgent = navigator.userAgent;
    let name = 'Unknown', version = 'Unknown', engine = 'Unknown';
    
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
    }
    
    const browser = {
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
    
    testResults.sessionDetection.browser = browser;
    log('✅ Browser Detection', browser);
    
    // Test orientation detection
    const orientation = screen.orientation 
      ? (screen.orientation.angle === 0 || screen.orientation.angle === 180 ? 'portrait' : 'landscape')
      : (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    
    testResults.sessionDetection.orientation = orientation;
    log('✅ Orientation Detection', orientation);
    
    // Test security context
    const security = {
      httpsSupport: location.protocol === 'https:',
      secureContext: window.isSecureContext || false
    };
    
    testResults.sessionDetection.security = security;
    log('✅ Security Context', security);
    
    return true;
  } catch (error) {
    testResults.errors.push(`Session Detection Error: ${error.message}`);
    log('❌ Session Detection Failed', error);
    return false;
  }
}

/**
 * Test Consent Detection
 */
async function testConsentDetection() {
  log('Testing Consent Detection...');
  
  try {
    // Simulate location detection (normally done server-side)
    const mockLocations = [
      { country: 'Germany', countryCode: 'DE', consentRequired: true, type: 'gdpr' },
      { country: 'United States', countryCode: 'US', region: 'California', consentRequired: true, type: 'ccpa' },
      { country: 'India', countryCode: 'IN', consentRequired: false, type: 'none' },
      { country: 'Japan', countryCode: 'JP', consentRequired: false, type: 'none' }
    ];
    
    const GDPR_COUNTRIES = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
    
    mockLocations.forEach(location => {
      let consentRequired = false;
      let consentType = 'none';
      
      if (GDPR_COUNTRIES.includes(location.countryCode)) {
        consentRequired = true;
        consentType = 'gdpr';
      } else if (location.countryCode === 'US' && location.region === 'California') {
        consentRequired = true;
        consentType = 'ccpa';
      }
      
      const result = {
        ...location,
        consentRequired,
        consentType
      };
      
      log(`✅ Consent Logic for ${location.country}`, result);
    });
    
    testResults.consentDetection.mockTests = mockLocations;
    return true;
  } catch (error) {
    testResults.errors.push(`Consent Detection Error: ${error.message}`);
    log('❌ Consent Detection Failed', error);
    return false;
  }
}

/**
 * Test Data Population Rates
 */
function testDataPopulation() {
  log('Testing Data Population Rates...');
  
  const deviceFields = testResults.deviceDetection;
  const sessionFields = testResults.sessionDetection;
  
  // Count populated fields
  const countPopulated = (obj) => {
    let total = 0;
    let populated = 0;
    
    const count = (item) => {
      if (typeof item === 'object' && item !== null) {
        Object.values(item).forEach(count);
      } else {
        total++;
        if (item !== undefined && item !== null && item !== 'Unknown') {
          populated++;
        }
      }
    };
    
    count(obj);
    return { total, populated, percentage: Math.round((populated / total) * 100) };
  };
  
  const deviceStats = countPopulated(deviceFields);
  const sessionStats = countPopulated(sessionFields);
  
  log('✅ Device Field Population', `${deviceStats.populated}/${deviceStats.total} (${deviceStats.percentage}%)`);
  log('✅ Session Field Population', `${sessionStats.populated}/${sessionStats.total} (${sessionStats.percentage}%)`);
  
  testResults.populationStats = { device: deviceStats, session: sessionStats };
  
  return deviceStats.percentage >= 90 && sessionStats.percentage >= 90;
}

/**
 * Test Network Information (Mock)
 */
function testNetworkDetection() {
  log('Testing Network Detection (Mock)...');
  
  try {
    // This would normally be done server-side
    const mockNetworkInfo = {
      hostname: 'user-123.comcast.net',
      isp: 'Comcast Cable Communications',
      asn: 'AS7922 Comcast Cable Communications, LLC'
    };
    
    testResults.networkDetection = mockNetworkInfo;
    log('✅ Network Detection (Mock)', mockNetworkInfo);
    
    return true;
  } catch (error) {
    testResults.errors.push(`Network Detection Error: ${error.message}`);
    log('❌ Network Detection Failed', error);
    return false;
  }
}

/**
 * Run All Tests
 */
async function runAllTests() {
  log('🚀 Starting Enhanced Tracking Tests...');
  
  const tests = [
    { name: 'Device Detection', fn: testDeviceDetection },
    { name: 'Session Detection', fn: testSessionDetection },
    { name: 'Consent Detection', fn: testConsentDetection },
    { name: 'Network Detection', fn: testNetworkDetection },
    { name: 'Data Population', fn: testDataPopulation }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      log(result ? `✅ ${test.name} PASSED` : `❌ ${test.name} FAILED`);
    } catch (error) {
      results.push({ name: test.name, passed: false, error: error.message });
      log(`❌ ${test.name} ERROR: ${error.message}`);
    }
  }
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  log(`\n📊 TEST SUMMARY: ${passed}/${total} tests passed`);
  
  if (testResults.errors.length > 0) {
    log('❌ ERRORS FOUND:', testResults.errors);
  }
  
  log('📋 FULL TEST RESULTS:', testResults);
  
  // Return summary for automated testing
  return {
    passed: passed === total,
    results,
    errors: testResults.errors,
    data: testResults
  };
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
  console.log('🧪 Enhanced Tracking Test Suite Loaded');
  console.log('Run runAllTests() to execute all tests');
  
  // Expose functions globally for manual testing
  window.testEnhancedTracking = {
    runAllTests,
    testDeviceDetection,
    testSessionDetection,
    testConsentDetection,
    testNetworkDetection,
    testDataPopulation,
    results: testResults
  };
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testDeviceDetection,
    testSessionDetection,
    testConsentDetection,
    testNetworkDetection,
    testDataPopulation
  };
}