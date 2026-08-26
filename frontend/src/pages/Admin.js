import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Admin() {

  // estadísticas //
  const [stats, setStats] = useState(null);

  // categorías // 
  const { categoria, registroCategoria } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [formDataCategoria, setFormDataCategoria] = useState({
    nombre: '',
    descripcion: ''
  });
  const [showModalCategoria, setShowModalCategoria] = useState(false);

  // usuarios //
  const { usuario, registroModerador } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [modalError, setModalError] = useState('');

  // reportes //
  const [reportes, setReportes] = useState([]);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // mensajes y estados //
  const [mensaje, setMensaje] = useState('');
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (usuario?.tipo === 'admin') {
      api.get('/admin/stats').then(r => setStats(r.data)).catch(() => { });
    }

    if (usuario?.tipo === 'moderador') {
      setTab('usuarios');
    }
  }, [usuario]);

  useEffect(() => {
    if (tab === 'usuarios') cargarUsuarios();
    if (tab === 'reportes') cargarReportes();
    if (tab === 'categorias') cargarCategorias();
  }, [tab]);


  const cargarCategorias = () => {
    api.get('/categorias').then(r => setCategorias(r.data)).catch(() => { });
  };

  const cargarUsuarios = () => {
    api.get('/admin/usuarios').then(r => setUsuarios(r.data)).catch(() => { });
  };

  const cargarReportes = () => {
    api.get('/admin/reportes').then(r => {
      setReportes(ordenarReportes(r.data));
    }).catch(() => { });
  };

  const ordenarReportes = (lista) => {
    const orden = { pendiente: 1, resuelto: 2, descartado: 3 };
    return [...lista].sort((a, b) => (orden[a.estado] || 99) - (orden[b.estado] || 99));
  };

  const handleChangeCategoria = (e) => {
    setFormDataCategoria({ ...formDataCategoria, [e.target.name]: e.target.value });
  };

  const toggleUsuario = async (id, activo) => {
    try {
      await api.put(`/admin/usuarios/${id}/${activo ? 'bloquear' : 'desbloquear'}`);
      setUsuarios(usuarios.map(u => u.id_usuario === id ? { ...u, activo: !activo } : u));
      setMensaje(`Usuario ${activo ? 'bloqueado' : 'desbloqueado'}`);
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error');
    }
  };

  const resolverReporte = async (id, estado) => {
    try {
      await api.put(`/admin/reportes/${id}`, { estado });
      const reportesActualizados = reportes.map(r => r.id_reporte === id ? { ...r, estado } : r);
      setReportes(ordenarReportes(reportesActualizados));
      setMensaje(`Reporte #${id} marcado como ${estado}`);

      // si el modal de detalle está abierto con este reporte, cerramos o actualizamos //
      if (reporteSeleccionado?.id_reporte === id) {
        setShowDetalleModal(false);
        setReporteSeleccionado(null);
      }
    } catch {
      setMensaje('Error al actualizar reporte');
    }
  };

  const rolBadge = (tipo) => {
    const map = { admin: 'badge-terracotta', emprendedor: 'badge-sage', cliente: 'badge-clay', moderador: 'badge-sunflower' };
    return map[tipo] || 'badge-clay';
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    setModalError('');
    setLoading(true);
    try {
      await registroCategoria(formDataCategoria.nombre, formDataCategoria.descripcion);

      setMensaje('Categoría creada exitosamente');
      setShowModalCategoria(false);
      setFormDataCategoria({ nombre: '', descripcion: '' });

      if (tab === 'categorias') cargarCategorias();

    } catch (err) {
      setModalError(err.response?.data?.error || 'Error al crear categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarCategoria = async (id_categoria) => {
    setLoading(true);
    try {
      await api.delete(`/categorias/${id_categoria}`);
      setMensaje('Categoría eliminada exitosamente');
      if (tab === 'categorias') cargarCategorias();
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al eliminar categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearModerador = async (e) => {
    e.preventDefault();
    setModalError('');

    if (formData.password !== formData.confirmPassword) {
      setModalError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await registroModerador(formData.nombre_usuario, formData.email, formData.password);

      setMensaje('Moderador creado exitosamente');
      setShowModal(false);
      setFormData({ nombre_usuario: '', email: '', password: '', confirmPassword: '' });

      if (tab === 'usuarios') cargarUsuarios();

    } catch (err) {
      setModalError(err.response?.data?.error || 'Error al crear moderador');
    } finally {
      setLoading(false);
    }
  };

  const abrirDetalleReporte = (reporte) => {
    setReporteSeleccionado(reporte);
    setShowDetalleModal(true);
  };

  // filtrado de reportes para la vista //
  const reportesFiltrados = reportes.filter(r => {
    if (filtroEstado === 'todos') return true;
    return r.estado === filtroEstado;
  });

  if (!usuario) {
    return <div className="container section">Cargando sesión...</div>;
  }

  return (
    <div className="page-enter">
      <div className="container section" style={{minHeight: '78vh' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Panel de administración</h2>

        {mensaje && (
          <div className="alert alert-info">
            {mensaje}
            <button className="alert-close" onClick={() => setMensaje('')}>&times;</button>
          </div>
        )}

        <div className="tab-bar">
          {usuario?.tipo === 'admin' && (
            <button className={`btn ${tab === 'stats' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab('stats')}>
              Estadísticas
            </button>
          )}
          {usuario?.tipo === 'admin' && (
            <button className={`btn ${tab === 'categorias' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab('categorias')}>
              Categorías
            </button>
          )}
          <button className={`btn ${tab === 'usuarios' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab('usuarios')}>
            Usuarios
          </button>
          <button className={`btn ${tab === 'reportes' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab('reportes')}>
            Reportes
          </button>
        </div>

        {tab === 'stats' && stats && (
          <div className="grid grid-4" style={{ paddingTop: '1rem' }}>
            <div className="stat-card">
              <div className="stat-number">{stats.total_usuarios}</div>
              <div className="stat-label">Usuarios</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.total_emprendimientos}</div>
              <div className="stat-label">Emprendimientos</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.total_productos}</div>
              <div className="stat-label">Productos</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.reportes_pendientes}</div>
              <div className="stat-label">Reportes pendientes</div>
            </div>
          </div>
        )}


        {tab === 'categorias' && (
          <>
            {usuario?.tipo === 'admin' && (
              <button
                className="btn btn-sm btn-secondary"
                style={{ display: 'block', marginLeft: 'auto', marginBottom: '1rem' }}
                onClick={() => setShowModalCategoria(true)}
              >
                Añadir categoría
              </button>
            )}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {categorias.map(c => (
                    <tr key={c.id_categoria}>
                      <td>{c.id_categoria}</td>
                      <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                      <td>{c.descripcion}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" onClick={() => {
                          handleEliminarCategoria(c.id_categoria);
                        }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* modal para crear categorías */}
        {showModalCategoria && (
          <div className="modal-backdrop" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 1000
          }}>
            <div className="modal-content" style={{
              background: '#fff', padding: '2rem', borderRadius: '8px', width: '100%',
              maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Crear categoría</h3>

              {modalError && (
                <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCrearCategoria}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.3rem' }}>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    className="form-control"
                    value={formDataCategoria.nombre}
                    onChange={handleChangeCategoria}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.3rem' }}>Descripción</label>
                  <input
                    type="text"
                    name="descripcion"
                    className="form-control"
                    value={formDataCategoria.descripcion}
                    onChange={handleChangeCategoria}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setShowModalCategoria(false); setModalError(''); }}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === 'usuarios' && (
          <>
            {usuario?.tipo === 'admin' && (
              <button
                className="btn btn-sm btn-secondary"
                style={{ display: 'block', marginLeft: 'auto', marginBottom: '1rem' }}
                onClick={() => setShowModal(true)}
              >
                Añadir usuario moderador
              </button>
            )}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Usuario</th><th>Email</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id_usuario}>
                      <td>{u.id_usuario}</td>
                      <td style={{ fontWeight: 600 }}>{u.nombre_usuario}</td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${rolBadge(u.tipo)}`}>{u.tipo}</span></td>
                      <td><span className={`badge ${u.activo ? 'badge-sage' : 'badge-terracotta'}`}>{u.activo ? 'Activo' : 'Bloqueado'}</span></td>
                      <td>
                        {u.tipo !== 'admin' && (
                          <button className={`btn btn-sm ${u.activo ? 'btn-danger' : 'btn-sage'}`} onClick={() => toggleUsuario(u.id_usuario, u.activo)}>
                            {u.activo ? 'Bloquear' : 'Desbloquear'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'reportes' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Filtrar por estado</label>
              <select
                className="form-control btn"
                style={{ width: 'auto', padding: '0.3rem 0.6rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', fontWeight: 500 }}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="resuelto">Resueltos</option>
                <option value="descartado">Descartados</option>
              </select>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Reporte sobre</th><th>Nombre</th><th>Reportado por</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {reportesFiltrados.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No hay reportes</td></tr>
                  ) : reportesFiltrados.map(r => (
                    <tr key={r.id_reporte}>
                      <td>{r.id_reporte}</td>
                      <td>{r.id_producto ? 'Producto' : 'Perfil'}</td>
                      <td>{r.producto_nombre || r.emprendimiento}</td>
                      <td>{r.reportado_por}</td>
                      <td>{r.motivo}</td>
                      <td><span className={`badge ${r.estado === 'pendiente' ? 'badge-sunflower' : r.estado === 'resuelto' ? 'badge-sage' : 'badge-clay'}`}>{r.estado}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button className="btn badge-sunflower btn-sm" onClick={() => abrirDetalleReporte(r)}>
                            Detalle
                          </button>
                          {r.estado === 'pendiente' && (
                            <>
                              <button className="btn btn-sage btn-sm" onClick={() => resolverReporte(r.id_reporte, 'resuelto')}>Resolver</button>
                              <button className="btn btn-primary btn-sm" onClick={() => resolverReporte(r.id_reporte, 'descartado')}>Descartar</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* modal para crear moderador */}
        {showModal && (
          <div className="modal-backdrop" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 1000
          }}>
            <div className="modal-content" style={{
              background: '#fff', padding: '2rem', borderRadius: '8px', width: '100%',
              maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Crear moderador</h3>

              {modalError && (
                <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCrearModerador}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.3rem' }}>Nombre de usuario</label>
                  <input
                    type="text"
                    name="nombre_usuario"
                    className="form-control"
                    value={formData.nombre_usuario}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.3rem' }}>Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.3rem' }}>Contraseña</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.3rem' }}>Confirmar contraseña</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setShowModal(false); setModalError(''); }}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* modal para detalle de reporte */}
        {showDetalleModal && reporteSeleccionado && (
          <div className="modal-backdrop" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 1000
          }}>
            <div className="modal-content" style={{
              background: '#fff', padding: '2rem', borderRadius: '8px', width: '100%',
              maxWidth: '550px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Detalle del Reporte #{reporteSeleccionado.id_reporte}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                <div>
                  <strong>Reportante:</strong> {reporteSeleccionado.nombre_reportante || 'N/A'}
                </div>
                <div>
                  <strong>Email del reportante:</strong> {reporteSeleccionado.reportado_por || 'No especificado'}
                </div>
                <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '0.4rem 0' }} />
                <div>
                  <strong>Producto reportado:</strong> {reporteSeleccionado.producto_nombre || 'N/A'}
                </div>
                <div>
                  <strong>ID del producto:</strong> {reporteSeleccionado.id_producto || 'N/A'}{' '}
                  {reporteSeleccionado.id_producto && (
                    <Link to={`/producto/${reporteSeleccionado.id_producto}`} target="_blank" style={{ marginLeft: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem' }}>
                      (Ver producto ↗)
                    </Link>
                  )}
                </div>
                <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '0.4rem 0' }} />
                <div>
                  <strong>Emprendimiento:</strong> {reporteSeleccionado.emprendimiento || 'N/A'}
                </div>
                <div>
                  <strong>ID del emprendimiento:</strong> {reporteSeleccionado.id_emprendimiento || 'N/A'}{' '}
                  {reporteSeleccionado.id_emprendimiento && (
                    <Link to={`/emprendedor/${reporteSeleccionado.id_emprendimiento}`} target="_blank" style={{ marginLeft: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem' }}>
                      (Ver perfil ↗)
                    </Link>
                  )}
                </div>
                <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '0.4rem 0' }} />
                <div>
                  <strong>Motivo:</strong> {reporteSeleccionado.motivo}
                </div>
                <div>
                  <strong>Comentarios:</strong> {reporteSeleccionado.comentarios || 'Sin comentarios adicionales.'}
                </div>
                <div>
                  <strong>Estado actual:</strong>{' '}
                  <span className={`badge ${reporteSeleccionado.estado === 'pendiente' ? 'badge-sunflower' : reporteSeleccionado.estado === 'resuelto' ? 'badge-sage' : 'badge-clay'}`}>
                    {reporteSeleccionado.estado}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                {reporteSeleccionado.estado === 'pendiente' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sage btn-sm"
                      onClick={() => resolverReporte(reporteSeleccionado.id_reporte, 'resuelto')}
                    >
                      Resolver
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => resolverReporte(reporteSeleccionado.id_reporte, 'descartado')}
                    >
                      Descartar
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowDetalleModal(false)}
                >
                  Cerrar
                </button>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Admin;