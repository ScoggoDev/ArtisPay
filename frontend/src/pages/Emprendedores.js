import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Emprendedores() {
  const [emprendimientos, setEmprendimientos] = useState([]);

  useEffect(() => {
    api.get('/emprendimientos').then(r => setEmprendimientos(r.data)).catch(() => {});
  }, []);

  return (
    <div className="page-enter">
      <div className="container section">
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
                <div className="emp-avatar">{e.nombre.charAt(0).toUpperCase()}</div>
                <div className="emp-name">{e.nombre}</div>
                <p className="emp-desc">{e.descripcion?.substring(0, 80)}</p>
                {e.ubicacion && <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.8rem' }}>{e.ubicacion}</p>}
                <Link to={`/emprendedor/${e.id_emprendimiento}`} className="btn btn-outline btn-sm">Ver perfil</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Emprendedores;
