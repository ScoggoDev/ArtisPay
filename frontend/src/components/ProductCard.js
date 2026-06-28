import { Link } from 'react-router-dom';

function ProductCard({ producto }) {
  const imagen = producto.imagenes?.[0]?.url || 'https://via.placeholder.com/400x280/F5EDE4/D4A27F?text=Sin+imagen';

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
