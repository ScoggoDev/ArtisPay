import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';

// Corregir íconos por defecto de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Función para resolver URLs (LocalStorage o URL directa)
function resolveUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('ls:')) return localStorage.getItem(url) || null;
  return url;
}

function MiEmprendimiento() {
  const { emprendimiento: empCtx } = useAuth();
  const [emp, setEmp] = useState(null);
  const [productos, setProductos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [showModal, setShowModal] = useState(false);
  const [showServicioModal, setShowServicioModal] = useState(false);

  // Estados para productos (Edición y Creación con MÚLTIPLES IMÁGENES)
  const [editingProductoId, setEditingProductoId] = useState(null);
  const [productoForm, setProductoForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    id_categoria: '',
    imagenes: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);

  const [servicioForm, setServicioForm] = useState({ nombre: '', descripcion: '', precio: '', id_categoria: '' });

  // Referencias de inputs
  const productFileInputRef = useRef(null);
  const servicioFileInputRef = useRef(null);

  useEffect(() => {
    if (empCtx) {
      api.get(`/emprendimientos/${empCtx.id_emprendimiento}`).then(r => {
        setEmp(r.data);
        setProductos(r.data.productos || []);
        setServicios(r.data.servicios || []);
      }).catch(() => { });
    }
    api.get('/categorias').then(r => setCategorias(r.data)).catch(() => { });
  }, [empCtx]);

  const flash = (msg, type = 'success') => { setMensaje(msg); setMsgType(type); };

  // manejo de destacados
  const toggleDestacado = async (producto) => {
    const esDestacadoActualmente = Boolean(producto.destacado);
    const destacadosActuales = productos.filter(p => p.destacado);

    // Si no está destacado e intenta destacar uno más habiendo ya 5
    if (!esDestacadoActualmente && destacadosActuales.length >= 4) {
      flash('Ya tenés cuatro productos destacados', 'error');
      return;
    }

    const nuevoEstado = !esDestacadoActualmente;

    try {
      await api.patch(`/productos/${producto.id_producto}/destacado`, { destacado: nuevoEstado });

      // Actualizar estado local
      setProductos(prev =>
        prev.map(p =>
          p.id_producto === producto.id_producto
            ? { ...p, destacado: nuevoEstado }
            : p
        )
      );

      flash(nuevoEstado ? 'Producto destacado' : 'Producto quitado de destacados', 'success');
    } catch (err) {
      flash(err.response?.data?.error || 'Error al actualizar destacado', 'error');
    }
  };

  // manejo de imágenes múltiples para productos (hasta 5)
  const handleImageFile = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentImages = productoForm.imagenes || [];
    if (currentImages.length + files.length > 5) {
      flash('Solo podés agregar hasta 5 imágenes por producto.', 'error');
      if (productFileInputRef.current) productFileInputRef.current.value = '';
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        const key = `ls:artispay_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem(key, base64);

        setProductoForm(prev => ({
          ...prev,
          imagenes: [...prev.imagenes, key]
        }));
        setImagePreviews(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    if (productFileInputRef.current) productFileInputRef.current.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setProductoForm(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, idx) => idx !== indexToRemove)
    }));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // manejo de imágenes múltiples para servicios (hasta 5)
  const handleServiceImageFile = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentImages = servicioForm.imagenes || [];

    if (currentImages.length + files.length > 5) {
      flash('Solo podés agregar hasta 5 imágenes por servicio.', 'error');
      if (servicioFileInputRef.current) servicioFileInputRef.current.value = '';
      return;
    }

    const processedFiles = await Promise.all(
      files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const base64 = ev.target.result;
            const key = `ls:artispay_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            localStorage.setItem(key, base64);
            resolve({ key, base64 });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    const newKeys = processedFiles.map(f => f.key);
    const newPreviews = processedFiles.map(f => f.base64);

    setServicioForm(prev => ({
      ...prev,
      imagenes: [...(prev.imagenes || []), ...newKeys]
    }));

    setImagePreviews(prev => [...prev, ...newPreviews]);

    if (servicioFileInputRef.current) servicioFileInputRef.current.value = '';
  };

  const handleRemoveServiceImage = (indexToRemove) => {
    setServicioForm(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, idx) => idx !== indexToRemove)
    }));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleOpenCreateModal = () => {
    setEditingProductoId(null);
    setProductoForm({ nombre: '', descripcion: '', precio: '', id_categoria: '', imagenes: [] });
    setImagePreviews([]);
    setShowModal(true);
  };

  const handleOpenEditModal = (producto) => {
    setEditingProductoId(producto.id_producto);

    let listImagenes = [];
    if (Array.isArray(producto.imagenes)) {
      listImagenes = producto.imagenes;
    } else if (typeof producto.imagenes === 'string') {
      try {
        const parsed = JSON.parse(producto.imagenes);
        listImagenes = Array.isArray(parsed) ? parsed : [producto.imagenes];
      } catch {
        listImagenes = producto.imagenes ? [producto.imagenes] : [];
      }
    }

    setProductoForm({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio || '',
      id_categoria: producto.id_categoria || '',
      imagenes: listImagenes
    });

    setImagePreviews(listImagenes.map(img => resolveUrl(img)).filter(Boolean));
    setShowModal(true);
  };

  const handleSaveProducto = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productoForm,
        imagenes: productoForm.imagenes
      };

      if (editingProductoId) {
        const { data } = await api.put(`/productos/${editingProductoId}`, payload);
        setProductos(productos.map(p => p.id_producto === editingProductoId ? data : p));
        flash('Producto actualizado correctamente', 'success');
      } else {
        const { data } = await api.post('/productos', payload);
        setProductos([...productos, data]);
        flash('Producto agregado', 'success');
      }

      setProductoForm({ nombre: '', descripcion: '', precio: '', id_categoria: '', imagenes: [] });
      setImagePreviews([]);
      setEditingProductoId(null);
      setShowModal(false);
    } catch (err) {
      flash(err.response?.data?.error || 'Error al guardar el producto', 'error');
    }
  };

  const handleAddServicio = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...servicioForm, precio: servicioForm.precio ? servicioForm.precio : null };
      const { data } = await api.post('/servicios', payload);
      setServicios([...servicios, data]);
      setServicioForm({ nombre: '', descripcion: '', precio: '' });
      setShowServicioModal(false);
      flash('Servicio agregado', 'success');
    } catch (err) {
      flash(err.response?.data?.error || 'Error', 'error');
    }
  };

  const handleDeleteServicio = async (id) => {
    try {
      await api.delete(`/servicios/${id}`);
      setServicios(servicios.filter(s => s.id_servicio !== id));
      flash('Servicio eliminado', 'success');
    } catch (err) {
      flash(err.response?.data?.error || 'Error', 'error');
    }
  };

  const handleDeleteProducto = async (id) => {
    try {
      await api.delete(`/productos/${id}`);
      setProductos(productos.filter(p => p.id_producto !== id));
      flash('Producto eliminado', 'success');
    } catch (err) {
      flash(err.response?.data?.error || 'Error', 'error');
    }
  };

  if (!emp) return <div className="container section"><p>Cargando...</p></div>;

  return (
    <div className="page-enter container">
      <div className="section">
        <h2 style={{ marginBottom: '1.5rem' }}>Mi Taller</h2>

        {mensaje && (
          <div className={`alert alert-${msgType} flash`}>
            {mensaje}
            <button className="alert-close" style={{marginLeft:'5px'}} onClick={() => setMensaje('')}>&times;</button>
          </div>
        )}

        {/* Mis productos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Mis productos ({productos.length})</h3>
          <button className="btn btn-sage" onClick={handleOpenCreateModal}>+ Agregar producto</button>
        </div>

        {productos.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">&#128230;</div>
            <p>No tenés productos publicados aún. ¡Agregá el primero!</p>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Podes destacar hasta 4 productos para resaltarlos en tu perfil.</p>
            <div className="grid grid-3">

              {productos.map(p => (
                <div key={p.id_producto} style={{ position: 'relative' }}>
                  <ProductCard producto={{ ...p, emprendimiento_nombre: emp.nombre }} />

                  {/* Botón de Estrella para Destacar (Esquina inferior derecha de la tarjeta) */}
                  <button
                    onClick={() => toggleDestacado(p)}
                    title={p.destacado ? 'Quitar destacado' : 'Destacar producto'}
                    style={{
                      position: 'absolute',
                      right: '8%',
                      bottom: '25%',
                      background: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                      zIndex: 5,
                      color: p.destacado ? '#fd7435' : '#ccc',
                      fontSize: '20px',
                      lineHeight: 1
                    }}
                  >
                    {p.destacado ? '★' : '☆'}
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem', marginTop: '0.5rem' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleOpenEditModal(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleDeleteProducto(p.id_producto)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mis servicios */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1.5rem' }}>
          <h3>Mis servicios ({servicios.length})</h3>
          <button className="btn btn-sage" onClick={() => setShowServicioModal(true)}>+ Agregar servicio</button>
        </div>

        {servicios.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">&#9997;</div>
            <p>No tenés servicios publicados aún. ¡Agregá el primero!</p>
          </div>
        ) : (
          <div className="grid grid-3" style={{ marginBottom: '3rem' }}>
            {servicios.map(s => (
              <div key={s.id_servicio}>
                <ServiceCard key={s.id_servicio} servicio={{ ...s, emprendimiento_nombre: emp.nombre }} />
                <div style={{ display: 'flex', margin: '1rem', marginTop: '0.5rem', justifyContent: 'right' }}>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ minWidth: '48%' }}
                    onClick={() => handleDeleteServicio(s.id_servicio)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Servicio */}
        {showServicioModal && (
          <div className="modal-overlay" onClick={() => setShowServicioModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Agregar servicio</h3>
                <button className="modal-close" onClick={() => setShowServicioModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleAddServicio}>
                <div className="form-group">
                  <label className="form-label">Nombre del servicio</label>
                  <input className="form-input" value={servicioForm.nombre} onChange={e => setServicioForm({ ...servicioForm, nombre: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-textarea" rows={2} value={servicioForm.descripcion} onChange={e => setServicioForm({ ...servicioForm, descripcion: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Precio (opcional)</label>
                    <input className="form-input" type="number" step="0.01" value={servicioForm.precio} onChange={e => setServicioForm({ ...servicioForm, precio: e.target.value })} placeholder="Ej: 500" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <select className="form-select" value={servicioForm.id_categoria} onChange={e => setServicioForm({ ...servicioForm, id_categoria: e.target.value })} required>
                      <option value="">Seleccionar</option>
                      {categorias.map(c => (
                        <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* SECCIÓN DE IMÁGENES MULTIPLE */}
                <div className="form-group">
                  <label className="form-label">Imágenes del servicio (máx. 5)</label>
                  <input
                    type="file"
                    ref={servicioFileInputRef}
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="form-input"
                    onChange={handleServiceImageFile}
                    style={{ padding: '0.4rem' }}
                    disabled={servicioForm.imagenes?.length >= 5}
                  />
                  <small style={{ color: 'var(--text-light)', display: 'block', marginTop: '0.3rem' }}>
                    {servicioForm.imagenes?.length || 0} de 5 imágenes cargadas
                  </small>

                  {imagePreviews.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '0.5rem', marginTop: '0.8rem' }}>
                      {imagePreviews.map((src, index) => (
                        <div key={index} style={{ position: 'relative', width: '100%', height: '70px' }}>
                          <img
                            src={src}
                            alt={`Preview ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveServiceImage(index)}
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              background: '#dc3545',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              lineHeight: '1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Eliminar imagen"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', gap: '1rem' }}>
                  <button type="button" className="btn btn-outline btn-block" onClick={() => (
                    setServicioForm({ nombre: '', descripcion: '', precio: '', id_categoria: '', imagenes: [] }),
                    setImagePreviews([]),
                    setShowServicioModal(false)
                  )}>Cancelar</button>
                  <button type="submit" className="btn btn-sage btn-block">Publicar servicio</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Producto */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingProductoId ? 'Editar producto' : 'Agregar producto'}</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSaveProducto}>
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input className="form-input" value={productoForm.nombre} onChange={e => setProductoForm({ ...productoForm, nombre: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-textarea" rows={2} value={productoForm.descripcion} onChange={e => setProductoForm({ ...productoForm, descripcion: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Precio</label>
                    <input className="form-input" type="number" step="0.01" value={productoForm.precio} onChange={e => setProductoForm({ ...productoForm, precio: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <select className="form-select" value={productoForm.id_categoria} onChange={e => setProductoForm({ ...productoForm, id_categoria: e.target.value })} required>
                      <option value="">Seleccionar</option>
                      {categorias.map(c => (
                        <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SECCIÓN DE IMÁGENES MULTIPLE */}
                <div className="form-group">
                  <label className="form-label">Imágenes del producto (máx. 5)</label>
                  <input
                    type="file"
                    ref={productFileInputRef}
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="form-input"
                    onChange={handleImageFile}
                    style={{ padding: '0.4rem' }}
                    disabled={productoForm.imagenes?.length >= 5}
                  />
                  <small style={{ color: 'var(--text-light)', display: 'block', marginTop: '0.3rem' }}>
                    {productoForm.imagenes?.length || 0} de 5 imágenes cargadas
                  </small>

                  {imagePreviews.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '0.5rem', marginTop: '0.8rem' }}>
                      {imagePreviews.map((src, index) => (
                        <div key={index} style={{ position: 'relative', width: '100%', height: '70px' }}>
                          <img
                            src={src}
                            alt={`Preview ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              background: '#dc3545',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              lineHeight: '1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Eliminar imagen"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', gap: '1rem' }}>
                  <button type="button" className="btn btn-outline btn-block" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-sage btn-block">
                    {editingProductoId ? 'Guardar cambios' : 'Publicar producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MiEmprendimiento;