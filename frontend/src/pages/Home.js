import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import ArtisanLogo from '../components/ArtisanLogo';
import ServiceCard from '../components/ServiceCard';
import { useAuth } from '../context/AuthContext';


function Home() {
  const [items, setItems] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { usuario } = useAuth();


  useEffect(() => {
    // cargar productos y servicios recientes //
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

    // cargar emprendedor de la semana //
    api.get('emprendimientos/emprendedor-destacado')
      .then((res) => {
        if (res.data) {
          setFeatured({
            perfil: res.data.perfil || res.data,
            productos: (res.data.productos || []).slice(0, 5),
          });
        }
      })
      .catch((err) => console.error('Error al cargar emprendedor destacado:', err));
  }, []);

  function resolveUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('ls:')) return localStorage.getItem(url) || null;
    return url;
  }

  // lógica para el carrusel //
  const [itemsToShow, setItemsToShow] = useState(1);

  useEffect(() => {
    const updateItemsToShow = () => {
      if (window.innerWidth >= 1024) {
        setItemsToShow(3); // Desktop: 3 productos
      } else if (window.innerWidth >= 640) {
        setItemsToShow(2); // Tablet: 2 productos
      } else {
        setItemsToShow(1); // Mobile: 1 producto
      }
    };

    updateItemsToShow(); // Evaluar al montar
    window.addEventListener('resize', updateItemsToShow);
    return () => window.removeEventListener('resize', updateItemsToShow);
  }, []);

  const showControls = featured?.productos?.length > itemsToShow;

  // handlers para el carrusel // 
  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev >= featured.productos.length - itemsToShow ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? featured.productos.length - itemsToShow : prev - 1
    );
  };

  return (
    <div className="page-enter">
      {/* Hero Section */}
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
            {
              !usuario && (<Link to="/registro" className="btn btn-secondary btn-lg">Soy emprendedor</Link>)
            }
          </div>
        </div>
        <div className="hero-decoration" />
        <div className="hero-decoration-2" />
      </section>

      {/* Sección: Emprendedor de la Semana */}


      {featured && featured.perfil && (
        <section className="section featured-section">
          <div className="container">

            {/* Encabezado con título a la izquierda y botón a la derecha */}
            <div className="section-header">
              <h2>Emprendedor de la semana</h2>
              {usuario?.tipo === 'admin' && (
                <Link className="btn btn-sm" to="/emprendedores">
                  Cambiar emprendedor destacado
                </Link>
              )}
            </div>

            <div className="featured-card">
              {/* Información del perfil */}
              <div className="featured-profile">
                {featured.perfil.imagen_perfil ? (
                  <img
                    src={resolveUrl(featured.perfil.imagen_perfil)}
                    alt={featured.perfil.nombre}
                    className="featured-avatar"
                  />
                ) : (
                  <ArtisanLogo nombre={featured.perfil.nombre} id_categoria={featured.perfil.id_categoria} size={100} />
                )}
                <div className="featured-info">
                  {featured.perfil.categoria && (
                    <span>{featured.perfil.categoria}</span>
                  )}
                  <h3>{featured.perfil.nombre}</h3>
                  <p>{featured.perfil.descripcion}</p>
                  {featured.perfil.id_emprendimiento && (
                    <Link
                      to={`/emprendedor/${featured.perfil.id_emprendimiento}`}
                      style={{ fontWeight: 'bold' }}
                    >
                      Ver perfil completo &rarr;
                    </Link>
                  )}
                </div>
              </div>

              {/* Carrusel de Productos */}
              {featured.productos && featured.productos.length > 0 && (
                <div className="featured-products">
                  <h4 style={{ margin: '0.5rem' }} >Productos destacados de {featured.perfil.nombre}</h4>
                  <div className="carousel-wrapper">

                    {/* Muestra la flecha previa solo si no caben todos los productos */}
                    {showControls && (
                      <button className="carousel-arrow prev" onClick={prevSlide} aria-label="Anterior">
                        &#10094;
                      </button>
                    )}

                    <div className="carousel-viewport">
                      <div
                        className="carousel-track"
                        style={{ transform: `translateX(-${currentSlide * (100 / itemsToShow)}%)` }}
                      >
                        {featured.productos.map((prod) => (
                          <div key={prod.id_producto || prod.id} className="carousel-slide">
                            <ProductCard producto={prod} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Muestra la flecha siguiente solo si no caben todos los productos */}
                    {showControls && (
                      <button className="carousel-arrow next" onClick={nextSlide} aria-label="Siguiente">
                        &#10095;
                      </button>
                    )}
                  </div>

                  {/* Indicadores: solo se muestran si hay más productos que espacios en pantalla */}
                  {showControls && (
                    <div className="carousel-dots">
                      {Array.from({ length: featured.productos.length - itemsToShow + 1 }).map((_, idx) => (
                        <button
                          key={idx}
                          className={`dot ${idx === currentSlide ? 'active' : ''}`}
                          onClick={() => setCurrentSlide(idx)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Sección: Últimas publicaciones */}
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
              <Link to="/registro" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Registrar mi emprendimiento
              </Link>
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