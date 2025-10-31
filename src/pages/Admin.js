import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '../supabase/client'

export default function Admin() {
  const navigate = useNavigate()
  const supabase = client
  
  const [vista, setVista] = useState('productos')
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriasParaSelect, setCategoriasParaSelect] = useState([])
  const [loading, setLoading] = useState(false)
  const [editando, setEditando] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const [formProducto, setFormProducto] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria_id: '',
    url_imagen: '',
    esta_activo: true
  })

  const [formCategoria, setFormCategoria] = useState({
    nombre: '',
    descripcion: '',
    esta_activa: true
  })

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      if (vista === 'productos') {
        const { data: prods } = await supabase
          .from('productos')
          .select('*, categorias(nombre)')
          .order('nombre')
        setProductos(prods || [])

        const { data: cats } = await supabase
          .from('categorias')
          .select('id, nombre')
          .eq('esta_activa', true)
          .order('nombre')
        setCategoriasParaSelect(cats || [])
        
      } else {
        const { data: cats } = await supabase
          .from('categorias')
          .select('*')
          .order('nombre')
        setCategorias(cats || [])
      }
    } catch (err) {
      alert('Error cargando datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [vista, supabase])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const guardarProducto = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const datos = {
        nombre: formProducto.nombre,
        descripcion: formProducto.descripcion,
        precio: parseFloat(formProducto.precio),
        stock: parseInt(formProducto.stock),
        categoria_id: formProducto.categoria_id,
        url_imagen: formProducto.url_imagen,
        esta_activo: formProducto.esta_activo
      }

      if (editando) {
        const { error } = await supabase
          .from('productos')
          .update(datos)
          .eq('id', editando)
        if (error) throw error
        alert('✅ Producto actualizado')
      } else {
        const { error } = await supabase
          .from('productos')
          .insert(datos)
        if (error) throw error
        alert('✅ Producto creado')
      }

      limpiarFormProducto()
      await cargarDatos()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const editarProducto = (producto) => {
    setEditando(producto.id)
    setFormProducto({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      stock: producto.stock,
      categoria_id: producto.categoria_id,
      url_imagen: producto.url_imagen || '',
      esta_activo: producto.esta_activo
    })
    setMostrarForm(true)
  }

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return

    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id)
      if (error) throw error
      alert('✅ Producto eliminado')
      await cargarDatos()
    } catch (err) {
      alert('Error eliminando: ' + err.message)
    }
  }

  const limpiarFormProducto = () => {
    setFormProducto({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      categoria_id: '',
      url_imagen: '',
      esta_activo: true
    })
    setEditando(null)
    setMostrarForm(false)
  }

  const guardarCategoria = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const datos = {
        nombre: formCategoria.nombre,
        descripcion: formCategoria.descripcion,
        esta_activa: formCategoria.esta_activa
      }

      if (editando) {
        const { error } = await supabase
          .from('categorias')
          .update(datos)
          .eq('id', editando)
        if (error) throw error
        alert('✅ Categoría actualizada')
      } else {
        const { error } = await supabase
          .from('categorias')
          .insert(datos)
        if (error) throw error
        alert('✅ Categoría creada')
      }

      limpiarFormCategoria()
      await cargarDatos()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const editarCategoria = (categoria) => {
    setEditando(categoria.id)
    setFormCategoria({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      esta_activa: categoria.esta_activa
    })
    setMostrarForm(true)
  }

  const eliminarCategoria = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return

    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)
      if (error) throw error
      alert('✅ Categoría eliminada')
      await cargarDatos()
    } catch (err) {
      alert('Error eliminando: ' + err.message)
    }
  }

  const limpiarFormCategoria = () => {
    setFormCategoria({
      nombre: '',
      descripcion: '',
      esta_activa: true
    })
    setEditando(null)
    setMostrarForm(false)
  }

  return (
    
<div
  style={{
    minHeight: '100vh',
    padding: '16px',
    backgroundImage: 'url("/assets/fondo2.gif")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  }}
>
      <header style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>🛠️ Panel Admin</h1>
          <button
            onClick={() => navigate('/catalogo')}
            style={{ fontSize: '14px', padding: '4px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#ffffff', cursor: 'pointer' }}
          >
            Ver Catálogo
          </button>
        </div>
        <button 
          onClick={handleLogout}
          style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
        >
          Cerrar sesión
        </button>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Pestañas */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => { 
              setVista('productos')
              setMostrarForm(false)
              setEditando(null)
            }}
            style={{
              padding: '12px 24px',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              backgroundColor: vista === 'productos' ? '#ffffff' : '#e5e7eb',
              fontWeight: vista === 'productos' ? '600' : '400',
              borderBottom: vista === 'productos' ? '2px solid #2563eb' : 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Productos
          </button>
          <button
            onClick={() => { 
              setVista('categorias')
              setMostrarForm(false)
              setEditando(null)
            }}
            style={{
              padding: '12px 24px',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              backgroundColor: vista === 'categorias' ? '#ffffff' : '#e5e7eb',
              fontWeight: vista === 'categorias' ? '600' : '400',
              borderBottom: vista === 'categorias' ? '2px solid #2563eb' : 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Categorías
          </button>
        </div>

        {/* Contenido */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '24px' }}>
          {/* Botón Agregar */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
              {vista === 'productos' ? 'Gestión de Productos' : 'Gestión de Categorías'}
            </h2>
            <button
              onClick={() => {
                if (vista === 'productos') {
                  limpiarFormProducto()
                } else {
                  limpiarFormCategoria()
                }
                setMostrarForm(true)
              }}
              style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: '#ffffff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
            >
              + Agregar {vista === 'productos' ? 'Producto' : 'Categoría'}
            </button>
          </div>

          {/* Formulario de Producto */}
          {mostrarForm && vista === 'productos' && (
            <form onSubmit={guardarProducto} style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>
                {editando ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formProducto.nombre}
                  onChange={(e) => setFormProducto({...formProducto, nombre: e.target.value})}
                  style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                  required
                />
                <select
                  value={formProducto.categoria_id}
                  onChange={(e) => setFormProducto({...formProducto, categoria_id: e.target.value})}
                  style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categoriasParaSelect.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  value={formProducto.precio}
                  onChange={(e) => setFormProducto({...formProducto, precio: e.target.value})}
                  style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                  required
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={formProducto.stock}
                  onChange={(e) => setFormProducto({...formProducto, stock: e.target.value})}
                  style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                  required
                />
                <input
                  type="text"
                  placeholder="URL de imagen"
                  value={formProducto.url_imagen}
                  onChange={(e) => setFormProducto({...formProducto, url_imagen: e.target.value})}
                  style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', gridColumn: 'span 2' }}
                />
                <textarea
                  placeholder="Descripción"
                  value={formProducto.descripcion}
                  onChange={(e) => setFormProducto({...formProducto, descripcion: e.target.value})}
                  style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', gridColumn: 'span 2' }}
                  rows="3"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formProducto.esta_activo}
                    onChange={(e) => setFormProducto({...formProducto, esta_activo: e.target.checked})}
                  />
                  Producto activo
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '8px 16px', backgroundColor: loading ? '#9ca3af' : '#2563eb', color: '#ffffff', borderRadius: '4px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={limpiarFormProducto}
                  style={{ padding: '8px 16px', backgroundColor: '#d1d5db', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Formulario de Categoría */}
          {mostrarForm && vista === 'categorias' && (
            <form onSubmit={guardarCategoria} style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>
                {editando ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formCategoria.nombre}
                  onChange={(e) => setFormCategoria({...formCategoria, nombre: e.target.value})}
                  style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                  required
                />
                <textarea
                  placeholder="Descripción"
                  value={formCategoria.descripcion}
                  onChange={(e) => setFormCategoria({...formCategoria, descripcion: e.target.value})}
                  style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                  rows="3"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formCategoria.esta_activa}
                    onChange={(e) => setFormCategoria({...formCategoria, esta_activa: e.target.checked})}
                  />
                  Categoría activa
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '8px 16px', backgroundColor: loading ? '#9ca3af' : '#2563eb', color: '#ffffff', borderRadius: '4px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={limpiarFormCategoria}
                  style={{ padding: '8px 16px', backgroundColor: '#d1d5db', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Tabla de Productos */}
          {vista === 'productos' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f3f4f6' }}>
                  <tr>
                    <th style={{ padding: '8px 16px', textAlign: 'left' }}>Nombre</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left' }}>Categoría</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left' }}>Precio</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left' }}>Stock</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left' }}>Estado</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map(prod => (
                    <tr key={prod.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px 16px' }}>{prod.nombre}</td>
                      <td style={{ padding: '8px 16px' }}>{prod.categorias?.nombre}</td>
                      <td style={{ padding: '8px 16px' }}>${Number(prod.precio).toFixed(2)}</td>
                      <td style={{ padding: '8px 16px' }}>{prod.stock}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          backgroundColor: prod.esta_activo ? '#d1fae5' : '#fee2e2',
                          color: prod.esta_activo ? '#065f46' : '#991b1b'
                        }}>
                          {prod.esta_activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <button
                          onClick={() => editarProducto(prod)}
                          style={{ color: '#2563eb', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarProducto(prod.id)}
                          style={{ color: '#dc2626', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productos.length === 0 && (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>No hay productos</p>
              )}
            </div>
          )}

          {/* Tabla de Categorías */}
          {vista === 'categorias' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f3f4f6' }}>
                  <tr>
                    <th style={{ padding: '8px 16px', textAlign: 'left' }}>Nombre</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left' }}>Descripción</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left' }}>Estado</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map(cat => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px 16px', fontWeight: '500' }}>{cat.nombre}</td>
                      <td style={{ padding: '8px 16px' }}>{cat.descripcion || '-'}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          backgroundColor: cat.esta_activa ? '#d1fae5' : '#fee2e2',
                          color: cat.esta_activa ? '#065f46' : '#991b1b'
                        }}>
                          {cat.esta_activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <button
                          onClick={() => editarCategoria(cat)}
                          style={{ color: '#2563eb', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarCategoria(cat.id)}
                          style={{ color: '#dc2626', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {categorias.length === 0 && (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>No hay categorías</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}