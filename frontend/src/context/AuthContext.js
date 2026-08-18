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

  const registroModerador = async (nombre_usuario, email, password) => {
    const { data } = await api.post('/auth/registro/moderador', { nombre_usuario, email, password });
    return data;
  };

  const registroCategoria = async (nombre, descripcion) => {
    const { data } = await api.post('/auth/registro/categoria', { nombre, descripcion });
    return data;
  };

  const crearReporte = async (id_reportante, id_reportado, id_producto, motivo, comentarios) => {
    const { data } = await api.post('/reportes', { id_reportante, id_reportado, id_producto, motivo, comentarios });
    return data;
  };

  const ocultarProducto = async (id) => {
    const { data } = await api.post(`/productos/${id}/ocultar`);
    console.log(data)
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
    <AuthContext.Provider value={{ usuario, emprendimiento, loading, login, registroCliente, registroEmprendedor, registroModerador, registroCategoria, crearReporte, ocultarProducto, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
