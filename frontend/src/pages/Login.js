import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="auth-wrapper page-enter">
      <div className="auth-card">
        <h2>Bienvenido de vuelta</h2>
        {error && (
          <div className="alert alert-error">
            {error}
            <button className="alert-close" onClick={() => setError('')}>&times;</button>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '0.5rem' }}>Ingresar</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
          ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
