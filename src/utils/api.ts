import { Quiniela, User } from '../types';

// Use the correct API URL based on environment
const API_URL = '/api';

// Quiniela API functions
export const fetchQuinielas = async (): Promise<Quiniela[]> => {
  try {
    console.log('Fetching quinielas from:', API_URL + '/quinielas');
    const response = await fetch(API_URL + '/quinielas');
    
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
    console.log(`Sending ${quinielas.length} quinielas to server at ${API_URL}/quinielas`);
    
    const response = await fetch(API_URL + '/quinielas', {
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

// User API functions
export const fetchUsers = async (): Promise<User[]> => {
  try {
    console.log('Fetching users from:', API_URL + '/users');
    const response = await fetch(API_URL + '/users');
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.length} users successfully`);
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const loginUser = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const response = await fetch(API_URL + '/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Login failed' };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error during login:', error);
    return { success: false, error: 'Network error during login' };
  }
};

export const registerUser = async (name: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const response = await fetch(API_URL + '/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Registration failed' };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error during registration:', error);
    return { success: false, error: 'Network error during registration' };
  }
};
