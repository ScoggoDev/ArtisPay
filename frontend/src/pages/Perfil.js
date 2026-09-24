import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ArtisanLogo from '../components/ArtisanLogo';
import ImageCropperModal from '../components/ImageCropperModal';

const PAYSANDU_CENTER = [-32.317, -58.076];
const ROL_LABELS = {
  cliente: 'Cliente',
  emprendedor: 'Emprendedor',
  admin: 'Administrador',
  moderador: 'Moderador'
};

// Funciones auxiliares fuera del componente
function resolveUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('ls:')) return localStorage.getItem(url) || null;
  return url;
}

function parseRedes(redesStr) {
  if (!redesStr) return { instagram: '', facebook: '', otra: '' };

  const partes = redesStr.split(',').map(s => s.trim());
  let instagram = '';
  let facebook = '';
  let otra = '';

  partes.forEach(p => {
    if (p.includes('instagram.com/')) {
      const parts = p.split('instagram.com/');
      instagram = parts[parts.length - 1].replace(/\/$/, '');
    } else if (p.startsWith('@')) {
      instagram = p.substring(1);
    } else if (p.includes('facebook.com')) {
      facebook = p;
    } else if (p) {
      if (!otra) otra = p;
    }
  });

  return { instagram, facebook, otra };
}

function buildRedesString(ig, fb, ot) {
  const result = [];
  if (ig.trim()) {
    const cleanIg = ig.trim().replace(/^@/, '');
    result.push(`https://instagram.com/${cleanIg}`);
  }
  if (fb.trim()) result.push(fb.trim());
  if (ot.trim()) result.push(ot.trim());

  return result.join(', ');
}

// Subcomponente para capturar clics en el mapa
function LocationPicker({ onSelectLocation }) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Componente Principal 
function Perfil() {
  // 1. Hooks de contexto y navegación
  const { usuario, logout, emprendimiento: empCtx } = useAuth();
  const navigate = useNavigate();

  // 2. Estados locales
  const [mensaje, setMensaje] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [editForm, setEditForm] = useState({});
  const [socialFields, setSocialFields] = useState({ instagram: '', facebook: '', otra: '' });

  // Estados para el Cropper de imagen de perfil
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  // 3. Referencias
  const markerRef = useRef(null);
  const profileFileInputRef = useRef(null);

  // 4. Effects
  useEffect(() => {
    if (empCtx) {
      api.get(`/emprendimientos/${empCtx.id_emprendimiento}`)
        .then(r => {
          setEditForm(r.data);
          if (r.data.redes_sociales) {
            setSocialFields(parseRedes(r.data.redes_sociales));
          }
        })
        .catch(() => { });
    }
  }, [empCtx]);

  // 5. Handlers
  const flash = (msg, type = 'success') => {
    setMensaje(msg);
    setMsgType(type);
  };

  const handleDesactivar = async () => {
    if (!window.confirm('¿Estás seguro de que querés desactivar tu cuenta?')) return;
    try {
      await api.put('/usuarios/me/desactivar');
      logout();
      navigate('/');
    } catch {
      setMensaje('Error al desactivar la cuenta');
    }
  };

  const handleUpdatePerfil = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/emprendimientos/me', editForm);
      setEditForm(data);
      flash('Perfil actualizado');
    } catch (err) {
      flash(err.response?.data?.error || 'Error', 'error');
    }
  };

  // Abre el modal cargando la imagen original seleccionada
  const handleProfileImageFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTempImageSrc(ev.target.result);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  };

  // Recibe la imagen recortada devuelta por el modal y la guarda
  const handleCropComplete = (croppedBase64Image) => {
    // 1. Eliminar únicamente las imágenes anteriores del perfil
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('ls:artispay_profile_img_')) {
        localStorage.removeItem(key);
      }
    });

    // 2. Usar un prefijo exclusivo para el perfil
    const key = `ls:artispay_profile_img_${Date.now()}`;

    try {
      localStorage.setItem(key, croppedBase64Image);
      setEditForm(f => ({ ...f, imagen_perfil: key }));
    } catch (error) {
      flash('No hay suficiente espacio disponible. Intenta seleccionar un área más pequeña.', 'error');
    }

    setIsCropping(false);
    setTempImageSrc(null);
    if (profileFileInputRef.current) profileFileInputRef.current.value = '';
  };

  const handleRemoveProfileImage = () => {
    setEditForm(f => ({ ...f, imagen_perfil: '' }));
    if (profileFileInputRef.current) profileFileInputRef.current.value = '';
  };

  const handleSocialChange = (field, value) => {
    const updated = { ...socialFields, [field]: value };
    setSocialFields(updated);
    const redesConcat = buildRedesString(updated.instagram, updated.facebook, updated.otra);
    setEditForm(prev => ({ ...prev, redes_sociales: redesConcat }));
  };

  const handleLocationSelect = (lat, lng) => {
    setEditForm(prev => ({
      ...prev,
      latitud: Number(lat.toFixed(6)),
      longitud: Number(lng.toFixed(6))
    }));
  };

  // 6. Valores memorizados
  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        handleLocationSelect(lat, lng);
      }
    },
  }), []);


  if (!usuario) return null;

  const profileImageSrc = resolveUrl(editForm.imagen_perfil);
  const position = [
    editForm.latitud || PAYSANDU_CENTER[0],
    editForm.longitud || PAYSANDU_CENTER[1]
  ];

  return (
    <div className="page-enter container">
      {usuario?.tipo === 'emprendedor' && (
        <div className="edit-section">
          <h4>Editar perfil</h4>
          {mensaje && (
            <div className={`alert alert-${msgType} flash`}>
              {mensaje}
              <button className="alert-close" onClick={() => setMensaje('')}>&times;</button>
            </div>
          )}
          <form onSubmit={handleUpdatePerfil}>

            {/* Imagen de Perfil */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.8rem', fontWeight: 'bold' }}>
                Foto de perfil
              </label>

              <div
                style={{
                  position: 'relative',
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid var(--terracotta, #D4A27F)',
                  backgroundColor: '#F5EDE4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onClick={() => profileFileInputRef.current?.click()}
                title="Hacé clic para cambiar la foto de perfil"
              >
                {profileImageSrc ? (
                  <img
                    src={profileImageSrc}
                    alt="Foto de perfil"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#B08060', fontSize: '0.85rem', padding: '0.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>📷</div>
                    <span>Subir foto</span>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={profileFileInputRef}
                accept="image/png,image/jpeg,image/webp"
                onChange={handleProfileImageFile}
                style={{ display: 'none' }}
              />

              <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => profileFileInputRef.current?.click()}
                >
                  {profileImageSrc ? 'Cambiar foto' : 'Seleccionar foto'}
                </button>
                {profileImageSrc && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleRemoveProfileImage}
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  className="form-input"
                  value={editForm.nombre || ''}
                  onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  className="form-input"
                  value={editForm.telefono || ''}
                  onChange={e => setEditForm({ ...editForm, telefono: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={editForm.descripcion || ''}
                onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ubicación (Dirección o Referencia)</label>
              <input
                className="form-input"
                value={editForm.ubicacion || ''}
                onChange={e => setEditForm({ ...editForm, ubicacion: e.target.value })}
                placeholder="Ej: 18 de Julio y Montecaseros"
              />
            </div>

            {/* Redes Sociales */}
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Redes sociales</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    padding: '0.55rem 0.8rem',
                    backgroundColor: '#e9ecef',
                    border: '1px solid #ced4da',
                    borderRight: 'none',
                    borderRadius: 'var(--radius-sm, 4px) 0 0 var(--radius-sm, 4px)',
                    color: 'var(--text-light, #6c757d)',
                    fontWeight: 'bold'
                  }}>
                    @
                  </span>
                  <input
                    className="form-input"
                    style={{ borderRadius: '0 var(--radius-sm, 4px) var(--radius-sm, 4px) 0' }}
                    value={socialFields.instagram}
                    onChange={e => handleSocialChange('instagram', e.target.value)}
                    placeholder="Agregar Instagram"
                  />
                </div>

                <input
                  className="form-input"
                  value={socialFields.facebook}
                  onChange={e => handleSocialChange('facebook', e.target.value)}
                  placeholder="Agregar Facebook (link completo)"
                />

                <input
                  className="form-input"
                  value={socialFields.otra}
                  onChange={e => handleSocialChange('otra', e.target.value)}
                  placeholder="Agregar otra red social (link completo)"
                />
              </div>
            </div>

            {/* Ubicación en Mapa */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Marcar ubicación exacta en el mapa</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                Hacé clic en el mapa o arrastrá el pin para fijar la ubicación exacta de tu emprendimiento.
              </p>
              <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', height: '300px', position: 'sticky' }}>
                <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker onSelectLocation={handleLocationSelect} />
                  {editForm.latitud && editForm.longitud && (
                    <Marker
                      draggable={true}
                      eventHandlers={eventHandlers}
                      position={position}
                      ref={markerRef}
                    />
                  )}
                </MapContainer>
              </div>
              {editForm.latitud && editForm.longitud && (
                <p style={{ fontSize: '0.78rem', color: '#666', marginTop: '6px' }}>
                  Coordenadas seleccionadas: {editForm.latitud}, {editForm.longitud}
                </p>
              )}
            </div>

            <button type="submit" className="btn btn-primary">Guardar cambios</button>
          </form>
        </div>
      )}

      {/* Tarjeta con perfil general */}
      <div className="section" style={{ marginBottom: '1.5rem', maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Mi perfil</h2>

        <div className="edit-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
            <ArtisanLogo nombre={usuario.nombre_usuario} size={56} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{usuario.nombre_usuario}</div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.88rem' }}>{usuario.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span className="badge badge-sage">{ROL_LABELS[usuario.tipo] || usuario.tipo}</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />
          <button className="btn btn-danger btn-sm" onClick={handleDesactivar}>Desactivar cuenta</button>
        </div>
      </div>

      {/* Modal Editor de Recorte */}
      {isCropping && (
        <ImageCropperModal
          imageSrc={tempImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setIsCropping(false);
            setTempImageSrc(null);
            if (profileFileInputRef.current) profileFileInputRef.current.value = '';
          }}
        />
      )}
    </div>
  );
}

export default Perfil;