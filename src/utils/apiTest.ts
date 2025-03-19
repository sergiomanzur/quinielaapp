/**
 * Utility to test API connectivity
 */

export const testApiConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/health');

    if (!response.ok) {
      return {
        success: false,
        message: `API responded with status ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Connected successfully to API: ${JSON.stringify(data)}`
    };
  } catch (error) {
    return {
      success: false,
      message: `API connection error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
