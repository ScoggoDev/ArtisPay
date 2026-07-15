import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';

function Home() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/productos').catch(() => ({ data: [] })),
      api.get('/servicios').catch(() => ({ data: [] })),
    ]).then(([prodRes, servRes]) => {
      const productos = prodRes.data.map(p => ({ ...p, _tipo: 'producto', _fecha: p.fecha_publicacion }));
      const servicios = servRes.data.map(s => ({ ...s, _tipo: 'servicio', _fecha: s.fecha_creacion }));
      const combined = [...productos, ...servicios]
        .sort((a, b) => new Date(b._fecha) - new Date(a._fecha))
        .slice(0, 6);
      setItems(combined);
    });
  }, []);

  return (
    <div className="page-enter">
      <section className="hero">
        <div className="container hero-content">
          <h1>
            Descubrí lo <span className="accent">hecho a mano</span> en Paysandú
          </h1>
          <p className="hero-subtitle">
            Conectá con artesanos y emprendedores locales. Productos únicos, historias reales, talento sanducero.
          </p>
          <div className="hero-actions">
            <Link to="/catalogo" className="btn btn-primary btn-lg">Explorar catálogo</Link>
            <Link to="/registro" className="btn btn-secondary btn-lg">Soy emprendedor</Link>
          </div>
        </div>
        <div className="hero-decoration" />
        <div className="hero-decoration-2" />
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Últimas publicaciones</h2>
            <Link to="/catalogo">Ver catálogo &rarr;</Link>
          </div>
          {items.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">&#127912;</div>
              <p>Aún no hay publicaciones. ¡Sé el primero en publicar!</p>
              <Link to="/registro" className="btn btn-primary" style={{ marginTop: '1rem' }}>Registrar mi emprendimiento</Link>
            </div>
          ) : (
            <div className="grid grid-3">
              {items.map(item =>
                item._tipo === 'producto'
                  ? <ProductCard key={`p-${item.id_producto}`} producto={item} />
                  : <ServiceCard key={`s-${item.id_servicio}`} servicio={item} />
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
