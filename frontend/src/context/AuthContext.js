import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [emprendimiento, setEmprendimiento] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('usuario');
    if (token && stored) {
      setUsuario(JSON.parse(stored));
      const storedEmp = localStorage.getItem('emprendimiento');
      if (storedEmp && storedEmp !== 'null') {
        setEmprendimiento(JSON.parse(storedEmp));
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    localStorage.setItem('emprendimiento', JSON.stringify(data.emprendimiento));
    setUsuario(data.usuario);
    setEmprendimiento(data.emprendimiento);
    return data;
  };

  const registroCliente = async (nombre_usuario, email, password) => {
    const { data } = await api.post('/auth/registro/cliente', { nombre_usuario, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data;
  };

  const registroEmprendedor = async (formData) => {
    const { data } = await api.post('/auth/registro/emprendedor', formData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    localStorage.setItem('emprendimiento', JSON.stringify(data.emprendimiento));
    setUsuario(data.usuario);
    setEmprendimiento(data.emprendimiento);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('emprendimiento');
    setUsuario(null);
    setEmprendimiento(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, emprendimiento, loading, login, registroCliente, registroEmprendedor, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
