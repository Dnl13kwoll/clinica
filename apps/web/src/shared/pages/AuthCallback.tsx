import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
export default function AuthCallback() {
  const navigate = useNavigate()
  const { login } = useAuth()
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) { navigate('/login'); return }
    login(token, null)
    api.get('/saas/auth/me').then(({ data }) => { login(token, data); navigate('/') }).catch(() => navigate('/login'))
  }, [])
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Entrando...</p>
      </div>
    </div>
  )
}
