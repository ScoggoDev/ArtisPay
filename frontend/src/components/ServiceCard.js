import { Link } from 'react-router-dom';

function ServiceCard({ servicio }) {
  return (
    <div className="card">
      <div style={{
        height: 140,
        background: 'linear-gradient(135deg, var(--sage-light) 0%, var(--linen) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2.5rem',
      }}>
        ✦
      </div>
      <div className="card-body">
        <div style={{ marginBottom: '0.4rem' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            background: 'var(--sage-light)',
            color: 'var(--sage)',
            padding: '2px 8px',
            borderRadius: 4,
          }}>
            Servicio
          </span>
        </div>
        <div className="card-title">{servicio.nombre}</div>
        <p className="card-text">
          {servicio.descripcion?.substring(0, 80)}
          {servicio.descripcion?.length > 80 ? '...' : ''}
        </p>
        <div style={{ marginBottom: '0.5rem' }}>
          {servicio.precio ? (
            <span className="price">${parseFloat(servicio.precio).toLocaleString('es-UY')}</span>
          ) : (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600 }}>Precio a convenir</span>
          )}
        </div>
        {servicio.emprendimiento_nombre && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '0.8rem' }}>
            por <strong>{servicio.emprendimiento_nombre}</strong>
          </p>
        )}
        <Link to={`/emprendedor/${servicio.id_emprendimiento}`} className="btn btn-outline btn-sm btn-block">
          Ver emprendedor
        </Link>
      </div>
    </div>
  );
}

export default ServiceCard;
