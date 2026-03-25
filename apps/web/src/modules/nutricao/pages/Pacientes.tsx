import { useState } from 'react'
import { Search, Plus, User, Phone, Mail, ChevronRight } from 'lucide-react'
import { usePacientes } from '../hooks/usePacientes'
import ModalPaciente from '../components/ModalPaciente'

export default function Pacientes() {
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [pacienteSelecionado, setPacienteSelecionado] = useState<string | null>(null)

  const { data: pacientes, isLoading } = usePacientes(busca)

  const abrirNovo = () => {
    setPacienteSelecionado(null)
    setModalAberto(true)
  }

  const abrirEditar = (id: string) => {
    setPacienteSelecionado(id)
    setModalAberto(true)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pacientes?.length || 0} paciente{pacientes?.length !== 1 ? 's' : ''} cadastrado{pacientes?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition text-sm font-medium"
        >
          <Plus size={16} />
          Novo paciente
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou CPF..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pacientes?.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Nenhum paciente encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Clique em "Novo paciente" para começar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {pacientes?.map((paciente, index) => (
            <div
              key={paciente.id}
              onClick={() => abrirEditar(paciente.id)}
              className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition ${
                index !== 0 ? 'border-t border-gray-50' : ''
              }`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {paciente.foto_url ? (
                  <img src={paciente.foto_url} alt={paciente.nome} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-green-700 font-medium text-sm">
                    {paciente.nome?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{paciente.nome}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {paciente.email && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Mail size={11} />
                      {paciente.email}
                    </span>
                  )}
                  {paciente.telefone && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Phone size={11} />
                      {paciente.telefone}
                    </span>
                  )}
                </div>
              </div>

              {/* Objetivo */}
              {paciente.objetivo && (
                <span className="hidden md:block text-xs text-gray-400 max-w-48 truncate">
                  {paciente.objetivo}
                </span>
              )}

              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <ModalPaciente
          pacienteId={pacienteSelecionado}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  )
}