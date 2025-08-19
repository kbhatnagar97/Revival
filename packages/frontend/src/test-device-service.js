// Simple test script to verify device service functionality
// This can be run in the browser console to test device ID generation

console.log('=== Device Service Test ===');

// Simulate the device ID generation logic
const testDeviceIdGeneration = () => {
  console.log('Testing device ID generation...');
  
  // Clear any existing device ID to test fresh generation
  localStorage.removeItem('revival_device_id');
  
  // Test the fingerprinting logic
  const userAgent = navigator.userAgent;
  const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  
  console.log('Browser fingerprint components:');
  console.log('- User Agent:', userAgent);
  console.log('- Screen Info:', screenInfo);
  console.log('- Timezone:', timezone);
  console.log('- Language:', language);
  
  // Create fingerprint
  const fingerprint = btoa(`${userAgent}-${screenInfo}-${timezone}-${language}`)
    .replace(/[+/=]/g, '')
    .substring(0, 16);
  
  console.log('- Generated Fingerprint:', fingerprint);
  
  // Generate device ID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  const deviceId = `device_${fingerprint}_${timestamp}_${random}`;
  
  console.log('- Generated Device ID:', deviceId);
  
  // Store it
  localStorage.setItem('revival_device_id', deviceId);
  
  // Test retrieval
  const retrievedId = localStorage.getItem('revival_device_id');
  console.log('- Retrieved Device ID:', retrievedId);
  
  console.log('Device ID generation test completed!');
  return deviceId;
};

// Test device info consistency
const testDeviceInfoConsistency = () => {
  console.log('Testing device info consistency...');
  
  // Simulate device info
  const deviceInfo1 = {
    type: 'web',
    osName: 'Linux',
    osVersion: '6.14',
    deviceModel: 'Chrome'
  };
  
  const deviceInfo2 = {
    type: 'web',
    osName: 'Linux',
    osVersion: '6.14',
    deviceModel: 'Chrome'
  };
  
  const deviceInfo3 = {
    type: 'web',
    osName: 'Linux',
    osVersion: '6.15', // Different version
    deviceModel: 'Chrome'
  };
  
  // Test comparison logic
  const hasChanged1 = (
    deviceInfo1.type !== deviceInfo2.type ||
    deviceInfo1.osName !== deviceInfo2.osName ||
    deviceInfo1.osVersion !== deviceInfo2.osVersion ||
    deviceInfo1.deviceModel !== deviceInfo2.deviceModel
  );
  
  const hasChanged2 = (
    deviceInfo1.type !== deviceInfo3.type ||
    deviceInfo1.osName !== deviceInfo3.osName ||
    deviceInfo1.osVersion !== deviceInfo3.osVersion ||
    deviceInfo1.deviceModel !== deviceInfo3.deviceModel
  );
  
  console.log('- Same device info changed?', hasChanged1); // Should be false
  console.log('- Different device info changed?', hasChanged2); // Should be true
  
  console.log('Device info consistency test completed!');
};

// Run tests
testDeviceIdGeneration();
testDeviceInfoConsistency();

console.log('=== All Tests Completed ===');