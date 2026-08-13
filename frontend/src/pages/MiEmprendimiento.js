import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

// Función para resolver URLs (LocalStorage o URL directa)
function resolveUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('ls:')) return localStorage.getItem(url) || null;
  return url;
}

// Funciones auxiliares para descomponer/armar la cadena de redes sociales
function parseRedes(redesStr) {
  if (!redesStr) return { instagram: '', facebook: '', otra: '' };

  const partes = redesStr.split(',').map(s => s.trim());
  let instagram = '';
  let facebook = '';
  let otra = '';

  partes.forEach(p => {
    if (p.includes('instagram.com/')) {
      const parts = p.split('instagram.com/');
      instagram = parts[parts.length - 1].replace(/\/$/, '');
    } else if (p.startsWith('@')) {
      instagram = p.substring(1);
    } else if (p.includes('facebook.com')) {
      facebook = p;
    } else if (p) {
      if (!otra) otra = p;
    }
  });

  return { instagram, facebook, otra };
}

function buildRedesString(ig, fb, ot) {
  const result = [];
  if (ig.trim()) {
    const cleanIg = ig.trim().replace(/^@/, '');
    result.push(`https://instagram.com/${cleanIg}`);
  }
  if (fb.trim()) {
    result.push(fb.trim());
  }
  if (ot.trim()) {
    result.push(ot.trim());
  }
  return result.join(', ');
}

function MiEmprendimiento() {
  const { emprendimiento: empCtx } = useAuth();
  const [emp, setEmp] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [showModal, setShowModal] = useState(false);
  const [showServicioModal, setShowServicioModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Estado local para los 3 campos de Redes Sociales
  const [socialFields, setSocialFields] = useState({ instagram: '', facebook: '', otra: '' });

  // Estados para productos (Edición y Creación)
  const [editingProductoId, setEditingProductoId] = useState(null);
  const [productoForm, setProductoForm] = useState({ nombre: '', descripcion: '', precio: '', id_categoria: '', imagenes: '' });
  const [imagePreview, setImagePreview] = useState(null);

  const [servicios, setServicios] = useState([]);
  const [servicioForm, setServicioForm] = useState({ nombre: '', descripcion: '', precio: '' });

  // Referencia para el input file oculto de la imagen de perfil
  const profileFileInputRef = useRef(null);

  useEffect(() => {
    if (empCtx) {
      api.get(`/emprendimientos/${empCtx.id_emprendimiento}`).then(r => {
        setEmp(r.data);
        setProductos(r.data.productos || []);
        setEditForm(r.data);
        if (r.data.redes_sociales) {
          setSocialFields(parseRedes(r.data.redes_sociales));
        }
      }).catch(() => { });
    }
    api.get('/categorias').then(r => setCategorias(r.data)).catch(() => { });
    if (empCtx) api.get(`/servicios?id_emprendimiento=${empCtx.id_emprendimiento}`).then(r => setServicios(r.data)).catch(() => { });
  }, [empCtx]);

  const flash = (msg, type = 'success') => { setMensaje(msg); setMsgType(type); };

  // Actualizar redes sociales en editForm cada vez que cambia algún campo de redes
  const handleSocialChange = (field, value) => {
    const updated = { ...socialFields, [field]: value };
    setSocialFields(updated);
    const redesConcat = buildRedesString(updated.instagram, updated.facebook, updated.otra);
    setEditForm(prev => ({ ...prev, redes_sociales: redesConcat }));
  };

  const handleUpdatePerfil = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/emprendimientos/me', editForm);
      setEmp(data);
      flash('Perfil actualizado');
    } catch (err) {
      flash(err.response?.data?.error || 'Error', 'error');
    }
  };

  // Manejador para cargar la imagen de perfil
  const handleProfileImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      const key = `ls:artispay_img_${Date.now()}`;
      localStorage.setItem(key, base64);
      setEditForm(f => ({ ...f, imagen_perfil: key }));
    };
    reader.readAsDataURL(file);
  };

  // Manejador para eliminar/limpiar la imagen de perfil actual
  const handleRemoveProfileImage = () => {
    setEditForm(f => ({ ...f, imagen_perfil: '' }));
    if (profileFileInputRef.current) profileFileInputRef.current.value = '';
  };

  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      const key = `ls:artispay_img_${Date.now()}`;
      localStorage.setItem(key, base64);
      setProductoForm(f => ({ ...f, imagenes: key }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  // Abrir modal en modo creación
  const handleOpenCreateModal = () => {
    setEditingProductoId(null);
    setProductoForm({ nombre: '', descripcion: '', precio: '', id_categoria: '', imagenes: '' });
    setImagePreview(null);
    setShowModal(true);
  };

  // Abrir modal en modo edición con datos cargados
  const handleOpenEditModal = (producto) => {
    setEditingProductoId(producto.id_producto);

    // Si las imágenes vienen como array o como string/URL
    let primeraImagen = '';
    if (Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
      primeraImagen = producto.imagenes[0];
    } else if (typeof producto.imagenes === 'string') {
      primeraImagen = producto.imagenes;
    }

    setProductoForm({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio || '',
      id_categoria: producto.id_categoria || '',
      imagenes: primeraImagen
    });

    // Resolver la imagen para la vista previa
    if (primeraImagen) {
      setImagePreview(resolveUrl(primeraImagen));
    } else {
      setImagePreview(null);
    }

    setShowModal(true);
  };

  // Manejador unificado para guardar (Crear o Editar)
  const handleSaveProducto = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productoForm,
        imagenes: productoForm.imagenes ? [productoForm.imagenes] : [],
      };

      if (editingProductoId) {
        // Actualizar producto existente (UPDATE)
        const { data } = await api.put(`/productos/${editingProductoId}`, payload);
        setProductos(productos.map(p => p.id_producto === editingProductoId ? data : p));
        flash('Producto actualizado correctamente');
      } else {
        // Crear nuevo producto (CREATE)
        const { data } = await api.post('/productos', payload);
        setProductos([...productos, data]);
        flash('Producto agregado');
      }

      setProductoForm({ nombre: '', descripcion: '', precio: '', id_categoria: '', imagenes: '' });
      setImagePreview(null);
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
      flash('Servicio agregado');
    } catch (err) {
      flash(err.response?.data?.error || 'Error', 'error');
    }
  };

  const handleDeleteServicio = async (id) => {
    try {
      await api.delete(`/servicios/${id}`);
      setServicios(servicios.filter(s => s.id_servicio !== id));
      flash('Servicio eliminado');
    } catch (err) {
      flash(err.response?.data?.error || 'Error', 'error');
    }
  };

  const handleDeleteProducto = async (id) => {
    try {
      await api.delete(`/productos/${id}`);
      setProductos(productos.filter(p => p.id_producto !== id));
      flash('Producto eliminado');
    } catch (err) {
      flash(err.response?.data?.error || 'Error', 'error');
    }
  };

  if (!emp) return <div className="container section"><p>Cargando...</p></div>;

  const profileImageSrc = resolveUrl(editForm.imagen_perfil);

  return (
    <div className="page-enter">
      <div className="container section">
        <h2 style={{ marginBottom: '1.5rem' }}>Mi Taller</h2>

        {mensaje && (
          <div className={`alert alert-${msgType}`}>
            {mensaje}
            <button className="alert-close" onClick={() => setMensaje('')}>&times;</button>
          </div>
        )}

        <div className="edit-section">
          <h4>Editar perfil</h4>
          <form onSubmit={handleUpdatePerfil}>

            {/* Imagen de Perfil */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.8rem', fontWeight: 'bold' }}>
                Foto de perfil
              </label>

              <div
                style={{
                  position: 'relative',
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid var(--terracotta, #D4A27F)',
                  backgroundColor: '#F5EDE4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onClick={() => profileFileInputRef.current?.click()}
                title="Hacé clic para cambiar la foto de perfil"
              >
                {profileImageSrc ? (
                  <img
                    src={profileImageSrc}
                    alt="Foto de perfil"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#B08060', fontSize: '0.85rem', padding: '0.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>📷</div>
                    <span>Subir foto</span>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={profileFileInputRef}
                accept="image/png,image/jpeg,image/webp"
                onChange={handleProfileImageFile}
                style={{ display: 'none' }}
              />

              <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => profileFileInputRef.current?.click()}
                >
                  {profileImageSrc ? 'Cambiar foto' : 'Seleccionar foto'}
                </button>
                {profileImageSrc && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleRemoveProfileImage}
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={editForm.nombre || ''} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={editForm.telefono || ''} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="form-textarea" rows={3} value={editForm.descripcion || ''} onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Ubicación</label>
              <input className="form-input" value={editForm.ubicacion || ''} onChange={e => setEditForm({ ...editForm, ubicacion: e.target.value })} />
            </div>

            {/* SECCIÓN REDES SOCIALES MULTIPLE */}
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Redes sociales</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

                {/* Instagram con el @ prefijado */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    padding: '0.55rem 0.8rem',
                    backgroundColor: '#e9ecef',
                    border: '1px solid #ced4da',
                    borderRight: 'none',
                    borderRadius: 'var(--radius-sm, 4px) 0 0 var(--radius-sm, 4px)',
                    color: 'var(--text-light, #6c757d)',
                    fontWeight: 'bold'
                  }}>
                    @
                  </span>
                  <input
                    className="form-input"
                    style={{ borderRadius: '0 var(--radius-sm, 4px) var(--radius-sm, 4px) 0' }}
                    value={socialFields.instagram}
                    onChange={e => handleSocialChange('instagram', e.target.value)}
                    placeholder="Agregar Instagram"
                  />
                </div>

                {/* Facebook */}
                <input
                  className="form-input"
                  value={socialFields.facebook}
                  onChange={e => handleSocialChange('facebook', e.target.value)}
                  placeholder="Agregar Facebook (link completo, ej: https://facebook.com/miperfil)"
                />

                {/* Otra red social */}
                <input
                  className="form-input"
                  value={socialFields.otra}
                  onChange={e => handleSocialChange('otra', e.target.value)}
                  placeholder="Agregar otra red social (link completo)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Latitud</label>
                <input className="form-input" type="number" step="any" value={editForm.latitud || ''} onChange={e => setEditForm({ ...editForm, latitud: parseFloat(e.target.value) || null })} placeholder="-32.317" />
              </div>
              <div className="form-group">
                <label className="form-label">Longitud</label>
                <input className="form-input" type="number" step="any" value={editForm.longitud || ''} onChange={e => setEditForm({ ...editForm, longitud: parseFloat(e.target.value) || null })} placeholder="-58.076" />
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '1rem', marginTop: '-0.5rem' }}>
              Podés obtener las coordenadas haciendo clic derecho en <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>.
            </p>
            <button type="submit" className="btn btn-primary">Guardar cambios</button>
          </form>
        </div>

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
          <div className="grid grid-3">
            {productos.map(p => (
              <div key={p.id_producto}>
                <ProductCard producto={{ ...p, emprendimiento_nombre: emp.nombre }} />
                {/* Botones de acción (Editar y Eliminar) */}
                <div style={{ display: 'flex', gap: '0.5rem',  margin: '1rem', marginTop: '0.5rem' }}>
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
        )}

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
          <div className="grid grid-3">
            {servicios.map(s => (
              <div key={s.id_servicio} className="emp-card" style={{ textAlign: 'left' }}>
                <div className="emp-name" style={{ fontSize: '1rem' }}>{s.nombre}</div>
                {s.descripcion && <p className="emp-desc">{s.descripcion}</p>}
                {s.precio ? (
                  <p style={{ fontWeight: 700, color: 'var(--terracotta)', marginBottom: '0.8rem' }}>
                    ${parseFloat(s.precio).toLocaleString('es-UY')}
                  </p>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.8rem' }}>Precio a convenir</p>
                )}
                <button className="btn btn-danger btn-sm btn-block" onClick={() => handleDeleteServicio(s.id_servicio)}>
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

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
                <div className="form-group">
                  <label className="form-label">Precio (dejar vacío si es a convenir)</label>
                  <input className="form-input" type="number" step="0.01" value={servicioForm.precio} onChange={e => setServicioForm({ ...servicioForm, precio: e.target.value })} placeholder="Ej: 500" />
                </div>
                <button type="submit" className="btn btn-sage btn-block">Publicar servicio</button>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Producto (Crear / Editar) */}
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
                <div className="form-group">
                  <label className="form-label">Imagen del producto</label>
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="form-input" onChange={handleImageFile} style={{ padding: '0.4rem' }} />
                  {imagePreview && (
                    <img src={imagePreview} alt="preview" style={{ marginTop: '0.6rem', width: '100%', height: 140, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
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