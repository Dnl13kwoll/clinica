import { useAuth } from '../hooks/useAuth'
import { useModulos } from '../hooks/useModulos'
export default function Dashboard() {
  const { usuario } = useAuth()
  const { temNutricao, temPersonal } = useModulos()
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Ola, {usuario?.nome?.split(' ')[0]}!</h1>
      <p className="text-gray-500 mb-8">Bem-vindo ao SalusMetrics</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {temNutricao && (
          <a href="/pacientes" className="bg-white p-6 rounded-xl border border-gray-100 hover:border-green-200 transition">
            <div className="text-2xl font-bold text-green-600 mb-1">Pacientes</div>
          </a>
        )}
        {temPersonal && (
          <a href="/alunos" className="bg-white p-6 rounded-xl border border-gray-100 hover:border-purple-200 transition">
            <div className="text-2xl font-bold text-purple-600 mb-1">Alunos</div>
          </a>
        )}
      </div>
    </div>
  )
}
