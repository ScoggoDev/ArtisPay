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
  const [reportar, setReportar] = useState(false);
  const [ocultar, setOcultar] = useState(false);
  const [motivo_reporte, setMotivoReporte] = useState('');
  const [comentarios_reporte, setComentariosReporte] = useState('');
  const crearReporte = useAuth().crearReporte;
  const ocultarProducto = useAuth().ocultarProducto;

  useEffect(() => {
    api.get(`/productos/${id}`).then(r => setProducto(r.data)).catch(() => { });
  }, [id]);

  function resolveUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('ls:')) return localStorage.getItem(url) || null;
    return url;
  }

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

  if (!producto) return <div className="container section"><p>Cargando producto...</p></div>;

  const imagen = producto.imagenes?.[0]?.url || 'https://via.placeholder.com/600x400/F5EDE4/D4A27F?text=Sin+imagen';
  const emp = producto.emprendimiento;

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
            <img src={resolveUrl(imagen)} alt={producto.nombre} className="detail-img" />
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

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '2 rem' }}>
              {usuario && <button className="btn btn-danger" style={{ marginTop: '1rem' }} onClick={handleReportar}>
                Reportar
              </button>}

              {(usuario?.tipo === 'admin' || usuario?.tipo === 'moderador') &&
                <button className="btn btn-danger" style={{ marginTop: '1rem' }} onClick={handleOcultar}>
                  Ocultar
                </button>}
            </div>


            {reportar && (
              <div className="report-box" style={{ marginTop: '1rem' }}>
                <p>¿Estás seguro de que deseas reportar este producto?</p>
                <form>
                  <div className="form-group">
                    <label for="reportMotive">Seleccione motivo</label>
                    <br />
                    <select className="form-control" id="reportMotive"
                      value={motivo_reporte} onChange={(e) => setMotivoReporte(e.target.value)} required>
                      <option value="" disabled>Seleccione una opción</option>
                      <option value="Producto falso o engañoso">Producto falso o engañoso</option>
                      <option value="Producto no disponible">Producto no disponible</option>
                      <option value="Producto con problemas de calidad">Producto con problemas de calidad</option>
                      <option value="Producto no corresponde a la descripción">Producto no corresponde a la descripción</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label for="reportComents">Ingrese comentarios</label>
                    <br />
                    <textarea className="form-control" id="reportComents" rows="3" value={comentarios_reporte} onChange={(e) => setComentariosReporte(e.target.value)}></textarea>
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

            {ocultar &&
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
              </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductoDetalle;
