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
  const [editForm, setEditForm] = useState({});
  const [productoForm, setProductoForm] = useState({ nombre: '', descripcion: '', precio: '', id_categoria: '', imagenes: '' });

  useEffect(() => {
    if (empCtx) {
      api.get(`/emprendimientos/${empCtx.id_emprendimiento}`).then(r => {
        setEmp(r.data);
        setProductos(r.data.productos || []);
        setEditForm(r.data);
      }).catch(() => {});
    }
    api.get('/categorias').then(r => setCategorias(r.data)).catch(() => {});
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

  const handleAddProducto = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productoForm,
        imagenes: productoForm.imagenes ? productoForm.imagenes.split(',').map(s => s.trim()) : [],
      };
      const { data } = await api.post('/productos', payload);
      setProductos([...productos, data]);
      setProductoForm({ nombre: '', descripcion: '', precio: '', id_categoria: '', imagenes: '' });
      setShowModal(false);
      flash('Producto agregado');
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
                  <label className="form-label">URLs de imágenes (separadas por coma)</label>
                  <input className="form-input" value={productoForm.imagenes} onChange={e => setProductoForm({ ...productoForm, imagenes: e.target.value })} placeholder="https://..." />
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
