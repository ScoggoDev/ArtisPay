import { Link } from 'react-router-dom';

const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23F5EDE4'/%3E%3Ctext x='50%25' y='45%25' font-family='Georgia,serif' font-size='36' fill='%23D4A27F' text-anchor='middle' dominant-baseline='middle'%3E✦%3C/text%3E%3Ctext x='50%25' y='62%25' font-family='Georgia,serif' font-size='13' fill='%23B08060' text-anchor='middle' dominant-baseline='middle'%3ESin imagen%3C/text%3E%3C/svg%3E`;

function resolveUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('ls:')) return localStorage.getItem(url) || null;
  return url;
}

function ProductCard({ producto }) {
  const getImageUrl = (prod) => {
    if (!prod) return null;
    
    if (typeof prod.imagenes === 'string') return prod.imagenes;
    
    if (typeof prod.imagen === 'string') return prod.imagen;
    
    if (Array.isArray(prod.imagenes) && prod.imagenes.length > 0) {
      const first = prod.imagenes[0];
      return typeof first === 'string' ? first : first?.url;
    }

    return null;
  };

  const rawUrl = getImageUrl(producto);
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
      <img 
        src={imagen} 
        alt={producto.nombre} 
        className="card-img" 
        style={{ 
          height: '200px', 
          objectFit: 'cover', 
          width: '100%',
          flexShrink: 0 
        }} 
      />

      <div 
        className="card-body" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1, 
          padding: '1rem' 
        }}
      >
        {/* Nombre truncado a 2 líneas */}
        <div 
          className="card-title" 
          style={{ 
            ...lineClampStyle, 
            lineHeight: '1.3', 
            marginBottom: '0.5rem',
            minHeight: '2.6em' // Reserva el espacio para mantener alineación
          }}
          title={producto.nombre}
        >
          {producto.nombre}
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
          title={producto.descripcion}
        >
          {producto.descripcion}
        </p>

        {/* Bloque inferior: Empujado hacia el final con marginTop: 'auto' */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="price">{producto.precio ? `$${producto.precio}` : 'Consultar precio'}</span>
            {producto.categoria_nombre && (
              <span className="badge badge-terracotta">{producto.categoria_nombre}</span>
            )}
          </div>

          {producto.emprendimiento_nombre && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              por <strong>{producto.emprendimiento_nombre}</strong>
            </p>
          )}

          <Link to={`/producto/${producto.id_producto}`} className="btn btn-outline btn-sm btn-block">
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;