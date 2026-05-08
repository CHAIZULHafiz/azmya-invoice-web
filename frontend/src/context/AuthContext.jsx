import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('azmya_token');
    const savedUser = localStorage.getItem('azmya_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/login', { username, password });
    if (res.data.success) {
      localStorage.setItem('azmya_token', res.data.token);
      localStorage.setItem('azmya_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const logout = () => {
    localStorage.removeItem('azmya_token');
    localStorage.removeItem('azmya_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
