import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

function Home() {
  const [productos, setProductos] = useState([]);
  const [emprendimientos, setEmprendimientos] = useState([]);

  useEffect(() => {
    api.get('/productos').then(r => setProductos(r.data.slice(0, 6))).catch(() => {});
    api.get('/emprendimientos').then(r => setEmprendimientos(r.data.slice(0, 4))).catch(() => {});
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

      {productos.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2>Productos recientes</h2>
              <Link to="/catalogo">Ver todos &rarr;</Link>
            </div>
            <div className="grid grid-3">
              {productos.map(p => (
                <ProductCard key={p.id_producto} producto={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" style={{ background: 'var(--linen)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Emprendedores</h2>
            <Link to="/emprendedores">Ver todos &rarr;</Link>
          </div>
          {emprendimientos.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">&#127912;</div>
              <p>Aún no hay emprendedores registrados. ¡Sé el primero!</p>
              <Link to="/registro" className="btn btn-primary" style={{ marginTop: '1rem' }}>Registrar mi emprendimiento</Link>
            </div>
          ) : (
            <div className="grid grid-4">
              {emprendimientos.map(e => (
                <div key={e.id_emprendimiento} className="emp-card">
                  <div className="emp-avatar">
                    {e.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="emp-name">{e.nombre}</div>
                  <p className="emp-desc">{e.descripcion?.substring(0, 70)}</p>
                  <Link to={`/emprendedor/${e.id_emprendimiento}`} className="btn btn-outline btn-sm">
                    Ver perfil
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
