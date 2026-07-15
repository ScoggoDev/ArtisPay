import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ArtisanLogo from '../components/ArtisanLogo';

function Perfil() {
  const { usuario, logout } = useAuth();
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const handleDesactivar = async () => {
    if (!window.confirm('¿Estás seguro de que querés desactivar tu cuenta?')) return;
    try {
      await api.put('/usuarios/me/desactivar');
      logout();
      navigate('/');
    } catch {
      setMensaje('Error al desactivar la cuenta');
    }
  };

  if (!usuario) return null;

  const rolLabels = { cliente: 'Cliente', emprendedor: 'Emprendedor', admin: 'Administrador', moderador: 'Moderador' };

  return (
    <div className="page-enter">
      <div className="container section" style={{ maxWidth: 500, margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Mi perfil</h2>
        {mensaje && (
          <div className="alert alert-error">
            {mensaje}
            <button className="alert-close" onClick={() => setMensaje('')}>&times;</button>
          </div>
        )}
        <div className="edit-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
            <ArtisanLogo nombre={usuario.nombre_usuario} size={56} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{usuario.nombre_usuario}</div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.88rem' }}>{usuario.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span className="badge badge-sage">{rolLabels[usuario.tipo] || usuario.tipo}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />
          <button className="btn btn-danger btn-sm" onClick={handleDesactivar}>Desactivar cuenta</button>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
