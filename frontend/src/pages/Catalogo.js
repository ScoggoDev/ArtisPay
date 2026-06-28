import { useState, useEffect } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState({ busqueda: '', categoria: '', precio_min: '', precio_max: '' });
  const [busquedaInput, setBusquedaInput] = useState('');

  useEffect(() => {
    api.get('/categorias').then(r => setCategorias(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
    if (filtros.categoria) params.append('categoria', filtros.categoria);
    if (filtros.precio_min) params.append('precio_min', filtros.precio_min);
    if (filtros.precio_max) params.append('precio_max', filtros.precio_max);
    api.get(`/productos?${params.toString()}`).then(r => setProductos(r.data)).catch(() => {});
  }, [filtros]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFiltros({ ...filtros, busqueda: busquedaInput });
  };

  const clearFilters = () => {
    setFiltros({ busqueda: '', categoria: '', precio_min: '', precio_max: '' });
    setBusquedaInput('');
  };

  return (
    <div className="page-enter">
      <div className="container section">
        <h2 style={{ marginBottom: '1.5rem' }}>Catálogo de productos</h2>

        <form onSubmit={handleSearch} className="search-bar" style={{ marginBottom: '1.2rem' }}>
          <input
            placeholder="Buscar productos, materiales, estilos..."
            value={busquedaInput}
            onChange={e => setBusquedaInput(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>

        <div className="filters">
          <select className="form-select" value={filtros.categoria} onChange={e => setFiltros({ ...filtros, categoria: e.target.value })}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => (
              <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
            ))}
          </select>
          <input className="form-input" type="number" placeholder="Precio mín" value={filtros.precio_min} onChange={e => setFiltros({ ...filtros, precio_min: e.target.value })} />
          <input className="form-input" type="number" placeholder="Precio máx" value={filtros.precio_max} onChange={e => setFiltros({ ...filtros, precio_max: e.target.value })} />
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Limpiar</button>
        </div>

        {productos.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">&#128270;</div>
            <p>No se encontraron productos.</p>
          </div>
        ) : (
          <div className="grid grid-4">
            {productos.map(p => (
              <ProductCard key={p.id_producto} producto={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Catalogo;
