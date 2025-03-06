import { Quiniela } from '../types';
import { fetchQuinielas, saveQuinielasToServer } from './api';

// Get all quinielas from server
export const getQuinielas = async (): Promise<Quiniela[]> => {
  return await fetchQuinielas();
};

// Save all quinielas to server
export const saveQuinielas = async (quinielas: Quiniela[]): Promise<void> => {
  const success = await saveQuinielasToServer(quinielas);
  if (!success) {
    throw new Error('Failed to save quinielas to server');
  }
};

// Save a single quiniela
export const saveQuiniela = async (quiniela: Quiniela): Promise<void> => {
  try {
    const quinielas = await getQuinielas();
    const index = quinielas.findIndex(q => q.id === quiniela.id);
    
    if (index >= 0) {
      quinielas[index] = quiniela;
    } else {
      quinielas.push(quiniela);
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
