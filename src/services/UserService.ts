import { User } from '../types';

// Get all users via API
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<User> => {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Create new user (admin version using register endpoint)
export const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  try {
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
