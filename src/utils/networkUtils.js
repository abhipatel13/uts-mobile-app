/**
 * Network Utilities
 * Basic network connectivity functions
 */

/**
 * Test network connectivity with a simple ping
 * @returns {Promise<boolean>} True if network is reachable
 */
export const testNetworkConnectivity = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default {
  testNetworkConnectivity
};