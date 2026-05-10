import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthProvider'
import { MembersProvider } from './lib/useMembers'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Assistencia from './pages/Assistencia'
import Membros from './pages/Membros'
import Eventos from './pages/Eventos'

function ProtectedRoute({ children }) {
  const session = useAuth()
  if (session === undefined) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text2)', fontSize:13 }}>
      Carregando…
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return <MembersProvider>{children}</MembersProvider>
}

function PublicRoute({ children }) {
  const session = useAuth()
  if (session === undefined) return null
  if (session) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="assistencia" element={<Assistencia />} />
            <Route path="membros"     element={<Membros />} />
            <Route path="eventos"     element={<Eventos />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
