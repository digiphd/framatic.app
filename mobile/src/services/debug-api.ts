// Debug API service to test basic connectivity
const API_BASE_URL = 'http://10.0.4.115:3000/api';

export class DebugApiService {
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing API connection to:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/health/storage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      return {
        success: true,
        message: `API connected successfully. Storage: ${data.storage?.r2?.connected ? 'OK' : 'Failed'}`
      };

    } catch (error) {
      console.error('API connection error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async testAssetLibrary(): Promise<{ success: boolean; message: string; assets?: any[] }> {
    try {
      console.log('Testing asset library endpoint...');
      
      const response = await fetch(`${API_BASE_URL}/assets/library`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Library response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Library response data:', data);

      return {
        success: true,
        message: `Found ${data.total || 0} assets`,
        assets: data.assets || []
      };

    } catch (error) {
      console.error('Library test error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const debugApi = DebugApiService;