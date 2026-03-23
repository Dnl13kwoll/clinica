import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
export default function AuthCallback() {
  const navigate = useNavigate()
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (token) { localStorage.setItem('token', token); navigate('/') }
    else navigate('/login')
  }, [])
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
