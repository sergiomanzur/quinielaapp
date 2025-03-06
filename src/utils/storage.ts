import { Quiniela } from '../types';
import * as fileStorage from './fileStorage';

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
  } catch (error) {
    console.error('Error using file storage, falling back to localStorage:', error);
    fileStorage.fallbackToLocalStorage.saveQuinielas(quinielas);
    console.log('Successfully saved quinielas to localStorage');
  }
};

export const saveQuiniela = async (quiniela: Quiniela): Promise<void> => {
  try {
    console.log(`Attempting to save quiniela ${quiniela.id} to server...`);
    await fileStorage.saveQuiniela(quiniela);
    console.log(`Successfully saved quiniela ${quiniela.id} to server`);
  } catch (error) {
    console.error('Error using file storage, falling back to localStorage:', error);
    fileStorage.fallbackToLocalStorage.saveQuiniela(quiniela);
    console.log(`Successfully saved quiniela ${quiniela.id} to localStorage`);
  }
};

export const deleteQuiniela = async (id: string): Promise<void> => {
  try {
    console.log(`Attempting to delete quiniela ${id} from server...`);
    await fileStorage.deleteQuiniela(id);
    console.log(`Successfully deleted quiniela ${id} from server`);
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
