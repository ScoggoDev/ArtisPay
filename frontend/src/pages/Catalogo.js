import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

function Catalogo() {
  const [searchParams] = useSearchParams();
  const [productos, setProductos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState({
    busqueda: searchParams.get('busqueda') || '',
    categoria: searchParams.get('categoria') || '',
    precio_min: '',
    precio_max: '',
    tipo: 'todos' 
  });
  const [busquedaInput, setBusquedaInput] = useState(searchParams.get('busqueda') || '');

  useEffect(() => {
    api.get('/categorias').then(r => setCategorias(r.data)).catch(() => { });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
    if (filtros.categoria) params.append('categoria', filtros.categoria);
    if (filtros.precio_min) params.append('precio_min', filtros.precio_min);
    if (filtros.precio_max) params.append('precio_max', filtros.precio_max);

    const queryStr = params.toString();

    if (filtros.tipo === 'todos' || filtros.tipo === 'productos') {
      api.get(`/productos?${queryStr}`).then(r => setProductos(r.data)).catch(() => setProductos([]));
    } else {
      setProductos([]);
    }

    if (filtros.tipo === 'todos' || filtros.tipo === 'servicios') {
      api.get(`/servicios?${queryStr}`).then(r => setServicios(r.data)).catch(() => setServicios([]));
    } else {
      setServicios([]);
    }
  }, [filtros]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFiltros({ ...filtros, busqueda: busquedaInput });
  };

  const clearFilters = () => {
    setFiltros({ busqueda: '', categoria: '', precio_min: '', precio_max: '', tipo: 'todos' });
    setBusquedaInput('');
  };

  const sinResultados = productos.length === 0 && servicios.length === 0;

  return (
    <div className="page-enter container">
      <div className="section">
        <h2 style={{ marginBottom: '1.5rem' }}>Catálogo de productos y servicios</h2>

        <form onSubmit={handleSearch} className="search-bar" style={{ marginBottom: '1.2rem' }}>
          <input
            placeholder="Buscar productos, servicios, estilos..."
            value={busquedaInput}
            onChange={e => setBusquedaInput(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>

        <div className="filters">
          {/* Filtro de Tipo */}
          <select
            className="form-select"
            value={filtros.tipo}
            onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}
          >
            <option value="todos">Todos los tipos</option>
            <option value="productos">Solo Productos</option>
            <option value="servicios">Solo Servicios</option>
          </select>

          {/* Filtro de Categoría */}
          <select className="form-select" value={filtros.categoria} onChange={e => setFiltros({ ...filtros, categoria: e.target.value })}>
            <option value="">Todas las categorías</option>
            <option value="">Todas las categorías</option>
            {categorias.map(c => (
              <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
            ))}
          </select>

          <input className="form-input" type="number" placeholder="Precio mín" value={filtros.precio_min} onChange={e => setFiltros({ ...filtros, precio_min: e.target.value })} />
          <input className="form-input" type="number" placeholder="Precio máx" value={filtros.precio_max} onChange={e => setFiltros({ ...filtros, precio_max: e.target.value })} />
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Limpiar</button>
        </div>

        {sinResultados ? (
          <div className="empty">
            <div className="empty-icon">&#128270;</div>
            <p>No se encontraron productos o servicios que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <>
            {/* Sección de Productos */}
            {productos.length > 0 && (
              <div style={{ marginBottom: '2.5rem' }}>
                {filtros.tipo === 'todos' && <h3>Productos</h3>}
                <div className="grid grid-4" style={{ marginTop: '1rem' }}>
                  {productos.map(p => (
                    <ProductCard key={p.id_producto} producto={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Sección de Servicios */}
            {servicios.length > 0 && (
              <div>
                {filtros.tipo === 'todos' && <h3>Servicios</h3>}
                <div className="grid grid-4" style={{ marginTop: '1rem' }}>
                  {servicios.map(s => (
                    <ProductCard key={s.id_servicio || s.id_producto} producto={s} esServicio={true} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Catalogo;