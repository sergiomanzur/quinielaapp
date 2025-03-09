import { User } from '../types';

// Get all users via API
export const getAllUsers = async (): Promise<Partial<User>[]> => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error getting users from server: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
};

// Get user by ID via API
export const getUserById = async (id: string): Promise<Partial<User> | null> => {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch user: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error getting user from server: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

// Update user via API
export const updateUser = async (id: string, userData: Partial<User>): Promise<void> => {
  try {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update user: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`Error updating user on server: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Delete user via API
export const deleteUser = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete user: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`Error deleting user from server: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Login user via API (using existing endpoint)
export const loginUser = async (email: string, password: string): Promise<{ success: boolean; user?: Partial<User>; error?: string }> => {
  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Login failed' };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error(`Error during login: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, error: 'Network error during login' };
  }
};

// Register user via API (using existing endpoint)
export const registerUser = async (name: string, email: string, password: string): Promise<{ success: boolean; user?: Partial<User>; error?: string }> => {
  try {
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Registration failed' };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error(`Error during registration: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, error: 'Network error during registration' };
  }
};
