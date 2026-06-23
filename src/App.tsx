import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Pending from './pages/Pending'
import Dashboard from './pages/Dashboard'
import Trips from './pages/Trips'
import TripDetail from './pages/TripDetail'
import Passengers from './pages/Passengers'
import Users from './pages/Users'
import VoyageMaster from './pages/VoyageMaster'
import VoyageNew from './pages/VoyageNew'
import Partners from './pages/Partners'

function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
    </div>
  )
}

const DEV_MODE = false

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isPending, loading } = useAuth()
  if (DEV_MODE) return <>{children}</>
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (isPending) return <Navigate to="/pending" replace />
  return <>{children}</>
}

function RoleRoute({ allow, children }: { allow: string[]; children: React.ReactNode }) {
  const { role, loading } = useAuth()
  if (DEV_MODE) return <>{children}</>
  if (loading) return <Spinner />
  if (!allow.includes(role)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Toaster position="top-right" richColors closeButton duration={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/pending" element={<Pending />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/voyages?tab=상품등록" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="trips" element={<Trips />} />
          <Route path="trips/:id" element={<TripDetail />} />
          <Route path="passengers" element={<Passengers />} />
          <Route path="voyages" element={<VoyageMaster />} />
          <Route path="voyages/new" element={<VoyageNew />} />
          <Route path="partners" element={<Partners />} />
          <Route path="users" element={
            <RoleRoute allow={['admin']}><Users /></RoleRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
