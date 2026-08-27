import { useState } from 'react';
import api from '../services/api';

export function OlvideContrasena() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, message: '', error: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: '', error: false });
    try {
      await api.post('/reseteo-pass/forgot-password', { email });
      setStatus({
        loading: false,
        message: 'Si el correo existe en nuestro sistema, recibirás un enlace de recuperación.',
        error: false,
      });
    } catch (err) {
      setStatus({ loading: false, message: 'Ocurrió un error. Inténtalo de nuevo.', error: true });
    }
  };

  return (
    <div className='container auth-wrapper' style={{flexDirection: 'column', justifyContent : 'start', minHeight: '78vh', paddingTop: '5%', gap: '1rem'}}>
      <h2>Recuperar Contraseña</h2>
      <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
      
      <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', paddingTop: '1rem', gap: '1rem', width: '100%', maxWidth: '400px'}}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu correo electrónico"
          required
          style={{padding: '0.5rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid #ccc'}}
        />
        <button type="submit" disabled={status.loading} style={{padding: '0.5rem', fontSize: '1rem', borderRadius: '8px', backgroundColor: '#ee7e51', color: '#fff', border: 'none'}}>
          {status.loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
        {status.message && <p className={status.error ? 'error' : 'success'}>{status.message}</p>}
      </form>
    </div>
  );
}