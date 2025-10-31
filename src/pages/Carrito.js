import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '../supabase/client'

export default function Carrito() {
  const navigate = useNavigate()
  const supabase = client
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState(null)

  const cargarCarrito = useCallback(async (userId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('items_carrito')
        .select(`
          id,
          cantidad,
          productos (
            id,
            nombre,
            precio,
            stock,
            url_imagen
          )
        `)
        .eq('carrito_id', userId)

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      alert('Error cargando carrito: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUsuario(user)
        await cargarCarrito(user.id)
      }
    }
    init()
  }, [cargarCarrito, supabase])

  const actualizarCantidad = async (itemId, nuevaCantidad, stockDisponible) => {
    if (nuevaCantidad < 1) return
    if (nuevaCantidad > stockDisponible) {
      alert(`Solo hay ${stockDisponible} unidades disponibles`)
      return
    }

    try {
      const { error } = await supabase
        .from('items_carrito')
        .update({ cantidad: nuevaCantidad })
        .eq('id', itemId)

      if (error) throw error
      await cargarCarrito(usuario.id)
    } catch (err) {
      alert('Error actualizando cantidad: ' + err.message)
    }
  }

  const eliminarItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('items_carrito')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      await cargarCarrito(usuario.id)
    } catch (err) {
      alert('Error eliminando producto: ' + err.message)
    }
  }

  const handlePagar = () => {
    if (items.length === 0) {
      alert('El carrito está vacío')
      return
    }
    navigate('/checkout')
  }

  const calcularTotal = () => {
    return items.reduce((total, item) => {
      return total + (Number(item.productos.precio) * item.cantidad)
    }, 0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#ffffff' }}>Cargando carrito...</p>
      </div>
    )
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
      <header style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff' }}>MotoStore</h1>
          <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => navigate('/catalogo')}
              style={{ fontSize: '14px', padding: '4px 8px', color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Catálogo
            </button>
            <button style={{ fontSize: '14px', padding: '4px 8px', fontWeight: '500', color: '#ffffff', background: 'none', border: 'none' }}>
              Mi Carrito
            </button>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '14px', color: '#ffffff' }}>{usuario?.email}</div>
          <button 
            onClick={handleLogout}
            style={{ fontSize: '14px', padding: '4px 12px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '896px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#ffffff' }}>Mi Carrito de Compras</h2>

        {items.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '32px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>Tu carrito está vacío</p>
            <button
              onClick={() => navigate('/catalogo')}
              style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
            >
              Ir al catálogo
            </button>
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    padding: '16px', 
                    borderBottom: index === items.length - 1 ? 'none' : '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ width: '96px', height: '96px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.productos.url_imagen ? (
                      <img
                        src={item.productos.url_imagen}
                        alt={item.productos.nombre}
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ color: '#9ca3af', fontSize: '14px' }}>Sin imagen</div>
                    )}
                  </div>

                  <div style={{ flexGrow: 1 }}>
                    <h3 style={{ fontWeight: '600', fontSize: '18px' }}>{item.productos.nombre}</h3>
                    <p style={{ color: '#6b7280' }}>
                      Precio: ${Number(item.productos.precio).toFixed(2)}
                    </p>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                      Stock disponible: {item.productos.stock}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => actualizarCantidad(item.id, item.cantidad - 1, item.productos.stock)}
                      style={{ width: '32px', height: '32px', backgroundColor: '#e5e7eb', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <span style={{ width: '48px', textAlign: 'center', fontWeight: '600' }}>{item.cantidad}</span>
                    <button
                      onClick={() => actualizarCantidad(item.id, item.cantidad + 1, item.productos.stock)}
                      style={{ width: '32px', height: '32px', backgroundColor: '#e5e7eb', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>

                  <div style={{ textAlign: 'right', width: '96px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '18px' }}>
                      ${(Number(item.productos.precio) * item.cantidad).toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={() => eliminarItem(item.id)}
                    style={{ color: '#ef4444', padding: '0 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#6b7280', marginBottom: '4px' }}>Total:</p>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#2563eb' }}>
                    ${calcularTotal().toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handlePagar}
                  style={{ padding: '12px 24px', backgroundColor: '#16a34a', color: '#ffffff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                >
                  Proceder al Pago
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}