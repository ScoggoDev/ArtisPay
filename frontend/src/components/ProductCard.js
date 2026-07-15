import { Link } from 'react-router-dom';

const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23F5EDE4'/%3E%3Ctext x='50%25' y='45%25' font-family='Georgia,serif' font-size='36' fill='%23D4A27F' text-anchor='middle' dominant-baseline='middle'%3E✦%3C/text%3E%3Ctext x='50%25' y='62%25' font-family='Georgia,serif' font-size='13' fill='%23B08060' text-anchor='middle' dominant-baseline='middle'%3ESin imagen%3C/text%3E%3C/svg%3E`;

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('ls:')) return localStorage.getItem(url) || null;
  return url;
}

function ProductCard({ producto }) {
  const rawUrl = producto.imagenes?.[0]?.url;
  const imagen = resolveUrl(rawUrl) || PLACEHOLDER;

  return (
    <div className="card">
      <img src={imagen} alt={producto.nombre} className="card-img" />
      <div className="card-body">
        <div className="card-title">{producto.nombre}</div>
        <p className="card-text">
          {producto.descripcion?.substring(0, 80)}
          {producto.descripcion?.length > 80 ? '...' : ''}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span className="price">${producto.precio}</span>
          {producto.categoria_nombre && (
            <span className="badge badge-terracotta">{producto.categoria_nombre}</span>
          )}
        </div>
        {producto.emprendimiento_nombre && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '0.8rem' }}>
            por <strong>{producto.emprendimiento_nombre}</strong>
          </p>
        )}
        <Link to={`/producto/${producto.id_producto}`} className="btn btn-outline btn-sm btn-block">
          Ver detalle
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;
