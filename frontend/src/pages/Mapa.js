import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PAYSANDU_CENTER = [-32.317, -58.076];

const tagStyle = (type) => ({
  display: 'inline-block',
  fontSize: '0.68rem',
  fontWeight: 700,
  padding: '1px 6px',
  borderRadius: 4,
  marginRight: 4,
  background: type === 'producto' ? '#FFF0C2' : '#E3EDDA',
  color: type === 'producto' ? '#9a6800' : '#3a6b2a',
});

function ItemsPreview({ id }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.get(`/emprendimientos/${id}`).then(r => {
      const productos = (r.data.productos || []).slice(0, 3).map(p => ({ ...p, _tipo: 'producto' }));
      const servicios = (r.data.servicios || []).slice(0, 3).map(s => ({ ...s, _tipo: 'servicio' }));
      // interleave: fill up to 3 total, products first
      const combined = [...productos, ...servicios].slice(0, 3);
      setItems(combined);
    }).catch(() => setItems([]));
  }, [id]);

  if (items === null) return <p style={{ fontSize: '0.8rem', color: '#999', margin: '6px 0' }}>Cargando...</p>;
  if (items.length === 0) return <p style={{ fontSize: '0.8rem', color: '#999', margin: '6px 0' }}>Sin productos ni servicios aún.</p>;

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 8px' }}>
      {items.map(item => (
        <li key={`${item._tipo}-${item.id_producto || item.id_servicio}`} style={{ marginBottom: 5, fontSize: '0.82rem' }}>
          <span style={tagStyle(item._tipo)}>{item._tipo === 'producto' ? 'Producto' : 'Servicio'}</span>
          <span style={{ fontWeight: 600 }}>{item.nombre}</span>
          {item.precio && (
            <span style={{ color: '#E8734A', marginLeft: 6, fontWeight: 700 }}>
              ${item.precio.toLocaleString('es-UY')}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Mapa() {
  const [emprendimientos, setEmprendimientos] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api.get('/emprendimientos').then(r => setEmprendimientos(r.data)).catch(() => {});
  }, []);

  const conUbicacion = emprendimientos.filter(e => e.latitud && e.longitud);

  return (
    <div className="page-enter">
      <div className="container section">
        <h2 style={{ marginBottom: '0.5rem' }}>Mapa de Artesanos</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
          {conUbicacion.length} artesano{conUbicacion.length !== 1 ? 's' : ''} en Paysandú
        </p>

        <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', height: '520px' }}>
          <MapContainer center={PAYSANDU_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {conUbicacion.map(e => (
              <Marker
                key={e.id_emprendimiento}
                position={[e.latitud, e.longitud]}
                eventHandlers={{ popupopen: () => setOpenId(e.id_emprendimiento) }}
              >
                <Popup minWidth={200}>
                  <div style={{ minWidth: 190 }}>
                    <strong style={{ fontSize: '1rem', display: 'block', marginBottom: 2 }}>{e.nombre}</strong>
                    {e.ubicacion && (
                      <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: 6 }}>{e.ubicacion}</p>
                    )}
                    <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '6px 0' }} />
                    {openId === e.id_emprendimiento && <ItemsPreview id={e.id_emprendimiento} />}
                    <Link
                      to={`/emprendedor/${e.id_emprendimiento}`}
                      style={{ fontSize: '0.82rem', color: '#E8734A', fontWeight: 600 }}
                    >
                      Ver perfil completo →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default Mapa;
