import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { loginUser, registerUser } from '../utils/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  isAuthenticated: boolean; // Add this line
  loading: boolean; // Add this line
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  // Check if user is already logged in
  useEffect(() => {
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
    
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await loginUser(email, password);
      
      if (result.success && result.user) {
        // Store logged in user
        localStorage.setItem('authUser', JSON.stringify(result.user));
        
        setAuthState({
          isAuthenticated: true,
          user: result.user,
          loading: false,
          error: null
        });
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Invalid email or password'
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
      
      const result = await registerUser(name, email, password);
      
      if (result.success && result.user) {
        // Store logged in user
        localStorage.setItem('authUser', JSON.stringify(result.user));
        
        setAuthState({
          isAuthenticated: true,
          user: result.user,
          loading: false,
          error: null
        });
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Registration failed'
        }));
        return false;
      }
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
    isAdmin,
    isAuthenticated: authState.isAuthenticated, // Add this line
    loading: authState.loading // Add this line
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
