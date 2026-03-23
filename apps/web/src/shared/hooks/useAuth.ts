import { create } from 'zustand'
interface Usuario { id: string; nome: string; email: string; perfil: string; modulos: string[] }
interface AuthState {
  autenticado: boolean; usuario: Usuario | null; token: string | null
  login: (token: string, usuario: Usuario | null) => void; logout: () => void
}
export const useAuth = create<AuthState>((set) => ({
  autenticado: !!localStorage.getItem('token'),
  usuario: null, token: localStorage.getItem('token'),
  login: (token, usuario) => { localStorage.setItem('token', token); set({ autenticado: true, token, usuario }) },
  logout: () => { localStorage.removeItem('token'); set({ autenticado: false, token: null, usuario: null }) },
}))
