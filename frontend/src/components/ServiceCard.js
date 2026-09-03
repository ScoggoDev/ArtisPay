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

  // Estilo reutilizable para truncar texto a máximo 2 líneas con puntos suspensivos
  const lineClampStyle = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  return (
    <div 
      className="card" 
      style={{ 
        height: '490px', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {imagen ? (
        <img 
          src={imagen} 
          alt={servicio.nombre} 
          className="card-img" 
          style={{ 
            height: '200px', 
            objectFit: 'cover', 
            width: '100%',
            flexShrink: 0 
          }} 
        />
      ) : (
        <div style={{
          height: 200,
          background: 'linear-gradient(135deg, var(--sage-light) 0%, var(--linen) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          flexShrink: 0
        }}>
          ✦
        </div>
      )}

      <div 
        className="card-body" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1, 
          padding: '1rem' 
        }}
      >
        {/* Badge de Servicio fijo arriba */}
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

        {/* Nombre truncado a 2 líneas */}
        <div 
          className="card-title" 
          style={{ 
            ...lineClampStyle, 
            lineHeight: '1.3', 
            marginBottom: '0.5rem',
            minHeight: '2.6em' // Reserva el espacio para mantener la alineación
          }}
          title={servicio.nombre}
        >
          {servicio.nombre}
        </div>

        {/* Descripción truncada a 2 líneas */}
        <p 
          className="card-text" 
          style={{ 
            ...lineClampStyle, 
            lineHeight: '1.4', 
            marginBottom: '0.8rem',
            color: 'var(--text-light, #666)'
          }}
          title={servicio.descripcion}
        >
          {servicio.descripcion}
        </p>

        {/* Bloque inferior: Empujado al fondo con marginTop: 'auto' */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            {servicio.precio ? (
              <span className="price">${servicio.precio}</span>
            ) : (
              <span className="price">Precio a convenir</span>
            )}
          </div>

          {servicio.emprendimiento_nombre && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              por <strong>{servicio.emprendimiento_nombre}</strong>
            </p>
          )}

          <Link to={`/servicio/${servicio.id_servicio}`} className="btn btn-outline btn-sm btn-block">
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ServiceCard;