import { createContext, useContext, useEffect, useState } from 'react';
import { adminLogin } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const savedAdmin = localStorage.getItem('admin_user');
    if (token && savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
    }
    setReady(true);
  }, []);

  async function login(email, password) {
    const data = await adminLogin(email, password);
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    setAdmin(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
