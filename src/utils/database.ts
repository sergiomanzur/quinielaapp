/**
 * This file provides a clean frontend interface to interact with 
 * the MySQL database through the API.
 */

import { Quiniela, User, Match, Participant, Prediction } from '../types';

// API base URL
const API_URL = '/api';

/**
 * User-related database operations
 */
export const UserDB = {
  getAll: async (): Promise<User[]> => {
    try {
      const response = await fetch(`${API_URL}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return await response.json();
    } catch (error) {
      console.error('Database error fetching users:', error);
      return [];
    }
  },
  
  getById: async (id: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_URL}/users/${id}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch user');
      return await response.json();
    } catch (error) {
      console.error(`Database error fetching user ${id}:`, error);
      return null;
    }
  },
  
  update: async (id: string, userData: Partial<User>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!response.ok) throw new Error('Failed to update user');
      return true;
    } catch (error) {
      console.error(`Database error updating user ${id}:`, error);
      return false;
    }
  },
  
  delete: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return true;
    } catch (error) {
      console.error(`Database error deleting user ${id}:`, error);
      return false;
    }
  },
  
  register: async (name: string, email: string, password: string): Promise<{success: boolean, user?: User, error?: string}> => {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Database error during registration:', error);
      return { success: false, error: 'Network error during registration' };
    }
  },
  
  login: async (email: string, password: string): Promise<{success: boolean, user?: User, error?: string}> => {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Database error during login:', error);
      return { success: false, error: 'Network error during login' };
    }
  }
};

/**
 * Quiniela-related database operations
 */
export const QuinielaDB = {
  getAll: async (): Promise<Quiniela[]> => {
    try {
      const response = await fetch(`${API_URL}/quinielas`);
      if (!response.ok) throw new Error('Failed to fetch quinielas');
      return await response.json();
    } catch (error) {
      console.error('Database error fetching quinielas:', error);
      return [];
    }
  },
  
  saveAll: async (quinielas: Quiniela[]): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/quinielas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quinielas)
      });
      if (!response.ok) throw new Error('Failed to save quinielas');
      return true;
    } catch (error) {
      console.error('Database error saving quinielas:', error);
      return false;
    }
  }
};

/**
 * System health check
 */
export const SystemDB = {
  checkHealth: async (): Promise<{status: string, database: {status: string, name: string, host: string, port: string}}> => {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (!response.ok) throw new Error('Health check failed');
      return await response.json();
    } catch (error) {
      console.error('Database health check error:', error);
      return {
        status: 'error',
        database: {
          status: 'error',
          name: 'unknown',
          host: 'unknown',
          port: 'unknown'
        }
      };
    }
  }
};
