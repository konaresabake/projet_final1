import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface User {
  id: string;
  nom: string;
  email: string;
  role: 'ADMINISTRATEUR' | 'MAITRE_OUVRAGE' | 'CHEF_DE_PROJET' | 'MEMBRE_TECHNIQUE';
  is_approved: boolean;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, mot_de_passe: string) => Promise<User>;
  register: (nom: string, email: string, mot_de_passe: string, password_confirm: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger les données depuis localStorage au démarrage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, mot_de_passe: string) => {
    try {
      const response = await api.post<{
        access: string;
        refresh: string;
        user: User;
      }>('/auth/login/', {
        email,
        mot_de_passe,
      });

      setToken(response.access);
      setUser(response.user);
      localStorage.setItem('token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      toast.success('Connexion réussie');
      return response.user;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Erreur lors de la connexion';
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (
    nom: string,
    email: string,
    mot_de_passe: string,
    password_confirm: string,
    role: string
  ) => {
    try {
      const response = await api.post<{
        message: string;
        user: User;
      }>('/auth/register/', {
        nom,
        email,
        mot_de_passe,
        password_confirm,
        role,
      });

      toast.success(response.message || 'Inscription réussie. Votre compte est en attente de validation.');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 
        Object.values(error?.response?.data || {}).flat().join(', ') || 
        'Erreur lors de l\'inscription';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    toast.success('Déconnexion réussie');
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'ADMINISTRATEUR';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

