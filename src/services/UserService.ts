import axios from 'axios';
import { User, CreateUserDto, UpdateUserDto } from '../models/User';

// In Vite, use import.meta.env instead of process.env
const API_URL = import.meta.env.VITE_API_URL || '';

export const UserService = {
  getUsers: async (): Promise<User[]> => {
    const response = await axios.get(`${API_URL}/users`, {
      withCredentials: true
    });
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await axios.get(`${API_URL}/users/${id}`, {
      withCredentials: true
    });
    return response.data;
  },

  createUser: async (userData: CreateUserDto): Promise<User> => {
    const response = await axios.post(`${API_URL}/users`, userData, {
      withCredentials: true
    });
    return response.data;
  },

  updateUser: async (id: string, userData: UpdateUserDto): Promise<User> => {
    const response = await axios.put(`${API_URL}/users/${id}`, userData, {
      withCredentials: true
    });
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/users/${id}`, {
      withCredentials: true
    });
  }
};
