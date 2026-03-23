import { useAuth } from './useAuth'
export function useModulos() {
  const { usuario } = useAuth()
  const modulos: string[] = usuario?.modulos || []
  return { temNutricao: modulos.includes('nutricao'), temPersonal: modulos.includes('personal') }
}
