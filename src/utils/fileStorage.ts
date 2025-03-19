import { Quiniela } from '../types';
import { fetchQuinielas, saveQuinielasToServer } from './api';
import { API_URL } from './api'; // Import API_URL

// Define a type that explicitly includes version information
interface VersionedQuiniela extends Quiniela {
  version: number;
  lastUpdated: string;
}

// Get all quinielas from server
export const getQuinielas = async (): Promise<Quiniela[]> => {
  return await fetchQuinielas();
};

// Save all quinielas to server
export const saveQuinielas = async (quinielas: Quiniela[]): Promise<void> => {
  try {
    // First get current server data to check for conflicts
    const currentQuinielas = await getQuinielas();

    // Merge server and local data
    const mergedQuinielas = mergeQuinielas(currentQuinielas, quinielas);

    // Upload the merged data to storage
    const response = await fetch(`${API_URL}/saveData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: JSON.stringify(mergedQuinielas) }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
  } catch (error) {
    console.error('Error in saveQuinielas:', error);
    throw error;
  }
};

// Save a single quiniela
export const saveQuiniela = async (quiniela: Quiniela): Promise<void> => {
  try {
    // Update version and timestamp with proper TypeScript safety
    // Use type assertion to tell TypeScript this is valid
    const updatedQuiniela = {
      ...quiniela,
      version: ((quiniela as any).version || 0) + 1,
      lastUpdated: new Date().toISOString()
    } as Quiniela;

    // Get all current quinielas
    const quinielas = await getQuinielas();
    const index = quinielas.findIndex(q => q.id === updatedQuiniela.id);

    // Check for version conflicts
    if (index >= 0) {
      const serverVersion = (quinielas[index] as any).version || 0;

      if (serverVersion > ((quiniela as any).version || 0)) {
        // There's a newer version on the server - merge data instead of overwriting
        quinielas[index] = mergeQuinielasData(quinielas[index], updatedQuiniela);
      } else {
        // Our version is newer, update it
        quinielas[index] = updatedQuiniela;
      }
    } else {
      quinielas.push(updatedQuiniela);
    }

    await saveQuinielas(quinielas);
  } catch (error) {
    console.error('Error in saveQuiniela:', error);
    throw error;
  }
};

// Delete a quiniela
export const deleteQuiniela = async (id: string): Promise<void> => {
  try {
    const quinielas = await getQuinielas();
    await saveQuinielas(quinielas.filter(q => q.id !== id));
  } catch (error) {
    console.error('Error in deleteQuiniela:', error);
    throw error;
  }
};

// Fallback to localStorage if server operations fail
export const fallbackToLocalStorage = {
  getQuinielas: (): Quiniela[] => {
    const data = localStorage.getItem('quinielas');
    return data ? JSON.parse(data) : [];
  },

  saveQuinielas: (quinielas: Quiniela[]): void => {
    localStorage.setItem('quinielas', JSON.stringify(quinielas));
  },

  saveQuiniela: (quiniela: Quiniela): void => {
    const quinielas = fallbackToLocalStorage.getQuinielas();
    const index = quinielas.findIndex(q => q.id === quiniela.id);

    if (index >= 0) {
      quinielas[index] = quiniela;
    } else {
      quinielas.push(quiniela);
    }

    fallbackToLocalStorage.saveQuinielas(quinielas);
  },

  deleteQuiniela: (id: string): void => {
    const quinielas = fallbackToLocalStorage.getQuinielas();
    fallbackToLocalStorage.saveQuinielas(quinielas.filter(q => q.id !== id));
  }
};

// Helper function to merge quiniela collections
function mergeQuinielas(serverQuinielas: Quiniela[], localQuinielas: Quiniela[]): Quiniela[] {
  const result = [...serverQuinielas];

  localQuinielas.forEach(localQuiniela => {
    const index = result.findIndex(q => q.id === localQuiniela.id);

    if (index >= 0) {
      // If server has newer version, merge the data
      if (((result[index] as any).version || 0) > ((localQuiniela as any).version || 0)) {
        result[index] = mergeQuinielasData(result[index], localQuiniela);
      } else {
        // Our version is newer or same
        result[index] = localQuiniela;
      }
    } else {
      // New quiniela, just add it
      result.push(localQuiniela);
    }
  });

  return result;
}

// Helper function to intelligently merge two versions of a quiniela
function mergeQuinielasData(serverQuiniela: Quiniela, localQuiniela: Quiniela): Quiniela {
  // Take the higher version
  const newVersion = Math.max(
    ((serverQuiniela as any).version || 0),
    ((localQuiniela as any).version || 0)
  ) + 1;

  // Merge participants (keep all participants from both versions)
  const mergedParticipants = [...serverQuiniela.participants];
  localQuiniela.participants.forEach(localParticipant => {
    if (!mergedParticipants.some(p => p.userId === localParticipant.userId)) {
      mergedParticipants.push(localParticipant);
    }
  });

  // Merge matches (prefer more complete match data)
  const mergedMatches = [...serverQuiniela.matches];
  localQuiniela.matches.forEach(localMatch => {
    const matchIndex = mergedMatches.findIndex(m => m.id === localMatch.id);
    if (matchIndex >= 0) {
      // If the local match has more data (e.g., has results), prefer it
      if (localMatch.homeScore !== undefined && mergedMatches[matchIndex].homeScore === undefined) {
        mergedMatches[matchIndex] = localMatch;
      }
    } else {
      mergedMatches.push(localMatch);
    }
  });

  return {
    ...serverQuiniela,
    ...localQuiniela,
    participants: mergedParticipants,
    matches: mergedMatches,
    version: newVersion,
    lastUpdated: new Date().toISOString()
  } as Quiniela; // Explicitly cast the result to Quiniela
}
