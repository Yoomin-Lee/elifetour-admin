import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Trips from './pages/Trips'
import TripDetail from './pages/TripDetail'
import Passengers from './pages/Passengers'
import Users from './pages/Users'
import VoyageMaster from './pages/VoyageMaster'
import VoyageNew from './pages/VoyageNew'

function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
    </div>
  )
}

const DEV_MODE = false

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (DEV_MODE) return children
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RoleRoute({ allow, children }) {
  const { role, loading } = useAuth()
  if (DEV_MODE) return children
  if (loading) return <Spinner />
  if (!allow.includes(role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="trips" element={<Trips />} />
          <Route path="trips/:id" element={<TripDetail />} />
          <Route path="passengers" element={<Passengers />} />
          <Route path="voyages" element={<VoyageMaster />} />
          <Route path="voyages/new" element={<VoyageNew />} />
          <Route path="users" element={
            <RoleRoute allow={['admin']}><Users /></RoleRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
