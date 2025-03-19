import { Quiniela } from '../types';

// These functions now use the MySQL database API endpoints instead of S3

// Get all quinielas through server API
export const getQuinielasFromS3 = async (): Promise<Quiniela[]> => {
  try {
    const response = await fetch('/api/quinielas');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch quinielas: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error getting data from database: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
};

// Save all quinielas through server API (now using database)
export const saveQuinielasToS3 = async (quinielas: Quiniela[]): Promise<void> => {
  try {
    const response = await fetch('/api/quinielas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quinielas),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save quinielas: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`Error saving data to database: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Delete quiniela through server API (using database endpoint)
export const deleteQuinielaFromS3 = async (id: string): Promise<void> => {
  try {
    // This operation still uses the existing flow by getting all, filtering, and saving back
    // In a future enhancement, this could be modified to use a direct DELETE API endpoint
    const quinielas = await getQuinielasFromS3();
    const updatedQuinielas = quinielas.filter(q => q.id !== id);
    await saveQuinielasToS3(updatedQuinielas);
  } catch (error) {
    console.error(`Error deleting quiniela: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};
