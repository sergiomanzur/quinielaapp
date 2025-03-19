import { User } from '../types';
import { UserDB } from './database';

// Get all users via API
export const getAllUsers = async (): Promise<Partial<User>[]> => {
  return await UserDB.getAll();
};

// Get user by ID via API
export const getUserById = async (id: string): Promise<Partial<User> | null> => {
  return await UserDB.getById(id);
};

// Update user via API
export const updateUser = async (id: string, userData: Partial<User>): Promise<void> => {
  const success = await UserDB.update(id, userData);
  if (!success) {
    throw new Error(`Failed to update user ${id}`);
  }
};

// Delete user via API
export const deleteUser = async (id: string): Promise<void> => {
  const success = await UserDB.delete(id);
  if (!success) {
    throw new Error(`Failed to delete user ${id}`);
  }
};

// Login user via API
export const loginUser = async (email: string, password: string): Promise<{ success: boolean; user?: Partial<User>; error?: string }> => {
  return await UserDB.login(email, password);
};

// Register user via API
export const registerUser = async (name: string, email: string, password: string): Promise<{ success: boolean; user?: Partial<User>; error?: string }> => {
  return await UserDB.register(name, email, password);
};
