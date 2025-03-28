import { Quiniela, User } from '../types';

// Use the correct API URL based on environment
export const API_URL = '/api'; // Export the API_URL constant

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

export const updateMatchResult = async (
  matchId: string, 
  homeScore: number, 
  awayScore: number
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/matches/${matchId}/result`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ homeScore, awayScore }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update match result: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error updating match result:', error);
    throw error;
  }
};

/**
 * Update a match's date
 */
export const updateMatchDate = async (matchId: string, date: string): Promise<any> => {
  try {
    const response = await fetch(`/api/matches/${matchId}/date`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update match date: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating match date:', error);
    throw error;
  }
};

/**
 * Delete a match
 */
export const deleteMatch = async (matchId: string): Promise<any> => {
  try {
    const response = await fetch(`/api/matches/${matchId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete match: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting match:', error);
    throw error;
  }
};
