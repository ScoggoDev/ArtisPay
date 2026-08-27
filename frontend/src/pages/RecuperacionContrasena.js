import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export function RecuperacionContrasena() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const id_usuario = searchParams.get('id');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [status, setStatus] = useState({ loading: false, message: '', error: false });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, message: '', error: false });
        try {
            await api.post('/reseteo-pass/reset-password', { id_usuario: id_usuario, token: token, newPassword: password });
            setStatus({ loading: false, message: '¡Contraseña actualizada con éxito!', error: false });
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setStatus({ loading: false, message: 'Token inválido o expirado', error: true });
        }
    };

    return (
        <div className='container auth-wrapper' style={{ flexDirection: 'column', justifyContent : 'start', minHeight: '78vh', paddingTop: '5%', gap: '1rem' }}>
            <h2>Ingresa tu nueva contraseña</h2>
            <p>La contraseña debe tener al menos 8 caracteres.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', paddingTop: '1rem', gap: '1rem', width: '100%', maxWidth: '400px' }}>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nueva contraseña"
                    minLength={8}
                    required
                    style={{ padding: '0.5rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid #ccc' }}
                />
                <button type="submit" disabled={status.loading}
                    style={{ padding: '0.5rem', fontSize: '1rem', borderRadius: '8px', backgroundColor: '#ee7e51', color: '#fff', border: 'none' }}>Restablecer</button>
                {status.message && <p className={status.error ? 'error' : 'success'}>{status.message}</p>}
            </form>
        </div>
    );
}