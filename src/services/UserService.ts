import { User, CreateUserDto, UpdateUserDto } from '../models/User';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../utils/userStorage';

export const UserService = {
  getUsers: async (): Promise<User[]> => {
    return await getAllUsers() as User[];
  },

  getUserById: async (id: string): Promise<User> => {
    const user = await getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user as User;
  },

  createUser: async (userData: CreateUserDto): Promise<User> => {
    // This would use the register endpoint
    throw new Error('Use the auth context registerUser method instead');
  },

  updateUser: async (id: string, userData: UpdateUserDto): Promise<User> => {
    await updateUser(id, userData);
    const updatedUser = await getUserById(id);
    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user');
    }
    return updatedUser as User;
  },

  deleteUser: async (id: string): Promise<void> => {
    await deleteUser(id);
  }
};
