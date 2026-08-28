import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';
import ArtisanLogo from '../components/ArtisanLogo';

// Corregir íconos por defecto de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PAYSANDU_CENTER = [-32.317, -58.076];

// Subcomponente para capturar los clics en el mapa
function LocationPicker({ onSelectLocation }) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

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
  const navigate = useNavigate();

  // Estado local para los 3 campos de Redes Sociales
  const [socialFields, setSocialFields] = useState({ instagram: '', facebook: '', otra: '' });

  // Estados para productos (Edición y Creación con MÚLTIPLES IMÁGENES)
  const [editingProductoId, setEditingProductoId] = useState(null);
  const [productoForm, setProductoForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    id_categoria: '',
    imagenes: [] // Ahora es un Array
  });
  const [imagePreviews, setImagePreviews] = useState([]); // Array de previews

  const [servicios, setServicios] = useState([]);
  const [servicioForm, setServicioForm] = useState({ nombre: '', descripcion: '', precio: '' });

  // Referencias de inputs
  const profileFileInputRef = useRef(null);
  const productFileInputRef = useRef(null);
  const servicioFileInputRef = useRef(null);

  const markerRef = useRef(null);

  const { usuario, logout } = useAuth();

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

  // Actualizar redes sociales
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

  const handleLocationSelect = (lat, lng) => {
    setEditForm(prev => ({
      ...prev,
      latitud: Number(lat.toFixed(6)),
      longitud: Number(lng.toFixed(6))
    }));
  };

  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        handleLocationSelect(lat, lng);
      }
    },
  }), []);

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

  const handleRemoveProfileImage = () => {
    setEditForm(f => ({ ...f, imagen_perfil: '' }));
    if (profileFileInputRef.current) profileFileInputRef.current.value = '';
  };

  // --- MANEJO DE MÚLTIPLES IMÁGENES DE PRODUCTOS (HASTA 5) ---
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


  // --- MANEJO DE MÚLTIPLES IMÁGENES DE SERVICIOS (HASTA 5) ---
  const handleServiceImageFile = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Asegura que sea un array por si prev.imagenes no está inicializado
    const currentImages = servicioForm.imagenes || [];

    if (currentImages.length + files.length > 5) {
      flash('Solo podés agregar hasta 5 imágenes por servicio.', 'error');
      if (servicioFileInputRef.current) servicioFileInputRef.current.value = '';
      return;
    }

    // Procesa todos los archivos de manera asíncrona
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

    // Un solo re-render seguro
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


  // Abrir modal en modo creación
  const handleOpenCreateModal = () => {
    setEditingProductoId(null);
    setProductoForm({ nombre: '', descripcion: '', precio: '', id_categoria: '', imagenes: [] });
    setImagePreviews([]);
    setShowModal(true);
  };

  // Abrir modal en modo edición
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

  // Manejador unificado para guardar
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

  const profileImageSrc = resolveUrl(editForm.imagen_perfil);
  const position = [editForm.latitud || PAYSANDU_CENTER[0], editForm.longitud || PAYSANDU_CENTER[1]];

  const handleDesactivar = async () => {
    if (!window.confirm('¿Estás seguro de que querés desactivar tu cuenta?')) return;
    try {
      await api.put('/usuarios/me/desactivar');
      logout();
      navigate('/');
    } catch {
      setMensaje('Error al desactivar la cuenta');
    }
  };

  return (
    <div className="page-enter">
      <div className="container section">
        <h2 style={{ marginBottom: '1.5rem' }}>Mi Taller</h2>

        {mensaje && (
          <div className={`alert alert-${msgType} flash`}>
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
              <label className="form-label">Ubicación (Dirección o Referencia)</label>
              <input className="form-input" value={editForm.ubicacion || ''} onChange={e => setEditForm({ ...editForm, ubicacion: e.target.value })} placeholder="Ej: 18 de Julio y Montecaseros" />
            </div>

            {/* SECCIÓN REDES SOCIALES MULTIPLE */}
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Redes sociales</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
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

                <input
                  className="form-input"
                  value={socialFields.facebook}
                  onChange={e => handleSocialChange('facebook', e.target.value)}
                  placeholder="Agregar Facebook (link completo, ej: https://facebook.com/miperfil)"
                />

                <input
                  className="form-input"
                  value={socialFields.otra}
                  onChange={e => handleSocialChange('otra', e.target.value)}
                  placeholder="Agregar otra red social (link completo)"
                />
              </div>
            </div>

            {/* SECCIÓN SELECCIÓN DE UBICACIÓN EN EL MAPA */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Marcar ubicación exacta en el mapa</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                Hacé clic en el mapa o arrastrá el pin para fijar la ubicación exacta de tu emprendimiento.
              </p>
              <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', height: '300px', position: 'sticky' }}>
                <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker onSelectLocation={handleLocationSelect} />
                  {editForm.latitud && editForm.longitud && (
                    <Marker
                      draggable={true}
                      eventHandlers={eventHandlers}
                      position={position}
                      ref={markerRef}
                    />
                  )}
                </MapContainer>
              </div>
              {editForm.latitud && editForm.longitud && (
                <p style={{ fontSize: '0.78rem', color: '#666', marginTop: '6px' }}>
                  Coordenadas seleccionadas: {editForm.latitud}, {editForm.longitud}
                </p>
              )}
            </div>

            <button type="submit" className="btn btn-primary">Guardar cambios</button>
          </form>
        </div>

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
          <div className="grid grid-3">
            {productos.map(p => (
              <div key={p.id_producto}>
                <ProductCard producto={{ ...p, emprendimiento_nombre: emp.nombre }} />
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
                <div className="form-group">
                  <label className="form-label">Precio (dejar vacío si es a convenir)</label>
                  <input className="form-input" type="number" step="0.01" value={servicioForm.precio} onChange={e => setServicioForm({ ...servicioForm, precio: e.target.value })} placeholder="Ej: 500" />
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

                  {/* Previews en miniatura */}
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
                <button type="submit" className="btn btn-sage btn-block">Publicar servicio</button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Producto con Múltiples Imágenes */}
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

                  {/* Previews en miniatura */}
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

        <div>
          <h2 style={{ marginBottom: '1.5rem' }}>Mi perfil</h2>
          <div className="edit-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
              <ArtisanLogo nombre={usuario.nombre_usuario} size={56} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{usuario.nombre_usuario}</div>
                <div style={{ color: 'var(--text-light)', fontSize: '0.88rem' }}>{usuario.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span className="badge badge-sage">Emprendedor</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />
            <button className="btn btn-danger btn-sm" onClick={handleDesactivar}>Desactivar cuenta</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiEmprendimiento;