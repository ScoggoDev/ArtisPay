import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ArtisanLogo from '../components/ArtisanLogo';
import { useAuth } from '../context/AuthContext';

function Emprendedores() {
  const { usuario } = useAuth();
  const [emprendimientos, setEmprendimientos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [msgType, setMsgType] = useState('success');

  useEffect(() => {
    api.get('/emprendimientos').then(r => setEmprendimientos(r.data)).catch(() => { });
  }, []);

  function resolveUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('ls:')) return localStorage.getItem(url) || null;
    return url;
  }

  const handleDestacado = (id_emprendimiento) => {
    try {
      api.put('/emprendimientos/emprendedor-destacado', { id_emprendimiento })
        .then(() => {
          setEmprendimientos(emprendimientos.map(e =>
            e.id_emprendimiento === id_emprendimiento ? { ...e, destacado: true } : e
          ));
        });
      setMensaje(`Emprendimiento destacado`);
    } catch (error) {
      setMsgType('error');
      setMensaje(`Error al destacar el emprendimiento: ${error.message}`);
    }
  };

  return (
    <div className="page-enter">
      <div className="container section">
        {mensaje && (
          <div className={`alert alert-${msgType}`}>
            {mensaje}
            <button className="alert-close" onClick={() => setMensaje('')}>&times;</button>
          </div>
        )}
        <h2 style={{ marginBottom: '1.5rem' }}>Emprendedores de Paysandú</h2>
        {emprendimientos.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">&#127912;</div>
            <p>Aún no hay emprendedores registrados.</p>
          </div>
        ) : (
          <div className="grid grid-4">
            {emprendimientos.map(e => (
              <div key={e.id_emprendimiento} className="emp-card">
                {e.imagen_perfil ? (
                  <img src={resolveUrl(e.imagen_perfil)} alt={e.nombre} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <ArtisanLogo nombre={e.nombre} id_categoria={e.id_categoria} size={80} />
                )}
                <div className="emp-name">{e.nombre}</div>
                <p className="emp-desc">{e.descripcion?.substring(0, 80)}</p>
                {e.ubicacion && <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.8rem' }}>{e.ubicacion}</p>}
                <Link to={`/emprendedor/${e.id_emprendimiento}`} className="btn btn-outline btn-sm">Ver perfil</Link>
                {usuario?.tipo === 'admin' && (
                  <button className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => handleDestacado(e.id_emprendimiento)}>
                    Hacer emprendedor de la semana
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Emprendedores;
