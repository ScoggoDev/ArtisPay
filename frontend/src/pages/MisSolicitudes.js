import { useState, useEffect } from 'react';
import api from '../services/api';

const MisSolicitudes = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

    useEffect(() => {
        fetchSolicitudes();
    }, []);

    const fetchSolicitudes = async () => {
        try {
            const res = await api.get('/solicitudes');
            setSolicitudes(res.data);
        } catch (err) {
            const mensajeError = err.response?.data?.error || 'Error al cargar las solicitudes';
            setError(mensajeError);
        } finally {
            setLoading(false);
        }
    };

    // Función para actualizar el estado (Aceptar / Rechazar)
    const handleCambiarEstado = async (id, nuevoEstado) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/solicitudes/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!res.ok) throw new Error('No se pudo actualizar el estado');

            // Actualización reactiva del estado local
            setSolicitudes(prev =>
                prev.map(item =>
                    item.id_solicitud === id ? { ...item, estado: nuevoEstado } : item
                )
            );

            // Si el modal está abierto, actualizamos su vista también
            if (solicitudSeleccionada && solicitudSeleccionada.id_solicitud === id) {
                setSolicitudSeleccionada(prev => ({ ...prev, estado: nuevoEstado }));
            }
        } catch (err) {
            alert(err.message);
        }
    };

    // Ayudante para etiquetas visuales de estado
    const getBadgeEstado = (estado) => {
        const estilos = {
            pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            aceptada: 'bg-green-100 text-green-800 border-green-300',
            rechazada: 'bg-red-100 text-red-800 border-red-300',
        };
        return (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${estilos[estado?.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                {estado ? estado.toUpperCase() : 'DESCONOCIDO'}
            </span>
        );
    };

    if (loading) return <div className="p-6 text-center text-gray-600">Cargando solicitudes...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="container page-enter">
            <div className='section'>
                <h2 className="text-2xl font-bold mb-6 text-gray-800" style={{ marginBottom: '1rem' }}>Solicitudes de Presupuesto</h2>

                {solicitudes.length === 0 ? (
                    <div className="empty" style={{ minHeight: '53vh' }}>
                        <div className="empty-icon">&#128220;</div>
                        <p>No has recibido solicitudes de presupuesto aún. Cuando recibas una solicitud, se mostrará acá.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto" style={{ minHeight: '59vh', marginTop: '1.5rem' }}>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 text-sm">
                                    <th className="p-3">Cliente</th>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Mensaje</th>
                                    <th className="p-3">Teléfono</th>
                                    <th className="p-3 text-center">Estado</th>
                                    <th className="p-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {solicitudes.map((s) => (
                                    <tr key={s.id_solicitud} className="hover:bg-gray-50 text-sm text-gray-700">
                                        <td className="p-3 font-medium">
                                            <div>{s.cliente_nombre || 'Cliente sin nombre'}</div>
                                            <div className="text-xs text-gray-400">{s.cliente_email}</div>
                                        </td>
                                        <td className="p-3 whitespace-nowrap">
                                            {new Date(s.fecha).toLocaleDateString('es-ES', {
                                                day: '2-digit', month: '2-digit', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="p-3 max-w-xs truncate" title={s.mensaje}>
                                            {s.mensaje}
                                        </td>
                                        <td className="p-3 whitespace-nowrap">
                                            {s.telefono || 'No proporcionado'}
                                        </td>
                                        <td className="p-3 text-center whitespace-nowrap">
                                            {getBadgeEstado(s.estado)}
                                        </td>
                                        <td className="p-3 text-center whitespace-nowrap space-x-2">
                                            <button
                                                onClick={() => setSolicitudSeleccionada(s)}
                                                className="btn badge-sunflower btn-sm">
                                                Detalle
                                            </button>

                                            {s.estado === 'pendiente' && (
                                                <>
                                                    <button
                                                        onClick={() => handleCambiarEstado(s.id_solicitud, 'aceptada')}
                                                        className="btn btn-sage btn-sm"
                                                    >
                                                        Aceptar
                                                    </button>
                                                    <button
                                                        onClick={() => handleCambiarEstado(s.id_solicitud, 'rechazada')}
                                                        className="btn btn-primary btn-sm"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}



                {/* modal para detalle de solicitud */}
                {solicitudSeleccionada && (
                    <div className="modal-backdrop" style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center',
                        alignItems: 'center', zIndex: 1000
                    }}>
                        <div className="modal-content" style={{
                            background: '#fff', padding: '2rem', borderRadius: '8px', width: '100%',
                            maxWidth: '550px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}>
                            <h3 style={{ marginBottom: '1rem' }}>Detalle de la solicitud #{solicitudSeleccionada.id_solicitud}</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                <div>
                                    <strong>Cliente:</strong> {solicitudSeleccionada.cliente_nombre}
                                </div>
                                <div>
                                    <strong>Email del cliente:</strong> {solicitudSeleccionada.cliente_email}
                                </div>
                                <div>
                                    <strong>Teléfono:</strong> {solicitudSeleccionada.telefono || 'No proporcionado'}
                                </div>
                                <div>
                                    <strong>Mensaje:</strong> {solicitudSeleccionada.mensaje}
                                </div>
                                <div>
                                    <strong>Estado actual:</strong>{' '}
                                    <span className={`badge ${solicitudSeleccionada.estado === 'pendiente' ? 'badge-sunflower' : solicitudSeleccionada.estado === 'aceptada' ? 'badge-sage' : 'badge-clay'}`}>
                                        {solicitudSeleccionada.estado}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                {solicitudSeleccionada.estado === 'pendiente' && (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-sage btn-sm"
                                            onClick={() => handleCambiarEstado(solicitudSeleccionada.id_solicitud, 'aceptada')}
                                        >
                                            Aceptar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleCambiarEstado(solicitudSeleccionada.id_solicitud, 'rechazada')}
                                        >
                                            Rechazar
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setSolicitudSeleccionada(null)}
                                >
                                    Cerrar
                                </button>

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MisSolicitudes;