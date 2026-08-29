import { useState, useEffect } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

function Favoritos() {
  const [favoritos, setFavoritos] = useState([]);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    api.get('/favoritos').then(r => setFavoritos(r.data)).catch(() => {});
  }, []);

  const quitarFavorito = async (id_producto) => {
    try {
      await api.delete(`/favoritos/${id_producto}`);
      setFavoritos(favoritos.filter(f => f.id_producto !== id_producto));
      setMensaje('Eliminado de favoritos');
    } catch {
      setMensaje('Error al quitar de favoritos');
    }
  };

  return (
    <div className="page-enter container" style={{ display: 'flex', flexDirection: 'column', minHeight: '78vh' }}>
      <div className="section">
        <h2 style={{ marginBottom: '1.5rem' }}>Mis favoritos</h2>
        {mensaje && (
          <div className="alert alert-info flash">
            {mensaje}
            <button className="alert-close" onClick={() => setMensaje('')}>&times;</button>
          </div>
        )}
        {favoritos.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">&#9829;</div>
            <p>No tenés productos favoritos todavía.</p>
          </div>
        ) : (
          <div className="grid grid-4">
            {favoritos.map(f => f.producto && (
              <div key={f.id_favorito}>
                <ProductCard producto={f.producto} />
                <button className="btn btn-ghost btn-sm btn-block" style={{ marginTop: '0.5rem' }} onClick={() => quitarFavorito(f.id_producto)}>
                  Quitar de favoritos
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Favoritos;
