import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ArtisanLogo from '../components/ArtisanLogo';
import api from '../services/api';

function resolveUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('ls:')) return localStorage.getItem(url) || null;
    return url;
}

function ServicioDetalle() {
    const { id } = useParams();
    const { usuario } = useAuth();
    const [servicio, setServicio] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [msgType, setMsgType] = useState('info');
    const [reportar, setReportar] = useState(false);
    const [ocultar, setOcultar] = useState(false);
    const [motivo_reporte, setMotivoReporte] = useState('');
    const [comentarios_reporte, setComentariosReporte] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showModalSolicitud, setShowModalSolicitud] = useState(false);
    const [solicitudForm, setSolicitudForm] = useState({
        emprendimiento: '',
        usuario: '',
        telefono_cliente: '',
        descripcion: '',
    });
    
    // Estados para el efecto Zoom
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

    const solicitarPresupuesto = useAuth().solicitarPresupuesto;
    const crearReporte = useAuth().crearReporte;
    const ocultarServicio = useAuth().ocultarServicio;

    useEffect(() => {
        api.get(`/servicios/${id}`).then(r => setServicio(r.data)).catch(() => { });
    }, [id]);

    const agregarFavorito = async () => {
        try {
            await api.post(`/favoritos/${id}`);
            setMensaje('Agregado a favoritos');
            setMsgType('success');
        } catch (err) {
            setMensaje(err.response?.data?.error || 'Error');
            setMsgType('error');
        }
    };

    // Obtener array limpio de URLs de imágenes (Servicio > Perfil de Emprendimiento)
    const getImageUrls = (prod) => {
        if (!prod) return [];

        let list = [];

        if (Array.isArray(prod.imagenes)) {
            list = prod.imagenes;
        } else if (typeof prod.imagenes === 'string') {
            try {
                const parsed = JSON.parse(prod.imagenes);
                list = Array.isArray(parsed) ? parsed : [prod.imagenes];
            } catch {
                list = [prod.imagenes];
            }
        } else if (typeof prod.imagen === 'string') {
            list = [prod.imagen];
        }

        let resolvedList = list
            .map(item => (typeof item === 'string' ? item : item?.url))
            .map(url => resolveUrl(url))
            .filter(Boolean);

        // Si el servicio no tiene imágenes, verificar si el emprendimiento tiene imagen de perfil
        if (resolvedList.length === 0 && prod.emprendimiento) {
            const perfilUrl = prod.emprendimiento.imagen_perfil || prod.emprendimiento.logo || prod.emprendimiento.imagen;
            const resolvedPerfil = resolveUrl(perfilUrl);
            if (resolvedPerfil) {
                resolvedList = [resolvedPerfil];
            }
        }

        return resolvedList;
    };

    if (!servicio) return <div className="container section"><p>Cargando servicio...</p></div>;

    const imagenes = getImageUrls(servicio);
    const totalImagenes = imagenes.length;
    const emp = servicio.emprendimiento;

    const handlePrev = () => {
        setCurrentIndex(prev => (prev === 0 ? totalImagenes - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev === totalImagenes - 1 ? 0 : prev + 1));
    };

    // Funciones para calcular la posición del ratón sobre la imagen
    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPos({ x, y });
    };

    const handleMouseEnter = () => setIsZoomed(true);
    const handleMouseLeave = () => setIsZoomed(false);

    const currentImage = totalImagenes > 0 && imagenes[currentIndex];

    // modal solicitar presupuesto // 
    const handleSolicitarPresupuesto = () => {
        setSolicitudForm({ descripcion: '', telefono_cliente: '' });
        setShowModalSolicitud(true);
    };

    // envío de solicitud presupuesto // 
    const crearSolicitud = async (e) => {
        e.preventDefault();
        if (!solicitudForm.descripcion.trim()) {
            setMensaje('Solicitud debe contener una descripción');
            return;
        }
        try {
            await solicitarPresupuesto(emp.id_emprendimiento, usuario.id_usuario, solicitudForm.descripcion, solicitudForm.telefono_cliente);
            setMensaje('Solicitud creada con éxito');
            setMsgType('success');
            setShowModalSolicitud(false);
        } catch (error) {
            setMensaje('Error al enviar la solicitud');
            setMsgType('error');
            console.log(error);
        }
    };

    const handleReportar = () => {
        setReportar(prev => {
            const nuevoEstado = !prev;
            if (nuevoEstado) setOcultar(false);
            return nuevoEstado;
        });
    };

    const handleOcultar = () => {
        setOcultar(prev => {
            const nuevoEstado = !prev;
            if (nuevoEstado) setReportar(false);
            return nuevoEstado;
        });
    };

    const reportarServicio = async () => {
        if (!motivo_reporte || motivo_reporte.trim() === '') {
            setMensaje('Por favor, selecciona un motivo para continuar.');
            setMsgType('error');
            return;
        }
        try {
            await crearReporte(usuario.id_usuario, emp.id_emprendimiento, parseInt(id), motivo_reporte, comentarios_reporte);
            setMensaje('Servicio reportado');
            setMsgType('success');
            setReportar(false);
        } catch (err) {
            setMensaje(err.response?.data?.error || 'Error al reportar');
            setMsgType('error');
        }
    };

    const ocultarProd = async () => {
        try {
            await ocultarServicio(parseInt(id));
            setMensaje('Servicio ocultado');
            setMsgType('success');
            setOcultar(false);
        } catch (err) {
            setMensaje(err.response?.data?.error || 'Error al ocultar');
            setMsgType('error');
        }
    };

    return (
        <div className="page-enter container">
            <div className="section" style={{ minHeight: '78vh' }}>
                {mensaje && (
                    <div className={`alert alert-${msgType} flash`}>
                        {mensaje}
                        <button className="alert-close" onClick={() => setMensaje('')}>&times;</button>
                    </div>
                )}

                <div className="detail-grid">
                    {/* SECCIÓN IMÁGENES / CARRUSEL CON ZOOM / LOGO */}
                    <div>
                        {!currentImage ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '2rem 0' }}>
                                <ArtisanLogo nombre={emp?.nombre} id_categoria={emp?.id_categoria} size={80} />
                            </div>
                        ) : (
                            <div
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onMouseMove={handleMouseMove}
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    overflow: 'hidden',
                                    borderRadius: 'var(--radius, 8px)',
                                    cursor: 'zoom-in'
                                }}
                            >
                                <img
                                    src={currentImage}
                                    alt={servicio.nombre}
                                    className="detail-img"
                                    style={{
                                        width: '100%',
                                        display: 'block',
                                        transition: isZoomed ? 'transform 0.1s ease-out' : 'transform 0.3s ease',
                                        transform: isZoomed ? 'scale(1.8)' : 'scale(1)',
                                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                                    }}
                                />

                                {/* Botones de navegación */}
                                {totalImagenes > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrev}
                                            onMouseEnter={(e) => {
                                                e.stopPropagation();
                                                handleMouseLeave();
                                            }}
                                            onMouseLeave={(e) => {
                                                e.stopPropagation();
                                                handleMouseEnter(e);
                                                handleMouseMove(e);
                                            }}
                                            onMouseMove={(e) => e.stopPropagation()}
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '12px',
                                                transform: 'translateY(-50%)',
                                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '36px',
                                                height: '36px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '18px',
                                                zIndex: 3,
                                                userSelect: 'none',
                                                opacity: isZoomed ? 0.2 : 1,
                                                transition: 'opacity 0.2s'
                                            }}
                                            title="Anterior"
                                        >
                                            &#10094;
                                        </button>

                                        <button
                                            onClick={handleNext}
                                            onMouseEnter={(e) => {
                                                e.stopPropagation();
                                                handleMouseLeave();
                                            }}
                                            onMouseLeave={(e) => {
                                                e.stopPropagation();
                                                handleMouseEnter(e);
                                                handleMouseMove(e);
                                            }}
                                            onMouseMove={(e) => e.stopPropagation()}
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                right: '12px',
                                                transform: 'translateY(-50%)',
                                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '36px',
                                                height: '36px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '18px',
                                                zIndex: 3,
                                                userSelect: 'none',
                                                opacity: isZoomed ? 0.2 : 1,
                                                transition: 'opacity 0.2s'
                                            }}
                                            title="Siguiente"
                                        >
                                            &#10095;
                                        </button>

                                        {/* Indicador de posición / Puntos */}
                                        <div
                                            onMouseEnter={(e) => {
                                                e.stopPropagation();
                                                handleMouseLeave();
                                            }}
                                            onMouseLeave={(e) => {
                                                e.stopPropagation();
                                                handleMouseEnter(e);
                                                handleMouseMove(e);
                                            }}
                                            onMouseMove={(e) => e.stopPropagation()}
                                            style={{
                                                position: 'absolute',
                                                bottom: '12px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                display: 'flex',
                                                gap: '6px',
                                                zIndex: 3,
                                                opacity: isZoomed ? 0.2 : 1,
                                                transition: 'opacity 0.2s'
                                            }}
                                        >
                                            {imagenes.map((_, idx) => (
                                                <span
                                                    key={idx}
                                                    onClick={() => setCurrentIndex(idx)}
                                                    style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                                                        cursor: 'pointer',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Miniaturas (Thumbnails) */}
                        {totalImagenes > 1 && (
                            <div className="detail-thumbs" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                                {imagenes.map((imgUrl, idx) => (
                                    <img
                                        key={idx}
                                        src={imgUrl}
                                        alt={`Miniatura ${idx + 1}`}
                                        className="detail-thumb"
                                        onClick={() => setCurrentIndex(idx)}
                                        style={{
                                            cursor: 'pointer',
                                            border: idx === currentIndex ? '2px solid var(--terracotta, #D4A27F)' : '2px solid transparent',
                                            opacity: idx === currentIndex ? 1 : 0.7,
                                            transition: 'all 0.2s ease',
                                            borderRadius: 'var(--radius-sm, 4px)'
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* DETALLES DEL PRODUCTO */}
                    <div>
                        <div style={{ marginBottom: '0.4rem' }}>
                            <span style={{
                                fontWeight: 700,
                                background: 'var(--sage-light)',
                                color: 'var(--sage)',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: '1rem'
                            }}>
                                Servicio
                            </span>
                        </div>
                        {servicio.categoria_nombre && (
                            <div style={{ marginBottom: '0.5rem' }}>
                                <span className="badge badge-terracotta">{servicio.categoria_nombre}</span>
                                {servicio.destacado && <span className="badge badge-sunflower" style={{ marginLeft: '0.4rem' }}>Destacado</span>}
                            </div>
                        )}

                        <h2 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>{servicio.nombre}</h2>
                        <div className="price" style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>{servicio.precio ? '$' + servicio.precio : 'Precio a convenir'}</div>
                        <p style={{ lineHeight: 1.7, color: 'var(--text-light)', marginBottom: '1.5rem' }}>{servicio.descripcion}</p>

                        {usuario && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-secondary" onClick={agregarFavorito} style={{ marginBottom: '1rem' }}>
                                    &#9829; Agregar a favoritos
                                </button>
                                <button className="btn btn-primary" onClick={handleSolicitarPresupuesto} style={{ marginBottom: '1rem' }}>
                                    Solicitar presupuesto
                                </button>
                            </div>
                        )}

                        {emp && (
                            <div className="contact-box">
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{emp.nombre}</h4>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', marginBottom: '0.8rem' }}>
                                    {emp.descripcion?.substring(0, 120)}
                                </p>
                                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    {emp.telefono && (
                                        <a href={`https://wa.me/${emp.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="whatsapp-btn">
                                            WhatsApp
                                        </a>
                                    )}
                                    <Link to={`/emprendedor/${emp.id_emprendimiento}`} className="btn btn-outline btn-sm">
                                        Ver perfil
                                    </Link>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '2rem 0 0 0' }}>
                            {usuario && (
                                <button className="btn btn-danger" style={{ marginTop: '1rem' }} onClick={handleReportar}>
                                    Reportar
                                </button>
                            )}

                            {(usuario?.tipo === 'admin' || usuario?.tipo === 'moderador') && (
                                <button className="btn btn-danger" style={{ marginTop: '1rem' }} onClick={handleOcultar}>
                                    Ocultar
                                </button>
                            )}
                        </div>

                        {/* Modal solicitud presupuesto */}
                        {showModalSolicitud && (
                            <div className="modal-overlay" onClick={() => setShowModalSolicitud(false)}>
                                <div className="modal-content" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3>Solicitar presupuesto</h3>
                                        <button className="modal-close" onClick={() => setShowModalSolicitud(false)}>&times;</button>
                                    </div>
                                    <form onSubmit={crearSolicitud}>
                                        <div className="form-group">
                                            <label className="form-label">Descripción del servicio a solicitar</label>
                                            <textarea className="form-textarea" rows={2} value={solicitudForm.descripcion}
                                                placeholder='Recordá agregar datos necesarios para el presupuesto (medidas, materiales, etc)'
                                                onChange={e => setSolicitudForm({ ...solicitudForm, descripcion: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="form-label">Agregá tu número de teléfono o medio de contacto (opcional)</label>
                                            <input type="text" className="form-input" value={solicitudForm.telefono_cliente} onChange={e => setSolicitudForm({ ...solicitudForm, telefono_cliente: e.target.value })} />
                                        </div>
                                        <button type="submit" className="btn btn-sage btn-block" style={{marginTop:'1rem'}}>Enviar solicitud</button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {reportar && (
                            <div className="report-box" style={{ marginTop: '1rem' }}>
                                <p>¿Estás seguro de que deseas reportar este servicio?</p>
                                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                                    <label className="form-label">Motivo</label>
                                    <select className="form-input" value={motivo_reporte} onChange={e => setMotivoReporte(e.target.value)}>
                                        <option value="">Selecciona un motivo</option>
                                        <option value="Inapropiado">Contenido inapropiado</option>
                                        <option value="Engañoso">Información engañosa</option>
                                        <option value="Spam">Spam / Publicidad no deseada</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Comentarios adicionales</label>
                                    <textarea className="form-textarea" rows={2} value={comentarios_reporte} onChange={e => setComentariosReporte(e.target.value)} />
                                </div>
                                <button className="btn btn-danger" onClick={reportarServicio}>Confirmar reporte</button>
                            </div>
                        )}

                        {ocultar && (
                            <div className="report-box" style={{ marginTop: '1rem' }}>
                                <p>¿Estás seguro de que deseas ocultar este servicio?</p>
                                <button className="btn btn-danger" onClick={ocultarProd}>Confirmar</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ServicioDetalle;