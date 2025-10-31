import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { client } from '../supabase/client'

export default function Pago() {
  const navigate = useNavigate()
  const location = useLocation()
  const supabase = client
  
  const [usuario, setUsuario] = useState(null)
  const [direccion, setDireccion] = useState(null)
  const [carrito, setCarrito] = useState([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)

  const [tipoTarjeta, setTipoTarjeta] = useState('Crédito')
  const [numeroTarjeta, setNumeroTarjeta] = useState('')
  const [nombreTitular, setNombreTitular] = useState('')
  const [fechaExpiracion, setFechaExpiracion] = useState('')
  const [cvv, setCvv] = useState('')

  const cargarDireccion = useCallback(async (direccionId) => {
    const { data, error } = await supabase
      .from('direcciones_envio')
      .select('*')
      .eq('id', direccionId)
      .single()

    if (error) {
      alert('Error cargando dirección: ' + error.message)
      navigate('/checkout')
      return
    }

    setDireccion(data)
  }, [supabase, navigate])

  const cargarCarrito = useCallback(async (userId) => {
    const { data: items, error } = await supabase
      .from('items_carrito')
      .select(`
        id,
        cantidad,
        productos (
          id,
          nombre,
          descripcion,
          precio,
          stock
        )
      `)
      .eq('carrito_id', userId)

    if (error) {
      alert('Error cargando carrito: ' + error.message)
      return
    }

    if (!items || items.length === 0) {
      alert('⚠️ Tu carrito está vacío')
      navigate('/catalogo')
      return
    }

    setCarrito(items)
    setLoading(false)
  }, [supabase, navigate])

  useEffect(() => {
    async function init() {
      if (!location.state?.direccion_id) {
        alert('⚠️ Debes seleccionar una dirección de envío primero')
        navigate('/checkout')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre_completo')
        .eq('id', user.id)
        .single()

      setUsuario({ 
        id: user.id, 
        email: user.email,
        nombre: perfil?.nombre_completo 
      })
      setNombreTitular(perfil?.nombre_completo || '')

      await cargarDireccion(location.state.direccion_id)
      await cargarCarrito(user.id)
    }
    init()
  }, [location.state, navigate, supabase, cargarDireccion, cargarCarrito])

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => {
      return sum + (Number(item.productos.precio) * item.cantidad)
    }, 0)
  }

  const formatearNumeroTarjeta = (value) => {
    const cleaned = value.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ')
  }

  const handleNumeroTarjetaChange = (e) => {
    const value = e.target.value.replace(/\s/g, '')
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setNumeroTarjeta(formatearNumeroTarjeta(value))
    }
  }

  const handleFechaChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4)
    }
    if (value.length <= 5) {
      setFechaExpiracion(value)
    }
  }

  const handleCvvChange = (e) => {
    const value = e.target.value
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setCvv(value)
    }
  }

  const validarFormulario = () => {
    if (!numeroTarjeta || numeroTarjeta.replace(/\s/g, '').length !== 16) {
      alert('❌ Número de tarjeta inválido')
      return false
    }
    if (!nombreTitular.trim()) {
      alert('❌ Ingresa el nombre del titular')
      return false
    }
    if (!fechaExpiracion || fechaExpiracion.length !== 5) {
      alert('❌ Fecha de expiración inválida')
      return false
    }
    
    const [mes] = fechaExpiracion.split('/')
    if (parseInt(mes) < 1 || parseInt(mes) > 12) {
      alert('❌ Mes inválido')
      return false
    }
    
    if (!cvv || cvv.length < 3) {
      alert('❌ CVV inválido')
      return false
    }
    return true
  }

  const procesarPago = async () => {
    if (!validarFormulario()) return

    setProcesando(true)

    try {
      const total = calcularTotal()
      const numeroCompleto = numeroTarjeta.replace(/\s/g, '')
      const ultimos4 = numeroCompleto.slice(-4)

      const { data: pago, error: errorPago } = await supabase
        .from('pagos')
        .insert({
          usuario_id: usuario.id,
          total: total,
          tipo_tarjeta: tipoTarjeta,
          ultimos_4_digitos: ultimos4,
          nombre_titular: nombreTitular.trim(),
          estado: 'completado',
          metodo_procesamiento: 'simulado'
        })
        .select()
        .single()

      if (errorPago) throw errorPago

      const { data: numeroPedidoData } = await supabase
        .rpc('generar_numero_pedido')
      
      const numeroPedido = numeroPedidoData || `ORD${Date.now()}`
      const numeroRastreo = `MX${Date.now().toString().slice(-8)}`

      const { data: pedido, error: errorPedido } = await supabase
        .from('pedidos')
        .insert({
          pago_id: pago.id,
          usuario_id: usuario.id,
          direccion_envio_id: direccion.id,
          estado: 'confirmado',
          numero_pedido: numeroPedido,
          numero_rastreo: numeroRastreo,
          fecha_confirmacion: new Date().toISOString()
        })
        .select()
        .single()

      if (errorPedido) throw errorPedido

      const itemsPedido = carrito.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.productos.id,
        cantidad: item.cantidad,
        precio_unitario: item.productos.precio,
        subtotal: item.productos.precio * item.cantidad,
        nombre_producto: item.productos.nombre,
        descripcion_producto: item.productos.descripcion
      }))

      const { error: errorItems } = await supabase
        .from('items_pedido')
        .insert(itemsPedido)

      if (errorItems) throw errorItems

      for (const item of carrito) {
        const nuevoStock = item.productos.stock - item.cantidad
        await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', item.productos.id)
      }

      await supabase
        .from('items_carrito')
        .delete()
        .eq('carrito_id', usuario.id)

      const mensajeConfirmacion = `
✅ ¡Gracias por tu compra, ${nombreTitular}!

━━━━━━━━━━━━━━━━━━━━━━━━
🎉 COMPRA EXITOSA
━━━━━━━━━━━━━━━━━━━━━━━━

📦 Número de Pedido: ${pedido.numero_pedido}
📍 Número de Rastreo: ${pedido.numero_rastreo}
💳 Total Pagado: $${total.toFixed(2)} MXN
🏦 Método: ${tipoTarjeta} ****${ultimos4}

📮 ENVÍO A:
${direccion.linea_direccion_1}
${direccion.linea_direccion_2 ? direccion.linea_direccion_2 + '\n' : ''}${direccion.ciudad}, ${direccion.estado}
CP: ${direccion.codigo_postal}, ${direccion.pais}

📧 Recibirás un correo de confirmación
🚚 Envío estimado: 3-5 días hábiles

¡Disfruta tu nueva moto! 🏍️
      `.trim()

      alert(mensajeConfirmacion)
      navigate('/catalogo')

    } catch (error) {
      console.error('Error procesando pago:', error)
      alert('❌ Error al procesar el pago: ' + error.message)
    } finally {
      setProcesando(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#ffffff' }}>Cargando información de pago...</p>
        </div>
      </div>
    )
  }

  const total = calcularTotal()

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
            <button 
              onClick={() => navigate('/carrito')}
              style={{ fontSize: '14px', padding: '4px 8px', color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Carrito
            </button>
            <button 
              onClick={() => navigate('/checkout')}
              style={{ fontSize: '14px', padding: '4px 8px', color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Checkout
            </button>
            <button style={{ fontSize: '14px', padding: '4px 8px', fontWeight: '500', color: '#ffffff', background: 'none', border: 'none' }}>
              Pago
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

      <main style={{ maxWidth: '1152px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Columna izquierda - Formulario */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Información de tarjeta */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Información de Pago</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Tipo de Tarjeta
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={tipoTarjeta === 'Crédito'}
                        onChange={() => setTipoTarjeta('Crédito')}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>💳 Crédito</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={tipoTarjeta === 'Débito'}
                        onChange={() => setTipoTarjeta('Débito')}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>🏦 Débito</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Número de Tarjeta *
                  </label>
                  <input
                    type="text"
                    value={numeroTarjeta}
                    onChange={handleNumeroTarjetaChange}
                    placeholder="1234 5678 9012 3456"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    maxLength="19"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Nombre del Titular *
                  </label>
                  <input
                    type="text"
                    value={nombreTitular}
                    onChange={(e) => setNombreTitular(e.target.value.toUpperCase())}
                    placeholder="JUAN PEREZ"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                      Expiración *
                    </label>
                    <input
                      type="text"
                      value={fechaExpiracion}
                      onChange={handleFechaChange}
                      placeholder="MM/AA"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                      CVV *
                    </label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={handleCvvChange}
                      placeholder="123"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#d1fae5', border: '1px solid #86efac', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#065f46' }}>
                <span style={{ fontSize: '18px' }}>🔒</span>
                <div>
                  <div style={{ fontWeight: '500' }}>Pago 100% seguro</div>
                  <div style={{ fontSize: '12px' }}>Solo guardamos los últimos 4 dígitos</div>
                </div>
              </div>
            </div>

            {/* Dirección de envío */}
            {direccion && (
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Enviar a:</h3>
                <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ fontWeight: '500', color: '#111827' }}>{direccion.linea_direccion_1}</p>
                  {direccion.linea_direccion_2 && <p>{direccion.linea_direccion_2}</p>}
                  <p>{direccion.ciudad}, {direccion.estado}</p>
                  <p>CP: {direccion.codigo_postal}, {direccion.pais}</p>
                </div>
                <button
                  onClick={() => navigate('/checkout')}
                  style={{ marginTop: '12px', fontSize: '14px', color: '#2563eb', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ← Cambiar dirección
                </button>
              </div>
            )}
          </div>

          {/* Columna derecha - Resumen */}
          <div>
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', position: 'sticky', top: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Resumen del Pedido</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '240px', overflowY: 'auto' }}>
                {carrito.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6b7280' }}>
                      {item.productos.nombre} <span style={{ fontSize: '12px' }}>×{item.cantidad}</span>
                    </span>
                    <span style={{ fontWeight: '600' }}>
                      ${(Number(item.productos.precio) * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>Subtotal:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>Envío:</span>
                  <span style={{ color: '#16a34a' }}>GRATIS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                  <span>Total:</span>
                  <span style={{ color: '#2563eb' }}>${total.toFixed(2)} MXN</span>
                </div>
              </div>

              <button
                onClick={procesarPago}
                disabled={procesando}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  background: procesando ? 'linear-gradient(to right, #d1d5db, #9ca3af)' : 'linear-gradient(to right, #16a34a, #15803d)', 
                  color: '#ffffff', 
                  borderRadius: '8px', 
                  border: 'none', 
                  fontWeight: '600', 
                  fontSize: '18px', 
                  cursor: procesando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                {procesando ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>⏳</span> Procesando...
                  </span>
                ) : (
                  `💳 Pagar $${total.toFixed(2)}`
                )}
              </button>

              <button
                onClick={() => navigate('/checkout')}
                disabled={procesando}
                style={{ 
                  width: '100%', 
                  marginTop: '12px', 
                  padding: '8px', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  background: '#ffffff',
                  cursor: procesando ? 'not-allowed' : 'pointer',
                  opacity: procesando ? 0.5 : 1
                }}
              >
                ← Volver al Checkout
              </button>

              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '4px', fontSize: '12px', color: '#1e40af' }}>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>ℹ️ Información de seguridad:</div>
                <ul style={{ marginLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'disc' }}>
                  <li>No almacenamos tu número completo de tarjeta</li>
                  <li>El CVV nunca se guarda en nuestros servidores</li>
                  <li>Toda la información está encriptada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}