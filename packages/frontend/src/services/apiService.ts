import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

class ApiService {
  /**
   * Call a Firebase Cloud Function
   */
  async callFunction<T>(functionName: string, data?: unknown): Promise<T> {
    try {
      const callable = httpsCallable(functions, functionName);
      const result = await callable(data || {});
      return result.data as T;
    } catch (error) {
      console.error(`Error calling function ${functionName}:`, error);
      throw error;
    }
  }

  // Legacy HTTP methods for backward compatibility (now using callable functions)
  async get<T>(endpoint: string): Promise<T> {
    // Extract function name from endpoint (remove leading slash)
    const functionName = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return this.callFunction<T>(functionName);
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    // Extract function name from endpoint (remove leading slash)
    const functionName = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return this.callFunction<T>(functionName, data);
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    // Extract function name from endpoint (remove leading slash)
    const functionName = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return this.callFunction<T>(functionName, data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    // Extract function name from endpoint (remove leading slash)
    const functionName = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return this.callFunction<T>(functionName);
  }
}

export const apiService = new ApiService();
