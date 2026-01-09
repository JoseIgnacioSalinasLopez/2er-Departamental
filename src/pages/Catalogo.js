import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '../supabase/client'

export default function Catalogo() {
  const navigate = useNavigate()
  const supabase = client
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [productosBuscados, setProductosBuscados] = useState([])
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([])
  const [menuCategoriaAbierto, setMenuCategoriaAbierto] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [cantidadCarrito, setCantidadCarrito] = useState(0)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuCategoriaAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const cargarCantidadCarrito = useCallback(async (userId) => {
    const { data } = await supabase
      .from('items_carrito')
      .select('cantidad', { count: 'exact' })
      .eq('carrito_id', userId)
    
    if (data) {
      const total = data.reduce((sum, item) => sum + item.cantidad, 0)
      setCantidadCarrito(total)
    }
  }, [supabase])

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: perfil, error } = await supabase
          .from('perfiles')
          .select('nombre_completo, rol')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Error al cargar perfil:', error)
        }
        
        setUsuario({ 
          id: user.id, 
          email: user.email, 
          nombre: perfil?.nombre_completo,
          rol: perfil?.rol || 'user',
          es_admin: perfil?.rol === 'admin'
        })
        await cargarCantidadCarrito(user.id)
      } else {
        setUsuario(null)
      }
    }
    getUser()
  }, [cargarCantidadCarrito, supabase])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data: cats, error: err1 } = await supabase
          .from('categorias')
          .select('id,nombre')
          .eq('esta_activa', true)
          .order('nombre')
        if (err1) throw err1

        const { data: prods, error: err2 } = await supabase
          .from('productos')
          .select('id,categoria_id,nombre,descripcion,precio,stock,url_imagen')
          .eq('esta_activo', true)
          .order('nombre')
        if (err2) throw err2

        setCategorias(cats)
        setProductos(prods)
        setProductosBuscados(prods)
      } catch (err) {
        setError(err.message || String(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase()
    if (q === '') {
      setProductosBuscados(productos)
    } else {
      setProductosBuscados(
        productos.filter(
          p =>
            p.nombre.toLowerCase().includes(q) ||
            (p.descripcion || '').toLowerCase().includes(q)
        )
      )
    }
  }

  const toggleCategoria = (categoriaId) => {
    setCategoriasSeleccionadas(prev => {
      if (prev.includes(categoriaId)) {
        return prev.filter(id => id !== categoriaId)
      } else {
        return [...prev, categoriaId]
      }
    })
  }

  const agregarAlCarrito = async (producto) => {
    if (!usuario?.id) {
      alert('Debes iniciar sesión para comprar')
      return
    }

    try {
      const { error: carritoError } = await supabase
        .from('carritos')
        .upsert({ usuario_id: usuario.id }, { onConflict: 'usuario_id' })
      
      if (carritoError) throw carritoError

      const { data: itemExistente } = await supabase
        .from('items_carrito')
        .select('id, cantidad')
        .eq('carrito_id', usuario.id)
        .eq('producto_id', producto.id)
        .single()

      if (itemExistente) {
        if (itemExistente.cantidad >= producto.stock) {
          alert(`Solo hay ${producto.stock} unidades disponibles`)
          return
        }

        const { error: updateError } = await supabase
          .from('items_carrito')
          .update({ cantidad: itemExistente.cantidad + 1 })
          .eq('id', itemExistente.id)
        
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('items_carrito')
          .insert({
            carrito_id: usuario.id,
            producto_id: producto.id,
            cantidad: 1
          })
        
        if (insertError) throw insertError
      }

      await cargarCantidadCarrito(usuario.id)
      alert('Producto agregado al carrito')
      
    } catch (err) {
      console.error('Error:', err)
      alert('Error al agregar al carrito: ' + err.message)
    }
  }

  const productosFiltrados = productosBuscados.filter(p => {
    if (categoriasSeleccionadas.length === 0) return true
    return categoriasSeleccionadas.includes(p.categoria_id)
  })

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
      
      <header style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff' }}>MotoStore</h1>
          <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button style={{ fontSize: '14px', padding: '4px 8px', fontWeight: '500', color: '#ffffff', background: 'none', border: 'none' }}>Catálogo</button>
            
            {/* BOTÓN ADMIN (Solo visible para admins) */}
            {usuario?.es_admin && (
              <button
                onClick={() => navigate('/admin')}
                style={{ fontSize: '14px', padding: '4px 12px', backgroundColor: '#a855f7', color: '#ffffff', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Admin
              </button>
            )}
          </nav>
        </div>

        {/* ÁREA DE USUARIO Y CARRITO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {usuario ? (
            // SI HAY USUARIO: Muestra Nombre + Cerrar Sesión
            <>
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '500' }}>
                {usuario.nombre || usuario.email}
                {usuario.es_admin && (
                  <span style={{ marginLeft: '8px', fontSize: '12px', backgroundColor: '#f3e8ff', color: '#7c3aed', padding: '2px 8px', borderRadius: '4px' }}>
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={async () => {
                   await client.auth.signOut()
                   setUsuario(null)
                   setCantidadCarrito(0)
                   navigate('/login')
                }}
                style={{ fontSize: '14px', padding: '8px 12px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            // SI NO HAY USUARIO: Muestra Botón Iniciar Sesión
            <button
              onClick={() => navigate('/login')}
              style={{ fontSize: '14px', padding: '8px 12px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
            >
              Iniciar sesión
            </button>
          )}

          <button
            onClick={() => navigate('/carrito')}
            style={{ fontSize: '14px', padding: '8px 12px', backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
          >
            Carrito ({cantidadCarrito})
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1152px', margin: '0 auto' }}>
        <section style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <input
              placeholder="Buscar producto..."
              style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', width: '256px', maxWidth: '100%' }}
              onChange={handleSearch}
            />
            
            {categoriasSeleccionadas.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#9ca3af' }}>
                <span>Filtrando por:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {categoriasSeleccionadas.map(catId => {
                    const cat = categorias.find(c => c.id === catId)
                    return (
                      <span
                        key={catId}
                        style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {cat?.nombre}
                        <button
                          onClick={() => toggleCategoria(catId)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8' }}
                        >
                          ✕
                        </button>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            {productosFiltrados.length} producto(s)
          </div>
        </section>

        {loading && <p style={{ color: '#ffffff' }}>Cargando catálogo...</p>}
        {error && <p style={{ color: '#dc2626' }}>Error: {error}</p>}

        {!loading && !error && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {productosFiltrados.map(p => (
              <article key={p.id} style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <div style={{ height: '160px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  {p.url_imagen ? (
                    <img
                      src={p.url_imagen}
                      alt={p.nombre}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ color: '#9ca3af' }}>Imagen</div>
                  )}
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontWeight: '500', marginBottom: '8px' }}>{p.nombre}</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>{p.descripcion}</p>
                  
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    ${Number(p.precio).toFixed(2)}
                  </div>
                  
                  <div
                    style={{
                      fontSize: '12px',
                      marginBottom: '12px',
                      color: p.stock > 0 ? '#16a34a' : '#dc2626'
                    }}
                  >
                    {p.stock > 0
                      ? `En stock: ${p.stock}`
                      : 'Agotado'}
                  </div>
                  
                  <button
                    onClick={() => agregarAlCarrito(p)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: p.stock <= 0 ? '#d1d5db' : '#2563eb',
                      color: '#ffffff',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: p.stock <= 0 ? 'not-allowed' : 'pointer',
                      fontWeight: '500'
                    }}
                    disabled={p.stock <= 0}
                  >
                    Agregar al carrito
                  </button>
                </div>
              </article>
            ))}

            {productosFiltrados.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#9ca3af', padding: '32px 0' }}>
                No se encontraron productos con los filtros seleccionados.
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
