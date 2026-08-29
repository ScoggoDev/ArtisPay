import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PLACEHOLDER = 'https://via.placeholder.com/600x400/F5EDE4/D4A27F?text=Sin+imagen';

function resolveUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('ls:')) return localStorage.getItem(url) || null;
  return url;
}

function ProductoDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [producto, setProducto] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [reportar, setReportar] = useState(false);
  const [ocultar, setOcultar] = useState(false);
  const [motivo_reporte, setMotivoReporte] = useState('');
  const [comentarios_reporte, setComentariosReporte] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Estados para el efecto Zoom
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  const crearReporte = useAuth().crearReporte;
  const ocultarProducto = useAuth().ocultarProducto;

  useEffect(() => {
    api.get(`/productos/${id}`).then(r => setProducto(r.data)).catch(() => { });
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

  // Obtener array limpio de URLs de imágenes
  const getImageUrls = (prod) => {
    if (!prod) return [];

    let list = [];

    if (Array.isArray(prod.imagenes)) {
      list = prod.imagenes;
    } else if (typeof prod.imagenes === 'string') {
      try {
        const parsed = JSON.parse(prod.imagenes);
        list = Array.isArray(parsed) ? parsed : [prod.imagenes];
      } catch {
        list = [prod.imagenes];
      }
    } else if (typeof prod.imagen === 'string') {
      list = [prod.imagen];
    }

    const resolvedList = list
      .map(item => (typeof item === 'string' ? item : item?.url))
      .map(url => resolveUrl(url))
      .filter(Boolean);

    return resolvedList;
  };

  if (!producto) return <div className="container section"><p>Cargando producto...</p></div>;

  const imagenes = getImageUrls(producto);
  const totalImagenes = imagenes.length;
  const emp = producto.emprendimiento;

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? totalImagenes - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === totalImagenes - 1 ? 0 : prev + 1));
  };

  // Funciones para calcular la posición del ratón sobre la imagen
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleMouseEnter = () => setIsZoomed(true);
  const handleMouseLeave = () => setIsZoomed(false);

  const currentImage = totalImagenes > 0 ? imagenes[currentIndex] : PLACEHOLDER;

  const handleReportar = () => {
    setReportar(prev => {
      const nuevoEstado = !prev;
      if (nuevoEstado) setOcultar(false);
      return nuevoEstado;
    });
  };

  const handleOcultar = () => {
    setOcultar(prev => {
      const nuevoEstado = !prev;
      if (nuevoEstado) setReportar(false);
      return nuevoEstado;
    });
  };

  const reportarProducto = async () => {
    if (!motivo_reporte || motivo_reporte.trim() === '') {
      setMensaje('Por favor, selecciona un motivo para continuar.');
      setMsgType('error');
      return;
    }
    try {
      await crearReporte(usuario.id_usuario, emp.id_emprendimiento, parseInt(id), motivo_reporte, comentarios_reporte);
      setMensaje('Producto reportado');
      setMsgType('success');
      setReportar(false);
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al reportar');
      setMsgType('error');
    }
  };

  const ocultarProd = async () => {
    try {
      await ocultarProducto(parseInt(id));
      setMensaje('Producto ocultado');
      setMsgType('success');
      setOcultar(false);
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al ocultar');
      setMsgType('error');
    }
  };

  return (
    <div className="page-enter container">
      <div className="section" style={{minHeight: '78vh' }}>
        {mensaje && (
          <div className={`alert alert-${msgType} flash`}>
            {mensaje}
            <button className="alert-close" onClick={() => setMensaje('')}>&times;</button>
          </div>
        )}

        <div className="detail-grid">
          {/* SECCIÓN IMÁGENES / CARRUSEL CON ZOOM */}
          <div>
            <div
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
              style={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                borderRadius: 'var(--radius, 8px)',
                cursor: 'zoom-in'
              }}
            >
              <img
                src={currentImage}
                alt={producto.nombre}
                className="detail-img"
                style={{
                  width: '100%',
                  display: 'block',
                  transition: isZoomed ? 'transform 0.1s ease-out' : 'transform 0.3s ease',
                  transform: isZoomed ? 'scale(1.8)' : 'scale(1)',
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                }}
              />

              {/* Botones de navegación (se ocultan opcionalmente al hacer zoom para no estorbar) */}
              {totalImagenes > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '12px',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      zIndex: 3,
                      userSelect: 'none',
                      opacity: isZoomed ? 0.2 : 1,
                      transition: 'opacity 0.2s'
                    }}
                    title="Anterior"
                  >
                    &#10094;
                  </button>

                  <button
                    onClick={handleNext}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      zIndex: 3,
                      userSelect: 'none',
                      opacity: isZoomed ? 0.2 : 1,
                      transition: 'opacity 0.2s'
                    }}
                    title="Siguiente"
                  >
                    &#10095;
                  </button>

                  {/* Indicador de posición / Puntos */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '6px',
                      zIndex: 3,
                      opacity: isZoomed ? 0.2 : 1,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {imagenes.map((_, idx) => (
                      <span
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Miniaturas (Thumbnails) */}
            {totalImagenes > 1 && (
              <div className="detail-thumbs" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                {imagenes.map((imgUrl, idx) => (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt={`Miniatura ${idx + 1}`}
                    className="detail-thumb"
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      cursor: 'pointer',
                      border: idx === currentIndex ? '2px solid var(--terracotta, #D4A27F)' : '2px solid transparent',
                      opacity: idx === currentIndex ? 1 : 0.7,
                      transition: 'all 0.2s ease',
                      borderRadius: 'var(--radius-sm, 4px)'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* DETALLES DEL PRODUCTO */}
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span className="badge badge-terracotta" style={{fontSize: '0.9rem', marginBottom: '0.8rem'}}>{producto.categoria_nombre}</span>
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

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '2rem 0 0 0' }}>
              {usuario && (
                <button className="btn btn-danger" style={{ marginTop: '1rem' }} onClick={handleReportar}>
                  Reportar
                </button>
              )}

              {(usuario?.tipo === 'admin' || usuario?.tipo === 'moderador') && (
                <button className="btn btn-danger" style={{ marginTop: '1rem' }} onClick={handleOcultar}>
                  Ocultar
                </button>
              )}
            </div>

            {reportar && (
              <div className="report-box" style={{ marginTop: '1rem' }}>
                <p>¿Estás seguro de que deseas reportar este producto?</p>
                <form onSubmit={e => e.preventDefault()}>
                  <div className="form-group">
                    <label htmlFor="reportMotive">Seleccione motivo</label>
                    <br />
                    <select
                      className="form-control"
                      id="reportMotive"
                      value={motivo_reporte}
                      onChange={(e) => setMotivoReporte(e.target.value)}
                      required
                    >
                      <option value="" disabled>Seleccione una opción</option>
                      <option value="Producto falso o engañoso">Producto falso o engañoso</option>
                      <option value="Producto no disponible">Producto no disponible</option>
                      <option value="Producto con problemas de calidad">Producto con problemas de calidad</option>
                      <option value="Producto no corresponde a la descripción">Producto no corresponde a la descripción</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="reportComents">Ingrese comentarios</label>
                    <br />
                    <textarea
                      className="form-control"
                      id="reportComents"
                      rows="3"
                      value={comentarios_reporte}
                      onChange={(e) => setComentariosReporte(e.target.value)}
                    />
                  </div>
                </form>
                <button className="btn btn-danger" onClick={reportarProducto} style={{ marginRight: '0.5rem' }}>
                  Confirmar
                </button>
                <button className="btn btn-secondary" onClick={() => setReportar(false)}>
                  Cancelar
                </button>
              </div>
            )}

            {ocultar && (
              <div className="toast" role="alert" aria-live="assertive" aria-atomic="true" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <div className="toast-body">
                  ¿Desea ocultar este producto? Esta acción no se puede deshacer.
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-light)' }}>El producto no se volverá a mostrar en el catálogo.</p>
                  <div style={{ marginTop: '1rem' }}>
                    <button className="btn btn-danger" onClick={() => ocultarProd()} style={{ marginRight: '0.5rem' }}>
                      Confirmar
                    </button>
                    <button className="btn btn-secondary" onClick={() => setOcultar(false)}>
                      Cancelar
                    </button>
                  </div>
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