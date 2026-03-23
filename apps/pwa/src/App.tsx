import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const Login     = lazy(() => import('./shared/components/Login'))
const Callback  = lazy(() => import('./shared/pages/AuthCallback'))
const Home      = lazy(() => import('./modules/nutricao/pages/Home'))
const Plano     = lazy(() => import('./modules/nutricao/pages/Plano'))
const Evolucao  = lazy(() => import('./modules/nutricao/pages/Evolucao'))
const Consultas = lazy(() => import('./modules/nutricao/pages/Consultas'))

const Spin = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Spin />}>
      <Routes>
        <Route path="/login"         element={<Login />} />
        <Route path="/auth/callback" element={<Callback />} />
        <Route path="/"              element={<Home />} />
        <Route path="/plano"         element={<Plano />} />
        <Route path="/evolucao"      element={<Evolucao />} />
        <Route path="/consultas"     element={<Consultas />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
