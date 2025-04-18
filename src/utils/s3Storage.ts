import { Quiniela } from '../types';
import { fetchQuinielas, fetchQuinielaById, saveQuinielasToServer } from './api'; // Import fetchQuinielaById

// These functions now use the MySQL database API endpoints instead of S3

// Get all quinielas through server API
export const getQuinielasFromS3 = async (): Promise<Quiniela[]> => {
  try {
    // Use the existing fetchQuinielas function from api.ts
    return await fetchQuinielas();
  } catch (error) {
    console.error(`Error getting all quinielas from API: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
};

// Add new function to get a single quiniela by ID
export const getQuinielaByIdFromS3 = async (id: string): Promise<Quiniela | null> => {
  try {
    // Use the new fetchQuinielaById function from api.ts
    return await fetchQuinielaById(id);
  } catch (error) {
    console.error(`Error getting quiniela ${id} from API: ${error instanceof Error ? error.message : String(error)}`);
    return null; // Return null on error
  }
};


// Save all quinielas through server API (now using database)
export const saveQuinielasToS3 = async (quinielas: Quiniela[]): Promise<void> => {
  try {
    // Use the saveQuinielasToServer function from api.ts
    await saveQuinielasToServer(quinielas);
  } catch (error) {
    console.error(`Error saving data via API: ${error instanceof Error ? error.message : String(error)}`);
    throw error; // Re-throw to allow context to handle it
  }
};

// Delete quiniela through server API (using database endpoint)
export const deleteQuinielaFromS3 = async (id: string): Promise<void> => {
  // This function still needs refinement - ideally a DELETE /api/quinielas/:id endpoint
  // For now, it continues to fetch all, filter, and save back.
  try {
    const quinielas = await getQuinielasFromS3();
    const updatedQuinielas = quinielas.filter(q => q.id !== id);
    await saveQuinielasToS3(updatedQuinielas);
  } catch (error) {
    console.error(`Error deleting quiniela ${id} via API: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};
