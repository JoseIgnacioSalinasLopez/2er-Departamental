import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '../supabase/client'

export default function Checkout() {
  const navigate = useNavigate()
  const supabase = client
  const [usuario, setUsuario] = useState(null)
  const [direcciones, setDirecciones] = useState([])
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)

  const [formDireccion, setFormDireccion] = useState({
    linea_direccion_1: '',
    linea_direccion_2: '',
    ciudad: '',
    estado: '',
    codigo_postal: '',
    pais: 'México',
    es_predeterminada: false
  })

  const cargarDirecciones = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('direcciones_envio')
        .select('*')
        .eq('usuario_id', userId)
        .order('es_predeterminada', { ascending: false })

      if (error) throw error
      setDirecciones(data || [])
      
      const predeterminada = data?.find(d => d.es_predeterminada)
      if (predeterminada) {
        setDireccionSeleccionada(predeterminada.id)
      }
    } catch (err) {
      console.error('Error cargando direcciones:', err)
    }
  }, [supabase])

  const cargarCarrito = useCallback(async (userId) => {
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
            stock
          )
        `)
        .eq('carrito_id', userId)

      if (error) throw error
      setItems(data || [])
      
      const totalCalculado = data?.reduce((sum, item) => {
        return sum + (Number(item.productos.precio) * item.cantidad)
      }, 0) || 0
      
      setTotal(totalCalculado)
    } catch (err) {
      alert('Error cargando carrito: ' + err.message)
    }
  }, [supabase])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUsuario(user)
        await cargarDirecciones(user.id)
        await cargarCarrito(user.id)
      }
    }
    init()
  }, [cargarDirecciones, cargarCarrito, supabase])

  const guardarDireccion = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (formDireccion.es_predeterminada) {
        await supabase
          .from('direcciones_envio')
          .update({ es_predeterminada: false })
          .eq('usuario_id', usuario.id)
      }

      const { data, error } = await supabase
        .from('direcciones_envio')
        .insert({
          ...formDireccion,
          usuario_id: usuario.id
        })
        .select()
        .single()

      if (error) throw error

      // Sin emoji
      alert('Dirección guardada correctamente')
      setDireccionSeleccionada(data.id)
      setMostrarFormulario(false)
      await cargarDirecciones(usuario.id)
      
      setFormDireccion({
        linea_direccion_1: '',
        linea_direccion_2: '',
        ciudad: '',
        estado: '',
        codigo_postal: '',
        pais: 'México',
        es_predeterminada: false
      })
    } catch (err) {
      alert('Error guardando dirección: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const continuarAPago = () => {
    if (!direccionSeleccionada) {
      // Sin emoji
      alert('Por favor selecciona o agrega una dirección de envío')
      return
    }

    if (items.length === 0) {
      // Sin emoji
      alert('Tu carrito está vacío')
      return
    }

    navigate('/pago', { 
      state: { 
        direccion_id: direccionSeleccionada,
        total: total
      } 
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
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
        boxSizing: 'border-box' // Importante para layout global
      }}
    >
      <header style={{ 
        maxWidth: '1152px', 
        margin: '0 auto', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '24px',
        flexWrap: 'wrap', // Permite que baje el contenido en móvil
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: 0 }}>MotoStore</h1>
          <nav style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/catalogo')}
              style={{ fontSize: '14px', padding: '8px 12px', color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Catálogo
            </button>
            <button 
              onClick={() => navigate('/carrito')}
              style={{ fontSize: '14px', padding: '8px 12px', color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Carrito
            </button>
            <button style={{ fontSize: '14px', padding: '8px 12px', fontWeight: '500', color: '#ffffff', background: 'none', border: 'none' }}>
              Checkout
            </button>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '14px', color: '#ffffff' }}>{usuario?.email}</div>
          <button 
            onClick={handleLogout}
            style={{ fontSize: '14px', padding: '8px 16px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1152px', margin: '0 auto' }}>
        {/* GRID RESPONSIVO: Se adapta a 1 o 2 columnas según el ancho */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '24px' 
        }}>
          
          {/* Columna Izquierda - Dirección de envío */}
          <div>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '24px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Dirección de Envío</h2>
                <button
                  onClick={() => setMostrarFormulario(!mostrarFormulario)}
                  style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                >
                  {mostrarFormulario ? 'Cancelar' : '+ Nueva Dirección'}
                </button>
              </div>

              {/* Formulario para nueva dirección */}
              {mostrarFormulario && (
                <form onSubmit={guardarDireccion} style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb', boxSizing: 'border-box' }}>
                  <h3 style={{ fontWeight: '600', marginBottom: '16px', marginTop: 0 }}>Agregar Nueva Dirección</h3>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <input
                      type="text"
                      placeholder="Calle y número *"
                      value={formDireccion.linea_direccion_1}
                      onChange={(e) => setFormDireccion({...formDireccion, linea_direccion_1: e.target.value})}
                      style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Colonia, Referencias (opcional)"
                      value={formDireccion.linea_direccion_2}
                      onChange={(e) => setFormDireccion({...formDireccion, linea_direccion_2: e.target.value})}
                      style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <input
                        type="text"
                        placeholder="Ciudad *"
                        value={formDireccion.ciudad}
                        onChange={(e) => setFormDireccion({...formDireccion, ciudad: e.target.value})}
                        style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Estado *"
                        value={formDireccion.estado}
                        onChange={(e) => setFormDireccion({...formDireccion, estado: e.target.value})}
                        style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <input
                        type="text"
                        placeholder="Código Postal *"
                        value={formDireccion.codigo_postal}
                        onChange={(e) => setFormDireccion({...formDireccion, codigo_postal: e.target.value})}
                        style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}
                        required
                      />
                      <input
                        type="text"
                        placeholder="País *"
                        value={formDireccion.pais}
                        onChange={(e) => setFormDireccion({...formDireccion, pais: e.target.value})}
                        style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={formDireccion.es_predeterminada}
                        onChange={(e) => setFormDireccion({...formDireccion, es_predeterminada: e.target.checked})}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <span style={{ fontSize: '14px' }}>Establecer como dirección predeterminada</span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{ 
                        padding: '12px 16px', 
                        backgroundColor: loading ? '#9ca3af' : '#16a34a', 
                        color: '#ffffff', 
                        borderRadius: '4px', 
                        border: 'none', 
                        cursor: loading ? 'not-allowed' : 'pointer',
                        flex: 1
                      }}
                    >
                      {loading ? 'Guardando...' : 'Guardar Dirección'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrarFormulario(false)}
                      style={{ padding: '12px 16px', backgroundColor: '#d1d5db', borderRadius: '4px', border: 'none', cursor: 'pointer', flex: 1 }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de direcciones guardadas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {direcciones.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '16px 0' }}>
                    No tienes direcciones guardadas. Agrega una nueva.
                  </p>
                ) : (
                  direcciones.map((dir) => (
                    <label
                      key={dir.id}
                      style={{ 
                        display: 'block', 
                        padding: '16px', 
                        border: direccionSeleccionada === dir.id ? '2px solid #2563eb' : '1px solid #d1d5db', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        backgroundColor: direccionSeleccionada === dir.id ? '#eff6ff' : '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                        <input
                          type="radio"
                          name="direccion"
                          checked={direccionSeleccionada === dir.id}
                          onChange={() => setDireccionSeleccionada(dir.id)}
                          style={{ marginTop: '4px', width: '18px', height: '18px' }}
                        />
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <p style={{ fontWeight: '600', margin: 0 }}>{dir.linea_direccion_1}</p>
                            {dir.es_predeterminada && (
                              <span style={{ fontSize: '12px', backgroundColor: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '4px' }}>
                                Predeterminada
                              </span>
                            )}
                          </div>
                          {dir.linea_direccion_2 && (
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>{dir.linea_direccion_2}</p>
                          )}
                          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                            {dir.ciudad}, {dir.estado} {dir.codigo_postal}
                          </p>
                          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>{dir.pais}</p>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha - Resumen del pedido */}
          <div>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '24px', position: 'sticky', top: '16px', boxSizing: 'border-box' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', marginTop: 0 }}>Resumen del Pedido</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6b7280' }}>
                      {item.productos.nombre} x{item.cantidad}
                    </span>
                    <span style={{ fontWeight: '600' }}>
                      ${(Number(item.productos.precio) * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                  <span>Total:</span>
                  <span style={{ color: '#2563eb' }}>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={continuarAPago}
                disabled={!direccionSeleccionada || items.length === 0}
                style={{ 
                  width: '100%', 
                  padding: '14px 24px', 
                  backgroundColor: (!direccionSeleccionada || items.length === 0) ? '#d1d5db' : '#16a34a', 
                  color: '#ffffff', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: (!direccionSeleccionada || items.length === 0) ? 'not-allowed' : 'pointer', 
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                Continuar al Pago
              </button>

              <button
                onClick={() => navigate('/carrito')}
                style={{ width: '100%', marginTop: '12px', padding: '14px 24px', backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '16px' }}
              >
                Volver al Carrito
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
