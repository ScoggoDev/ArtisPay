import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const close = () => setOpen(false);

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand" onClick={close}>ARTISPAY</Link>

      <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
        <span />
      </button>

      <ul className={`nav-links ${open ? 'open' : ''}`}>
        <li><Link to="/catalogo" className="nav-link" onClick={close}>Catálogo</Link></li>
        <li><Link to="/emprendedores" className="nav-link" onClick={close}>Emprendedores</Link></li>
        <li><Link to="/mapa" className="nav-link" onClick={close}>Mapa</Link></li>

        {usuario ? (
          <>
            {usuario.tipo === 'emprendedor' && (
              <>
                <li><Link to="/mi-emprendimiento" className="nav-link" onClick={close}>Mi taller</Link></li>
                <li><Link to="/mis-solicitudes" className="nav-link" onClick={close}>Mis solicitudes</Link></li>
              </>
            )}
            {(usuario.tipo === 'admin' || usuario.tipo === 'moderador') && (
              <li><Link to="/admin" className="nav-link" onClick={close}>Administrar</Link></li>
            )}

            {
              (usuario.tipo === 'emprendedor' || usuario.tipo === 'cliente') &&
              <li><Link to="/favoritos" className="nav-link" onClick={close}>Favoritos</Link></li>
            }
            {
              (usuario.tipo === 'cliente' || usuario.tipo === 'emprendedor') &&
              (
                <li><Link to="/perfil" className="nav-link" onClick={close}>{usuario.nombre_usuario}</Link></li>)
            }
            <li><button className="btn btn-ghost btn-sm" onClick={handleLogout}>Salir</button></li>
          </>
        ) : (
          <>
            <li><Link to="/login" className="nav-link" onClick={close}>Ingresar</Link></li>
            <li><Link to="/registro" className="btn btn-primary btn-sm" onClick={close}>Registrarse</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
