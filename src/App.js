import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { client } from './supabase/client'

// Páginas
import Login from './pages/Login'
import Catalogo from './pages/Catalogo'
import Carrito from './pages/Carrito'
import Admin from './pages/Admin'
import Checkout from './pages/Checkout'
import Pago from './pages/Pago'

function ProtectedRoute({ children, requireAdmin = false }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await client.auth.getSession()
      setSession(session)

      if (session && requireAdmin) {
        const { data: perfil } = await client
          .from('perfiles')
          .select('rol')
          .eq('id', session.user.id)
          .single()

        setIsAdmin(perfil?.rol === 'admin')
      }

      setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [requireAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/catalogo" replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página de inicio de sesión */}
        <Route path="/login" element={<Login />} />

        {/* Catálogo: ahora es público */}
        <Route path="/catalogo" element={<Catalogo />} />

        {/* Carrito (protegido) */}
        <Route
          path="/carrito"
          element={
            <ProtectedRoute>
              <Carrito />
            </ProtectedRoute>
          }
        />

        {/* Checkout (protegido) */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        {/* Pago (protegido) */}
        <Route
          path="/pago"
          element={
            <ProtectedRoute>
              <Pago />
            </ProtectedRoute>
          }
        />

        {/* Panel de administración (solo admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Redirecciones por defecto */}
        <Route path="/" element={<Navigate to="/catalogo" replace />} />
        <Route path="*" element={<Navigate to="/catalogo" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
