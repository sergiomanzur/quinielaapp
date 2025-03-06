import { Quiniela } from '../types';

// Use the correct API URL based on environment
const API_URL = '/api/quinielas';

export const fetchQuinielas = async (): Promise<Quiniela[]> => {
  try {
    console.log('Fetching quinielas from:', API_URL);
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch quinielas: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.length} quinielas successfully`);
    return data;
  } catch (error) {
    console.error('Error fetching quinielas:', error);
    return [];
  }
};

export const saveQuinielasToServer = async (quinielas: Quiniela[]): Promise<boolean> => {
  try {
    console.log(`Sending ${quinielas.length} quinielas to server at ${API_URL}`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quinielas),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save quinielas: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Server response:', result);
    
    return result.success === true;
  } catch (error) {
    console.error('Error saving quinielas:', error);
    throw error; // Re-throw to allow proper fallback
  }
};
