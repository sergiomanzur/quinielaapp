import { Quiniela, User, Match, Prediction, Participant } from '../types'; // Add Participant

// Use the correct API URL based on environment
export const API_URL = '/api'; // Export the API_URL constant

// Enhanced error handling helper
export const handleApiError = (error: any): string => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return error.response.data?.error || error.response.data?.details || 
           `Error del servidor: ${error.response.status}`;
  } else if (error.request) {
    // The request was made but no response was received
    return 'No se recibió respuesta del servidor. Verifica tu conexión.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || 'Error desconocido al procesar la solicitud.';
  }
};

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

// Add new function to fetch a single quiniela by ID
export const fetchQuinielaById = async (id: string): Promise<Quiniela | null> => {
  try {
    console.log(`Fetching quiniela by ID from: ${API_URL}/quinielas/${id}`);
    const response = await fetch(`${API_URL}/quinielas/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Quiniela with ID ${id} not found.`);
        return null; // Return null if not found
      }
      const errorText = await response.text();
      throw new Error(`Failed to fetch quiniela ${id}: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }

    const data: Quiniela = await response.json();
    console.log(`Fetched quiniela ${id} successfully`);
    return data;
  } catch (error) {
    console.error(`Error fetching quiniela by ID ${id}:`, error);
    // Depending on how you want to handle errors, you might return null or re-throw
    // Returning null might be suitable if the component can handle a null quiniela
    return null; 
    // Or re-throw: throw error; 
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

// Add new function to create a single quiniela
export const createQuinielaOnServer = async (name: string, createdBy: string): Promise<Quiniela | null> => {
  try {
    console.log(`Creating new quiniela "${name}" by user ${createdBy} on server...`);
    const response = await fetch(`${API_URL}/quinielas/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, createdBy }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error(`Failed to create quiniela: ${response.status} ${response.statusText}`, errorData);
      throw new Error(errorData.error || `Failed to create quiniela: ${response.status}`);
    }

    const newQuiniela: Quiniela = await response.json();
    console.log('Quiniela created successfully:', newQuiniela);
    return newQuiniela;
  } catch (error) {
    console.error('Error creating quiniela:', error);
    // Re-throw or handle as needed, returning null indicates failure
    return null; 
  }
};

// Add new function to delete a single quiniela
export const deleteQuinielaFromServer = async (id: string): Promise<boolean> => {
  try {
    console.log(`Deleting quiniela ${id} on server...`);
    const response = await fetch(`${API_URL}/quinielas/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error(`Failed to delete quiniela: ${response.status} ${response.statusText}`, errorData);
      throw new Error(errorData.error || `Failed to delete quiniela: ${response.status}`);
    }

    const result = await response.json();
    console.log('Quiniela deleted successfully:', result);
    return result.success === true;
  } catch (error) {
    console.error('Error deleting quiniela:', error);
    return false; // Indicate failure
  }
};

// Add new function to add a single match
export const addMatchToServer = async (quinielaId: string, matchData: Omit<Match, 'id'>): Promise<Match | null> => {
  try {
    console.log(`Adding new match to quiniela ${quinielaId} on server...`);
    const response = await fetch(`${API_URL}/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        quinielaId, 
        homeTeam: matchData.homeTeam,
        awayTeam: matchData.awayTeam,
        date: matchData.date // Ensure date is in ISO format string
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error(`Failed to add match: ${response.status} ${response.statusText}`, errorData);
      throw new Error(errorData.error || `Failed to add match: ${response.status}`);
    }

    const newMatch: Match = await response.json();
    console.log('Match added successfully:', newMatch);
    return newMatch;
  } catch (error) {
    console.error('Error adding match:', error);
    return null; 
  }
};

// Add new function to join a quiniela
export const joinQuinielaOnServer = async (quinielaId: string, userId: string): Promise<Participant | null> => {
    try {
        console.log(`User ${userId} joining quiniela ${quinielaId} on server...`);
        const response = await fetch(`${API_URL}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quinielaId, userId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            console.error(`Failed to join quiniela: ${response.status} ${response.statusText}`, errorData);
            // Return null but include error message for context handling
            return { error: errorData.error || `Failed to join: ${response.status}` } as any; 
        }

        const newParticipant: Participant = await response.json();
        console.log('User joined quiniela successfully:', newParticipant);
        return newParticipant;
    } catch (error) {
        console.error('Error joining quiniela:', error);
        return { error: error instanceof Error ? error.message : 'Unknown error joining quiniela' } as any;
    }
};

// Rename and modify function to save a batch of predictions
export const savePredictionsToServer = async (participantId: string, predictions: Prediction[]): Promise<boolean> => {
  if (!predictions || predictions.length === 0) {
    console.log("No predictions provided to save.");
    return true; // Nothing to save, technically successful
  }
  try {
    console.log(`Saving batch of ${predictions.length} predictions for participant ${participantId} to server...`);
    const response = await fetch(`${API_URL}/predictions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send participantId and the array of predictions
      body: JSON.stringify({
        participantId,
        predictions, 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error(`Failed to save predictions batch: ${response.status} ${response.statusText}`, errorData);
      // Include details from the server error response if available
      throw new Error(errorData.details || errorData.error || `Failed to save predictions: ${response.status}`);
    }

    const result = await response.json();
    console.log('Predictions batch saved successfully:', result);
    return result.success === true;
  } catch (error) {
    console.error('Error saving predictions batch:', error);
    // Propagate the error message
    throw error; 
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
