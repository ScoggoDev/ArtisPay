import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import ArtisanLogo from '../components/ArtisanLogo';

function EmprendedorDetalle() {
  const { id } = useParams();
  const [emp, setEmp] = useState(null);

  useEffect(() => {
    api.get(`/emprendimientos/${id}`).then(r => setEmp(r.data)).catch(() => {});
  }, [id]);

  if (!emp) return <div className="container section"><p>Cargando...</p></div>;

  return (
    <div className="page-enter">
      <div className="container">
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
          </div>
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
