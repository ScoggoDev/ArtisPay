import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

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
  const [productoForm, setProductoForm] = useState({ nombre: '', descripcion: '', precio: '', id_categoria: '', imagenes: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [servicioForm, setServicioForm] = useState({ nombre: '', descripcion: '', precio: '' });

  useEffect(() => {
    if (empCtx) {
      api.get(`/emprendimientos/${empCtx.id_emprendimiento}`).then(r => {
        setEmp(r.data);
        setProductos(r.data.productos || []);
        setEditForm(r.data);
      }).catch(() => {});
    }
    api.get('/categorias').then(r => setCategorias(r.data)).catch(() => {});
    if (empCtx) api.get(`/servicios?id_emprendimiento=${empCtx.id_emprendimiento}`).then(r => setServicios(r.data)).catch(() => {});
  }, [empCtx]);

  const flash = (msg, type = 'success') => { setMensaje(msg); setMsgType(type); };

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

  const handleAddProducto = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productoForm,
        imagenes: productoForm.imagenes ? [productoForm.imagenes] : [],
      };
      const { data } = await api.post('/productos', payload);
      setProductos([...productos, data]);
      setProductoForm({ nombre: '', descripcion: '', precio: '', id_categoria: '', imagenes: '' });
      setImagePreview(null);
      setShowModal(false);
      flash('Producto agregado');
    } catch (err) {
      flash(err.response?.data?.error || 'Error', 'error');
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
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ubicación</label>
                <input className="form-input" value={editForm.ubicacion || ''} onChange={e => setEditForm({ ...editForm, ubicacion: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Redes sociales</label>
                <input className="form-input" value={editForm.redes_sociales || ''} onChange={e => setEditForm({ ...editForm, redes_sociales: e.target.value })} placeholder="@instagram, facebook.com/..." />
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
          <button className="btn btn-sage" onClick={() => setShowModal(true)}>+ Agregar producto</button>
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
                <button className="btn btn-danger btn-sm btn-block" style={{ marginTop: '0.5rem' }} onClick={() => handleDeleteProducto(p.id_producto)}>
                  Eliminar
                </button>
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

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Agregar producto</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleAddProducto}>
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
                <button type="submit" className="btn btn-sage btn-block">Publicar producto</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MiEmprendimiento;
