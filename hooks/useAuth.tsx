
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  lastLogin: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_DB_KEY = 'invosync_accounts_vault';
const SESSION_KEY = 'invosync_active_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrateSession = () => {
      try {
        const sessionToken = localStorage.getItem(SESSION_KEY);
        if (sessionToken) {
          // In a real app, we'd verify the token with a server
          const parsedSession = JSON.parse(sessionToken);
          setUser(parsedSession);
        }
      } catch (e) {
        console.error("Session hydration failed", e);
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setLoading(false);
      }
    };

    hydrateSession();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    // Simulate real network/database latency
    await new Promise(r => setTimeout(r, 1200));
    
    const users = JSON.parse(localStorage.getItem(USER_DB_KEY) || '[]');
    const foundUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass);
    
    if (foundUser) {
      const sessionUser: User = { 
        id: foundUser.id, 
        email: foundUser.email, 
        name: foundUser.name,
        lastLogin: new Date().toISOString()
      };
      setUser(sessionUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    } else {
      setLoading(false);
      throw new Error('Invalid credentials. Please check your email and password.');
    }
    setLoading(false);
  };

  const register = async (email: string, pass: string, name: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    
    const users = JSON.parse(localStorage.getItem(USER_DB_KEY) || '[]');
    if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      setLoading(false);
      throw new Error('An account with this email already exists.');
    }

    const newUser = { 
      id: `usr_${Math.random().toString(36).substr(2, 9)}`, 
      email: email.toLowerCase(), 
      pass, 
      name,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(USER_DB_KEY, JSON.stringify(users));
    
    const sessionUser: User = { 
      id: newUser.id, 
      email: newUser.email, 
      name: newUser.name,
      lastLogin: new Date().toISOString()
    };
    
    setUser(sessionUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
