export interface User {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  role: 'user' | 'admin';
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateUserDto = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserDto = Partial<CreateUserDto>;
