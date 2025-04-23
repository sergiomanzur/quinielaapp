import { Quiniela } from '../types';
// Import the new API function
import { fetchQuinielas, fetchQuinielaById, saveQuinielasToServer, createQuinielaOnServer, deleteQuinielaFromServer } from './api'; 

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

// Add new function to create a single quiniela via API
export const createQuinielaInS3 = async (name: string, createdBy: string): Promise<Quiniela | null> => {
  try {
    // Use the new createQuinielaOnServer function from api.ts
    return await createQuinielaOnServer(name, createdBy);
  } catch (error) {
    console.error(`Error creating quiniela "${name}" via API: ${error instanceof Error ? error.message : String(error)}`);
    return null; // Return null on error
  }
};


// Delete quiniela through server API (using database endpoint)
export const deleteQuinielaFromS3 = async (id: string): Promise<boolean> => {
  try {
    // Use the new deleteQuinielaFromServer function from api.ts
    return await deleteQuinielaFromServer(id);
  } catch (error) {
    console.error(`Error deleting quiniela ${id} via API: ${error instanceof Error ? error.message : String(error)}`);
    return false; // Indicate failure
  }
};
