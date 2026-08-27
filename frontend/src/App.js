import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Catalogo from './pages/Catalogo';
import ProductoDetalle from './pages/ProductoDetalle';
import Emprendedores from './pages/Emprendedores';
import EmprendedorDetalle from './pages/EmprendedorDetalle';
import MiEmprendimiento from './pages/MiEmprendimiento';
import Favoritos from './pages/Favoritos';
import Perfil from './pages/Perfil';
import Admin from './pages/Admin';
import Mapa from './pages/Mapa';
import { OlvideContrasena } from './pages/OlvideContrasena';
import { RecuperacionContrasena } from './pages/RecuperacionContrasena';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/producto/:id" element={<ProductoDetalle />} />
            <Route path="/emprendedores" element={<Emprendedores />} />
            <Route path="/emprendedor/:id" element={<EmprendedorDetalle />} />
            <Route path="/mi-emprendimiento" element={<MiEmprendimiento />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
            <Route path="/reset-password" element={<RecuperacionContrasena />} />
          </Routes>
        </main>
        <footer className="footer">
          <div className="container">
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.3rem' }}>ARTISPAY</p>
            <p>Hecho con cariño en Paysandú, Uruguay</p>
          </div>
        </footer>
      </Router>
    </AuthProvider>
  );
}

export default App;
