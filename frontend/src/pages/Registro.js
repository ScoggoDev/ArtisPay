import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Registro() {
  const [tab, setTab] = useState('cliente');
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [showPassword, setShowPassword] = useState(false);
  const { registroCliente, registroEmprendedor } = useAuth();
  const navigate = useNavigate();

  const [clienteForm, setClienteForm] = useState({ nombre_usuario: '', email: '', password: '', confirm_password: '' });
  const [empForm, setEmpForm] = useState({
    nombre_usuario: '', email: '', password: '', confirm_password: '',
    nombre_emprendimiento: '', telefono: '', descripcion: '', id_categoria: '',
  });

  useEffect(() => {
    api.get('/categorias').then(r => setCategorias(r.data)).catch(() => { });
  }, []);

  const handleCliente = async (e) => {
    e.preventDefault();
    setError('');
    if (clienteForm.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (clienteForm.password !== clienteForm.confirm_password) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const data = await registroCliente(clienteForm.nombre_usuario, clienteForm.email, clienteForm.password);
      setMensaje(data?.message || `Cliente registrado correctamente `);
      setMsgType('success');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error en el registro');
    }
  };

  const handleEmprendedor = async (e) => {
    e.preventDefault();
    setError('');
    if (empForm.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (empForm.password !== empForm.confirm_password) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      const data = await registroEmprendedor(empForm);
      setMensaje(data?.message || `Emprendedor registrado correctamente `);
      setMsgType('success');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      navigate('/mi-emprendimiento');

    } catch (err) {
      setError(err.response?.data?.error || 'Error en el registro');
    }
  };

  return (
    <div className="auth-wrapper page-enter">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <h2>Crear cuenta</h2>
        {mensaje && (
          <div className={`alert alert-${msgType} flash`}>
            {mensaje}
            <button className="alert-close" style={{ marginLeft: '5px' }} onClick={() => setMensaje('')}>&times;</button>
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            {error}
            <button className="alert-close" onClick={() => setError('')}>&times;</button>
          </div>
        )}

        <div className="tabs">
          <button className={`tab ${tab === 'cliente' ? 'active' : ''}`} onClick={() => setTab('cliente')}>Cliente</button>
          <button className={`tab ${tab === 'emprendedor' ? 'active' : ''}`} onClick={() => setTab('emprendedor')}>Emprendedor</button>
        </div>

        {tab === 'cliente' ? (
          <form onSubmit={handleCliente}>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className="form-input" value={clienteForm.nombre_usuario} onChange={e => setClienteForm({ ...clienteForm, nombre_usuario: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={clienteForm.email} onChange={e => setClienteForm({ ...clienteForm, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type={showPassword ? 'text' : 'password'} className="form-input" value={clienteForm.password} onChange={e => setClienteForm({ ...clienteForm, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar contraseña</label>
              <input type={showPassword ? 'text' : 'password'} className="form-input" value={clienteForm.confirm_password} onChange={e => setClienteForm({ ...clienteForm, confirm_password: e.target.value })} required />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              <input
                type="checkbox"
                id="show-pass-cliente"
                checked={showPassword}
                onChange={e => setShowPassword(e.target.checked)}
              />
              <label htmlFor="show-pass-cliente" style={{ cursor: 'pointer', userSelect: 'none' }}>Mostrar contraseñas</label>
            </div>

            <button type="submit" className="btn btn-primary btn-block">Registrarse como cliente</button>
          </form>
        ) : (
          <form onSubmit={handleEmprendedor}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre de usuario</label>
                <input className="form-input" value={empForm.nombre_usuario} onChange={e => setEmpForm({ ...empForm, nombre_usuario: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre del emprendimiento</label>
                <input className="form-input" value={empForm.nombre_emprendimiento} onChange={e => setEmpForm({ ...empForm, nombre_emprendimiento: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type={showPassword ? 'text' : 'password'} className="form-input" value={empForm.password} onChange={e => setEmpForm({ ...empForm, password: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar contraseña</label>
              <input type={showPassword ? 'text' : 'password'} className="form-input" value={empForm.confirm_password} onChange={e => setEmpForm({ ...empForm, confirm_password: e.target.value })} required />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              <input
                type="checkbox"
                id="show-pass-emp"
                checked={showPassword}
                onChange={e => setShowPassword(e.target.checked)}
              />
              <label htmlFor="show-pass-emp" style={{ cursor: 'pointer', userSelect: 'none' }}>Mostrar contraseñas</label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={empForm.telefono} onChange={e => setEmpForm({ ...empForm, telefono: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría principal</label>
                <select className="form-select" value={empForm.id_categoria} onChange={e => setEmpForm({ ...empForm, id_categoria: e.target.value })} required>
                  <option value="">Seleccionar</option>
                  {categorias.map(c => (
                    <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="form-textarea" rows={3} value={empForm.descripcion} onChange={e => setEmpForm({ ...empForm, descripcion: e.target.value })} placeholder="Contanos sobre tu emprendimiento..." required />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Registrar emprendimiento</button>
          </form>
        )}
        <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
          ¿Ya tenés cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default Registro;