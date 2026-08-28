import { Link } from 'react-router-dom';

const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23F5EDE4'/%3E%3Ctext x='50%25' y='45%25' font-family='Georgia,serif' font-size='36' fill='%23D4A27F' text-anchor='middle' dominant-baseline='middle'%3E✦%3C/text%3E%3Ctext x='50%25' y='62%25' font-family='Georgia,serif' font-size='13' fill='%23B08060' text-anchor='middle' dominant-baseline='middle'%3ESin imagen%3C/text%3E%3C/svg%3E`;

function resolveUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('ls:')) return localStorage.getItem(url) || null;
  return url;
}

function ServiceCard({ servicio }) {

  const getImageUrl = (servicio) => {
    if (!servicio) return null;

    if (typeof servicio.imagenes === 'string') return servicio.imagenes;

    if (typeof servicio.imagen === 'string') return servicio.imagen;

    if (Array.isArray(servicio.imagenes) && servicio.imagenes.length > 0) {
      const first = servicio.imagenes[0];
      return typeof first === 'string' ? first : first?.url;
    }

    return null;
  };

  const rawUrl = getImageUrl(servicio);
  const imagen = resolveUrl(rawUrl) || PLACEHOLDER;


  return (
    <div className="card">
      {imagen ? <img src={imagen} alt={servicio.nombre} className="card-img" /> :
        <div style={{
          height: 140,
          background: 'linear-gradient(135deg, var(--sage-light) 0%, var(--linen) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
        }}>
          ✦</div>}

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
        <Link to={`/servicio/${servicio.id_servicio}`} className="btn btn-outline btn-sm btn-block">
          Ver detalle
        </Link>
      </div>
    </div>
  );
}

export default ServiceCard;
