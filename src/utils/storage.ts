import { Quiniela } from '../types';
import * as fileStorage from './fileStorage';

// Sync interval in milliseconds (e.g., sync every minute)
const SYNC_INTERVAL = 60000;
let syncInterval: NodeJS.Timeout | null = null;

// Start periodic sync with server
export const startPeriodicSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  // Immediately sync once
  syncWithServer();

  // Then set up periodic syncing
  syncInterval = setInterval(syncWithServer, SYNC_INTERVAL);
};

// Stop periodic sync
export const stopPeriodicSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

// Sync local data with server
export const syncWithServer = async (): Promise<void> => {
  try {
    console.log('Syncing data with server...');

    // Get data from both sources
    const serverQuinielas = await fileStorage.getQuinielas();
    const localQuinielas = fileStorage.fallbackToLocalStorage.getQuinielas();

    if (localQuinielas.length > 0) {
      // Only attempt to merge if we have local data
      const mergedQuinielas = serverQuinielas.map(serverQuiniela => {
        const localQuiniela = localQuinielas.find(q => q.id === serverQuiniela.id);
        if (localQuiniela) {
          // If we have local data for this quiniela, compare versions
          return (localQuiniela.version || 0) > (serverQuiniela.version || 0)
            ? localQuiniela
            : serverQuiniela;
        }
        return serverQuiniela;
      });

      // Also include any local quinielas not on the server
      localQuinielas.forEach(localQuiniela => {
        if (!mergedQuinielas.some(q => q.id === localQuiniela.id)) {
          mergedQuinielas.push(localQuiniela);
        }
      });

      // Save merged data to both places
      await fileStorage.saveQuinielas(mergedQuinielas);
      fileStorage.fallbackToLocalStorage.saveQuinielas(mergedQuinielas);
    }

    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Error during sync:', error);
  }
};

// Try to use file storage first, fall back to localStorage if needed
export const getQuinielas = async (): Promise<Quiniela[]> => {
  try {
    console.log('Attempting to get quinielas from server...');
    return await fileStorage.getQuinielas();
  } catch (error) {
    console.error('Error using file storage, falling back to localStorage:', error);
    return fileStorage.fallbackToLocalStorage.getQuinielas();
  }
};

export const saveQuinielas = async (quinielas: Quiniela[]): Promise<void> => {
  try {
    console.log('Attempting to save quinielas to server...');
    await fileStorage.saveQuinielas(quinielas);
    console.log('Successfully saved quinielas to server');

    // Also update localStorage to keep them in sync
    fileStorage.fallbackToLocalStorage.saveQuinielas(quinielas);
  } catch (error) {
    console.error('Error using file storage, falling back to localStorage:', error);
    fileStorage.fallbackToLocalStorage.saveQuinielas(quinielas);
    console.log('Successfully saved quinielas to localStorage');
  }
};

// Update to include version control
export const saveQuiniela = async (quiniela: Quiniela): Promise<void> => {
  // Ensure quiniela has version information
  const versionedQuiniela = {
    ...quiniela,
    version: (quiniela.version || 0) + 1,
    lastUpdated: new Date().toISOString()
  };

  try {
    console.log(`Attempting to save quiniela ${versionedQuiniela.id} to server...`);
    await fileStorage.saveQuiniela(versionedQuiniela);
    console.log(`Successfully saved quiniela ${versionedQuiniela.id} to server`);

    // Also update localStorage to keep them in sync
    fileStorage.fallbackToLocalStorage.saveQuiniela(versionedQuiniela);
  } catch (error) {
    console.error('Error using file storage, falling back to localStorage:', error);
    fileStorage.fallbackToLocalStorage.saveQuiniela(versionedQuiniela);
    console.log(`Successfully saved quiniela ${versionedQuiniela.id} to localStorage`);
  }
};

export const deleteQuiniela = async (id: string): Promise<void> => {
  try {
    console.log(`Attempting to delete quiniela ${id} from server...`);
    await fileStorage.deleteQuiniela(id);
    console.log(`Successfully deleted quiniela ${id} from server`);

    // Also update localStorage to keep them in sync
    fileStorage.fallbackToLocalStorage.deleteQuiniela(id);
  } catch (error) {
    console.error('Error using file storage, falling back to localStorage:', error);
    fileStorage.fallbackToLocalStorage.deleteQuiniela(id);
    console.log(`Successfully deleted quiniela ${id} from localStorage`);
  }
};

// Synchronous versions for compatibility with existing code
export const getQuinielasSync = (): Quiniela[] => {
  const data = localStorage.getItem('quinielas');
  return data ? JSON.parse(data) : [];
};

export const saveQuinielasSync = (quinielas: Quiniela[]): void => {
  localStorage.setItem('quinielas', JSON.stringify(quinielas));
};

export const saveQuinielaSync = (quiniela: Quiniela): void => {
  const quinielas = getQuinielasSync();
  const index = quinielas.findIndex(q => q.id === quiniela.id);

  if (index >= 0) {
    quinielas[index] = quiniela;
  } else {
    quinielas.push(quiniela);
  }

  saveQuinielasSync(quinielas);
};

export const deleteQuinielaSync = (id: string): void => {
  const quinielas = getQuinielasSync();
  saveQuinielasSync(quinielas.filter(q => q.id !== id));
};
