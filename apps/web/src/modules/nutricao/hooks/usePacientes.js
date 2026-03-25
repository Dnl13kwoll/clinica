import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../shared/lib/api'

export interface Paciente {
  id: string
  nome: string
  email: string
  cpf?: string
  telefone?: string
  data_nascimento?: string
  sexo?: 'M' | 'F' | 'outro'
  objetivo?: string
  alergias?: string[]
  patologias?: string[]
  foto_url?: string
  ativo: boolean
}

// Buscar todos os pacientes
export function usePacientes(busca?: string) {
  return useQuery({
    queryKey: ['pacientes', busca],
    queryFn: async () => {
      const { data } = await api.get('/nutricao/pacientes', {
        params: { busca }
      })
      return data.pacientes as Paciente[]
    }
  })
}

// Buscar um paciente
export function usePaciente(id: string) {
  return useQuery({
    queryKey: ['paciente', id],
    queryFn: async () => {
      const { data } = await api.get(`/nutricao/pacientes/${id}`)
      return data as Paciente
    },
    enabled: !!id
  })
}

// Criar paciente
export function useCriarPaciente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: Partial<Paciente>) => {
      const { data } = await api.post('/nutricao/pacientes', dados)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] })
    }
  })
}

// Atualizar paciente
export function useAtualizarPaciente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: Partial<Paciente> & { id: string }) => {
      const { data } = await api.put(`/nutricao/pacientes/${id}`, dados)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] })
    }
  })
}

// Inativar paciente
export function useInativarPaciente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/nutricao/pacientes/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] })
    }
  })
}