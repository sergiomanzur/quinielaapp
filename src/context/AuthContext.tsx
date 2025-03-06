import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { generateId } from '../utils/helpers';

// Default admin user
const DEFAULT_ADMIN: User = {
  id: "admin123",
  name: "Sergio Jr",
  email: "sergiom2010@gmail.com",
  password: "abc0123abc", // In a real app, we would hash passwords
  role: "admin"
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  // Initialize users with default admin on first load
  useEffect(() => {
    const initializeUsers = () => {
      const savedUsers = localStorage.getItem('users');
      let users: User[] = savedUsers ? JSON.parse(savedUsers) : [];
      
      // Check if admin already exists
      const adminExists = users.some(user => user.email === DEFAULT_ADMIN.email);
      
      if (!adminExists) {
        // Add default admin user
        users.push(DEFAULT_ADMIN);
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Default admin user created');
      }
    };
    
    // Check if user is already logged in
    const checkAuth = () => {
      const savedAuth = localStorage.getItem('authUser');
      
      if (savedAuth) {
        try {
          const user = JSON.parse(savedAuth);
          setAuthState({
            isAuthenticated: true,
            user,
            loading: false,
            error: null
          });
        } catch (error) {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };
    
    initializeUsers();
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Get users from localStorage
      const savedUsers = localStorage.getItem('users');
      const users: User[] = savedUsers ? JSON.parse(savedUsers) : [];
      
      // Find user with matching email and password
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Store logged in user
        localStorage.setItem('authUser', JSON.stringify(user));
        
        setAuthState({
          isAuthenticated: true,
          user,
          loading: false,
          error: null
        });
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: 'Invalid email or password'
        }));
        return false;
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Error during login'
      }));
      return false;
    }
  };
  
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Get existing users
      const savedUsers = localStorage.getItem('users');
      const users: User[] = savedUsers ? JSON.parse(savedUsers) : [];
      
      // Check if email already exists
      if (users.some(user => user.email === email)) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: 'Email already in use'
        }));
        return false;
      }
      
      // Create new user
      const newUser: User = {
        id: generateId(),
        name,
        email,
        password, // In a real app, we would hash this
        role: 'user' // Default role for new users
      };
      
      // Add user to localStorage
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Log in the new user
      localStorage.setItem('authUser', JSON.stringify(newUser));
      
      setAuthState({
        isAuthenticated: true,
        user: newUser,
        loading: false,
        error: null
      });
      
      return true;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Error during registration'
      }));
      return false;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('authUser');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    });
  };

  const isAdmin = () => {
    return authState.user?.role === 'admin';
  };
  
  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    isAdmin
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
