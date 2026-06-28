import { useState, useEffect } from 'react';
import api from '../services/api';

function Admin() {
  const [stats, setStats] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tab, setTab] = useState('stats');

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'usuarios') api.get('/admin/usuarios').then(r => setUsuarios(r.data)).catch(() => {});
    if (tab === 'reportes') api.get('/admin/reportes').then(r => setReportes(r.data)).catch(() => {});
  }, [tab]);

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
      setReportes(reportes.map(r => r.id_reporte === id ? { ...r, estado } : r));
    } catch {
      setMensaje('Error al actualizar reporte');
    }
  };

  const rolBadge = (tipo) => {
    const map = { admin: 'badge-terracotta', emprendedor: 'badge-sage', cliente: 'badge-clay', moderador: 'badge-sunflower' };
    return map[tipo] || 'badge-clay';
  };

  return (
    <div className="page-enter">
      <div className="container section">
        <h2 style={{ marginBottom: '1.5rem' }}>Panel de administración</h2>

        {mensaje && (
          <div className="alert alert-info">
            {mensaje}
            <button className="alert-close" onClick={() => setMensaje('')}>&times;</button>
          </div>
        )}

        <div className="tab-bar">
          <button className={`btn ${tab === 'stats' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab('stats')}>Estadísticas</button>
          <button className={`btn ${tab === 'usuarios' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab('usuarios')}>Usuarios</button>
          <button className={`btn ${tab === 'reportes' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab('reportes')}>Reportes</button>
        </div>

        {tab === 'stats' && stats && (
          <div className="grid grid-4">
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

        {tab === 'usuarios' && (
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
        )}

        {tab === 'reportes' && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>ID</th><th>Producto</th><th>Reportado por</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {reportes.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No hay reportes</td></tr>
                ) : reportes.map(r => (
                  <tr key={r.id_reporte}>
                    <td>{r.id_reporte}</td>
                    <td>{r.producto_nombre}</td>
                    <td>{r.reportado_por}</td>
                    <td>{r.motivo}</td>
                    <td><span className={`badge ${r.estado === 'pendiente' ? 'badge-sunflower' : r.estado === 'resuelto' ? 'badge-sage' : 'badge-clay'}`}>{r.estado}</span></td>
                    <td>
                      {r.estado === 'pendiente' && (
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button className="btn btn-sage btn-sm" onClick={() => resolverReporte(r.id_reporte, 'resuelto')}>Resolver</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => resolverReporte(r.id_reporte, 'descartado')}>Descartar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
