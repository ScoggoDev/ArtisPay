import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import ArtisanLogo from '../components/ArtisanLogo';
import { useAuth } from '../context/AuthContext';

function EmprendedorDetalle() {
  const { id } = useParams();
  const [emp, setEmp] = useState(null);
  const [reportar, setReportar] = useState(false);
  const [bloquear, setBloquear] = useState(false);
  const { usuario } = useAuth();
  const crearReporte = useAuth().crearReporte;
  const [mensaje, setMensaje] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [motivo_reporte, setMotivoReporte] = useState('');
  const [comentarios_reporte, setComentariosReporte] = useState('');
  const [empActivo, setEmpActivo] = useState(true);

  useEffect(() => {
    api.get(`/emprendimientos/${id}`).then(r => setEmp(r.data)).catch(() => { });
  }, [id]);

  const handleReportar = () => {
    setReportar(prev => {
      const nuevoEstado = !prev;
      if (nuevoEstado) setBloquear(false);
      return nuevoEstado;
    });
  };

  const handleBloquear = () => {
    setBloquear(prev => {
      const nuevoEstado = !prev;
      if (nuevoEstado) setReportar(false);
      return nuevoEstado;
    });
  };

  const reportarPerfil = async () => {
    if (!motivo_reporte || motivo_reporte.trim() === '') {
      setMensaje('Por favor, selecciona un motivo para continuar.');
      setMsgType('error');
      return;
    }
    try {
      await crearReporte(usuario.id_usuario, emp.id_emprendimiento, null, motivo_reporte, comentarios_reporte);
      setMensaje('Perfil reportado');
      setMsgType('success');
      setReportar(false);
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error al reportar');
      setMsgType('error');
    }
  };


  const bloquearPerfil = async () => {
    try {
      await api.put(`/admin/usuarios/${emp.id_usuario}/bloquear`);
      setMensaje(`Emprendimiento bloqueado`);
      setEmpActivo(false);
      setBloquear(false);
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Error');
    }
  };

  if (!emp) return <div className="container section"><p>Cargando...</p></div>;

  return (
    <div className="page-enter">
      <div className="container">
        {mensaje && (
          <div className={`alert alert-${msgType}`}>
            {mensaje}
            <button className="alert-close" onClick={() => setMensaje('')}>&times;</button>
          </div>
        )}
        <div className="profile-hero">

          <ArtisanLogo nombre={emp.nombre} id_categoria={emp.id_categoria} size={100} />
          <h2>{emp.nombre}</h2>
          <p style={{ color: 'var(--text-light)', maxWidth: 500, margin: '0.5rem auto 1rem' }}>{emp.descripcion}</p>
          {emp.ubicacion && <p style={{ fontSize: '0.88rem', color: 'var(--text-light)' }}>{emp.ubicacion}</p>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {emp.telefono && (
              <a href={`https://wa.me/${emp.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="whatsapp-btn">
                WhatsApp
              </a>
            )}
            {emp.redes_sociales && (
              <span className="badge badge-clay" style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}>{emp.redes_sociales}</span>
            )}

            {usuario && <button className="btn btn-danger" style={{ fontSize: '0.75rem', width: '7%' }} onClick={handleReportar}>
              Reportar
            </button>}

            {(usuario?.tipo === 'admin' || usuario?.tipo === 'moderador') && empActivo && 
              <button className="btn btn-danger" style={{fontSize: '0.75rem', width: '7%'}} onClick={handleBloquear}>
                Bloquear
              </button>}
              {(usuario?.tipo === 'admin' || usuario?.tipo === 'moderador') && !empActivo && 
              <button className="btn badge-clay" style={{fontSize: '0.75rem', width: '7%'}} disabled>
                Bloqueado
              </button>}
          </div>

          {reportar && (
            <div className="report-box" style={{ marginTop: '1rem' }}>
              <p>¿Estás seguro de que deseas reportar este perfil?</p>
              <form>
                <div className="form-group">
                  <label for="reportMotive">Seleccione motivo</label>
                  <br />
                  <select className="form-control" id="reportMotive"
                    value={motivo_reporte} onChange={(e) => setMotivoReporte(e.target.value)} required>
                    <option value="" disabled>Seleccione una opción</option>
                    <option value="Perfil falso o engañoso">Perfil falso o engañoso</option>
                    <option value="Perfil creado con IA">Perfil creado con IA</option>
                    <option value="Perfil no corresponde a la descripción">Perfil no corresponde a la descripción</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label for="reportComents">Ingrese comentarios</label>
                  <br />
                  <textarea className="form-control" id="reportComents" rows="3" value={comentarios_reporte} onChange={(e) => setComentariosReporte(e.target.value)}></textarea>
                </div>
              </form>
              <button className="btn btn-danger" onClick={reportarPerfil} style={{ marginRight: '0.5rem' }}>
                Confirmar
              </button>
              <button className="btn btn-secondary" onClick={() => setReportar(false)}>
                Cancelar
              </button>
            </div>
          )}

          {bloquear &&
            <div className="toast" role="alert" aria-live="assertive" aria-atomic="true" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <div className="toast-body">
                ¿Desea bloquear este perfil?
                <p style={{ fontSize: '0.88rem', color: 'var(--text-light)' }}>El perfil no se volverá a mostrar.</p>
                <div style={{ marginTop: '1rem' }}>
                  <button className="btn btn-danger" onClick={() => bloquearPerfil()} style={{ marginRight: '0.5rem' }}>
                    Confirmar
                  </button>
                  <button className="btn btn-secondary" onClick={() => setBloquear(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>}

        </div>
        <section className="section" style={{ paddingTop: 0 }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Productos</h3>
          {emp.productos?.length === 0 ? (
            <div className="empty">
              <p>Este emprendimiento aún no tiene productos publicados.</p>
            </div>
          ) : (
            <div className="grid grid-3">
              {emp.productos?.map(p => (
                <ProductCard key={p.id_producto} producto={{ ...p, emprendimiento_nombre: emp.nombre }} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default EmprendedorDetalle;
