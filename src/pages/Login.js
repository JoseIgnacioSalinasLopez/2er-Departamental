import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '../supabase/client'


export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await client.auth.getSession()
      if (data.session) navigate('/catalogo')
    }
    checkSession()
  }, [navigate])

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!nombreCompleto.trim()) {
      setError('El nombre completo es obligatorio')
      setLoading(false)
      return
    }

    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/catalogo`,
        data: {
          nombre_completo: nombreCompleto.trim()
        }
      },
    })
    
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      alert('✅ Revisa tu correo para confirmar el registro')
      setEmail('')
      setPassword('')
      setNombreCompleto('')
      setIsRegistering(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await client.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/catalogo')
  }

  return (
    <div
  style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: 'url("/assets/fondo1.gif")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    padding: '16px'
  }}
>
      
      {/* CAJA BLANCA CENTRAL */}
      <div style={{
        backgroundColor: '#ffffffff',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px'
      }}>
        
        {/* TÍTULO */}
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '24px',
          textAlign: 'center',
          color: '#1f2937'
        }}>
          {isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}
        </h2>

        {/* MENSAJE DE ERROR */}
        {error && (
          <p style={{
            color: '#ef4444',
            fontSize: '14px',
            marginBottom: '16px',
            textAlign: 'center',
            padding: '8px',
            backgroundColor: '#fee2e2',
            borderRadius: '4px'
          }}>
            {error}
          </p>
        )}

        {/* FORMULARIO */}
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* CAMPO: NOMBRE COMPLETO (solo si está registrándose) */}
          {isRegistering && (
            <input
              type="text"
              placeholder="Nombre completo"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              required
            />
          )}
          
          {/* CAMPO: EMAIL */}
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px'
            }}
            required
          />
          
          {/* CAMPO: CONTRASEÑA */}
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px'
            }}
            required
          />

          {/* BOTONES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            
            {/* SI ESTÁ EN MODO LOGIN */}
            {!isRegistering ? (
              <>
                {/* BOTÓN: INICIAR SESIÓN */}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? '#9ca3af' : '#2563eb',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Cargando...' : 'Iniciar sesión'}
                </button>

                {/* LINK: IR A REGISTRO */}
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  style={{
                    color: '#2563eb',
                    fontSize: '14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  ¿No tienes cuenta? Regístrate
                </button>
                {/* BOTÓN: INGRESAR SIN CUENTA */}
<button
  type="button"
  onClick={() => {
    localStorage.setItem('modoInvitado', 'true')
    navigate('/catalogo')
  }}
  style={{
    backgroundColor: '#10b981',
    color: '#ffffff',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  }}
>
  Ingresar sin cuenta
</button>
              </>
            ) : (
              <>
                {/* BOTÓN: REGISTRARSE */}
                <button
                  onClick={handleSignUp}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? '#9ca3af' : '#16a34a',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Cargando...' : 'Registrarse'}
                </button>

                {/* LINK: IR A LOGIN */}
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  ¿Ya tienes cuenta? Inicia sesión
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )}
