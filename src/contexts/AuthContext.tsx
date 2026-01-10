import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserType = 'admin' | 'seguranca';

export interface User {
  id: string;
  usuario: string;
  tipo: UserType;
}

interface AuthContextType {
  user: User | null;
  login: (usuario: string, senha: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuários padrão para demonstração
const DEFAULT_USERS = [
  { id: '1', usuario: 'admin', senha: 'admin123', tipo: 'admin' as UserType },
  { id: '2', usuario: 'seguranca', senha: 'seguranca123', tipo: 'seguranca' as UserType },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão salva
    const savedUser = localStorage.getItem('ticketSystem_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (usuario: string, senha: string): Promise<boolean> => {
    const foundUser = DEFAULT_USERS.find(
      u => u.usuario === usuario && u.senha === senha
    );

    if (foundUser) {
      const { senha: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('ticketSystem_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ticketSystem_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
