import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ProductoDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [producto, setProducto] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [msgType, setMsgType] = useState('info');

  useEffect(() => {
    api.get(`/productos/${id}`).then(r => setProducto(r.data)).catch(() => {});
  }, [id]);

  const agregarFavorito = async () => {
    try {
      await api.post(`/favoritos/${id}`);
      setMensaje('Agregado a favoritos');
      setMsgType('success');
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error');
      setMsgType('error');
    }
  };

  if (!producto) return <div className="container section"><p>Cargando...</p></div>;

  const imagen = producto.imagenes?.[0]?.url || 'https://via.placeholder.com/600x400/F5EDE4/D4A27F?text=Sin+imagen';
  const emp = producto.emprendimiento;

  return (
    <div className="page-enter">
      <div className="container section">
        {mensaje && (
          <div className={`alert alert-${msgType}`}>
            {mensaje}
            <button className="alert-close" onClick={() => setMensaje('')}>&times;</button>
          </div>
        )}

        <div className="detail-grid">
          <div>
            <img src={imagen} alt={producto.nombre} className="detail-img" />
            {producto.imagenes?.length > 1 && (
              <div className="detail-thumbs">
                {producto.imagenes.map(img => (
                  <img key={img.id_imagen} src={img.url} alt="" className="detail-thumb" />
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span className="badge badge-terracotta">{producto.categoria_nombre}</span>
              {producto.destacado && <span className="badge badge-sunflower" style={{ marginLeft: '0.4rem' }}>Destacado</span>}
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>{producto.nombre}</h2>
            <div className="price" style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>${producto.precio}</div>
            <p style={{ lineHeight: 1.7, color: 'var(--text-light)', marginBottom: '1.5rem' }}>{producto.descripcion}</p>

            {usuario && (
              <button className="btn btn-secondary" onClick={agregarFavorito} style={{ marginBottom: '1rem' }}>
                &#9829; Agregar a favoritos
              </button>
            )}

            {emp && (
              <div className="contact-box">
                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{emp.nombre}</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', marginBottom: '0.8rem' }}>
                  {emp.descripcion?.substring(0, 120)}
                </p>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {emp.telefono && (
                    <a href={`https://wa.me/${emp.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="whatsapp-btn">
                      WhatsApp
                    </a>
                  )}
                  <Link to={`/emprendedor/${emp.id_emprendimiento}`} className="btn btn-outline btn-sm">
                    Ver perfil
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductoDetalle;
