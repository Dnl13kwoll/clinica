import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './shared/hooks/useAuth'
import { useModulos } from './shared/hooks/useModulos'

const Login        = lazy(() => import('./shared/components/Login'))
const AuthCallback = lazy(() => import('./shared/pages/AuthCallback'))
const Dashboard    = lazy(() => import('./shared/components/Dashboard'))
const Pacientes    = lazy(() => import('./modules/nutricao/pages/Pacientes'))
const PlanoAlimentar = lazy(() => import('./modules/nutricao/pages/PlanoAlimentar'))
const Agenda       = lazy(() => import('./modules/nutricao/pages/Agenda'))
const Alunos       = lazy(() => import('./modules/personal/pages/Alunos'))
const Treinos      = lazy(() => import('./modules/personal/pages/Treinos'))

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { autenticado } = useAuth()
  return autenticado ? <>{children}</> : <Navigate to="/login" replace />
}

function Layout({ children }: { children: React.ReactNode }) {
  const { usuario, logout } = useAuth()
  const { temNutricao, temPersonal } = useModulos()
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-100 p-4 flex flex-col gap-1">
        <div className="text-lg font-semibold text-gray-900 px-3 py-2 mb-4">SalusMetrics</div>
        <a href="/" className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Dashboard</a>
        {temNutricao && <>
          <a href="/pacientes"    className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Pacientes</a>
          <a href="/planos"       className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Planos alimentares</a>
          <a href="/agenda-nutri" className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Agenda</a>
        </>}
        {temPersonal && <>
          <a href="/alunos"   className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Alunos</a>
          <a href="/treinos"  className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Treinos</a>
        </>}
        <div className="mt-auto text-xs text-gray-400 px-3 py-2">{usuario?.nome}</div>
        <button onClick={logout} className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-50 text-left">Sair</button>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}

const Spin = () => <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>

export default function App() {
  const { temNutricao, temPersonal } = useModulos()
  return (
    <Suspense fallback={<Spin />}>
      <Routes>
        <Route path="/login"         element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        {temNutricao && <>
          <Route path="/pacientes"    element={<PrivateRoute><Layout><Pacientes /></Layout></PrivateRoute>} />
          <Route path="/planos"       element={<PrivateRoute><Layout><PlanoAlimentar /></Layout></PrivateRoute>} />
          <Route path="/agenda-nutri" element={<PrivateRoute><Layout><Agenda /></Layout></PrivateRoute>} />
        </>}
        {temPersonal && <>
          <Route path="/alunos"   element={<PrivateRoute><Layout><Alunos /></Layout></PrivateRoute>} />
          <Route path="/treinos"  element={<PrivateRoute><Layout><Treinos /></Layout></PrivateRoute>} />
        </>}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
