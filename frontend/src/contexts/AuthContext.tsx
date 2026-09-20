import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api/auth';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchPersona: (persona: 'admin' | 'sales_1' | 'sales_2') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('estatepulse_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('estatepulse_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { success, error, info } = useToast();

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      error('Session Expired', 'Your session has expired. Please sign in again.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [error]);

  // Verify current session on mount
  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const me = await authApi.getMe();
          setUser(me);
          localStorage.setItem('estatepulse_user', JSON.stringify(me));
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('estatepulse_token');
          localStorage.removeItem('estatepulse_user');
        }
      }
      setIsLoading(false);
    };

    verifySession();
  }, [token]);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem('estatepulse_token', res.access_token);
      localStorage.setItem('estatepulse_user', JSON.stringify(res.user));
      success('Welcome back', `Signed in as ${res.user.full_name} (${res.user.role === 'ADMIN' ? 'Admin' : 'Sales Consultant'})`);
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('estatepulse_token');
    localStorage.removeItem('estatepulse_user');
    setUser(null);
    setToken(null);
    info(
      'Session Terminated Safely',
      'You have been successfully signed out of EstatePulse CRM. Your secure session tokens have been cleared.'
    );
  };


  const switchPersona = async (persona: 'admin' | 'sales_1' | 'sales_2') => {
    let email = 'admin@coromandel.in';
    let pass = 'Admin@1234';
    if (persona === 'sales_1') {
      email = 'meera@coromandel.in';
      pass = 'Sales@1234';
    } else if (persona === 'sales_2') {
      email = 'anand@coromandel.in';
      pass = 'Sales@1234';
    }

    try {
      await login(email, pass);
    } catch (err: any) {
      error('Persona switch failed', err.message);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        login,
        logout,
        switchPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
