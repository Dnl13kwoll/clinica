export interface Paciente {
  id: string; nome: string; email: string; cpf?: string
  dataNascimento?: string; sexo?: 'M'|'F'|'outro'; telefone?: string
  objetivo?: string; alergias?: string[]; patologias?: string[]; ativo: boolean
}
export interface PlanoAlimentar {
  id: string; pacienteId: string; nome: string; objetivo?: string
  caloriasMedia?: number; proteinaMeta?: number; carboidratoMeta?: number; gorduraMeta?: number
  ativo: boolean; refeicoes?: Refeicao[]
}
export interface Refeicao {
  id: string; planoId: string; nome: string; horario?: string; ordem: number
}
export interface Consulta {
  id: string; pacienteId: string; inicioEm: string; fimEm: string
  tipo: 'presencial'|'online'; status: string; linkOnline?: string
}
export interface Aluno {
  id: string; nome: string; email: string; cpf?: string; objetivo?: string; ativo: boolean
}
export interface FichaTreino {
  id: string; alunoId: string; nome: string; objetivo?: string; ativo: boolean
}
export type ModuloSistema = 'nutricao'|'personal'|'fisioterapia'|'psicologia'
