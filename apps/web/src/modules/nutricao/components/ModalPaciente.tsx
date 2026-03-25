import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { usePaciente, useCriarPaciente, useAtualizarPaciente, useInativarPaciente } from '../hooks/usePacientes'

const schema = z.object({
  nome:            z.string().min(2, 'Nome obrigatório'),
  email:           z.string().email('Email inválido'),
  cpf:             z.string().optional(),
  telefone:        z.string().optional(),
  dataNascimento:  z.string().optional(),
  sexo:            z.enum(['M', 'F', 'outro']).optional(),
  objetivo:        z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  pacienteId: string | null
  onFechar: () => void
}

export default function ModalPaciente({ pacienteId, onFechar }: Props) {
  const isEdicao = !!pacienteId

  const { data: paciente } = usePaciente(pacienteId || '')
  const criar = useCriarPaciente()
  const atualizar = useAtualizarPaciente()
  const inativar = useInativarPaciente()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  // Preencher formulário ao editar
  useEffect(() => {
    if (paciente) {
      reset({
        nome:           paciente.nome,
        email:          paciente.email,
        cpf:            paciente.cpf || '',
        telefone:       paciente.telefone || '',
        dataNascimento: paciente.data_nascimento?.split('T')[0] || '',
        sexo:           paciente.sexo,
        objetivo:       paciente.objetivo || '',
      })
    }
  }, [paciente])

  const onSubmit = async (dados: FormData) => {
    try {
      if (isEdicao) {
        await atualizar.mutateAsync({ id: pacienteId!, ...dados })
      } else {
        await criar.mutateAsync(dados)
      }
      onFechar()
    } catch (err) {
      console.error(err)
    }
  }

  const handleInativar = async () => {
    if (!pacienteId) return
    if (!confirm('Tem certeza que deseja inativar este paciente?')) return
    await inativar.mutateAsync(pacienteId)
    onFechar()
  }

  const isLoading = criar.isPending || atualizar.isPending

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdicao ? 'Editar paciente' : 'Novo paciente'}
          </h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

          {/* Nome */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nome completo *</label>
            <input
              {...register('nome')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
              placeholder="Ex: Maria Silva"
            />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
            <input
              {...register('email')}
              type="email"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
              placeholder="maria@email.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* CPF + Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">CPF</label>
              <input
                {...register('cpf')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Telefone</label>
              <input
                {...register('telefone')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {/* Data nascimento + Sexo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Data de nascimento</label>
              <input
                {...register('dataNascimento')}
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Sexo</label>
              <select
                {...register('sexo')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 bg-white"
              >
                <option value="">Selecionar</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Objetivo */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Objetivo</label>
            <textarea
              {...register('objetivo')}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 resize-none"
              placeholder="Ex: Perda de peso, ganho de massa muscular..."
            />
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3 pt-2">
            {isEdicao && (
              <button
                type="button"
                onClick={handleInativar}
                className="text-red-500 text-sm hover:text-red-600 transition"
              >
                Inativar
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {isEdicao ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}