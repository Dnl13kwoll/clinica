import { useEffect, useState } from 'react'
import { api } from '../../../shared/lib/api'
export default function Home() {
  const [plano, setPlano] = useState<any>(null)
  useEffect(() => { api.get('/nutricao/meu-plano').then(r => setPlano(r.data)).catch(() => {}) }, [])
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-6 border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900">Meu plano de hoje</h1>
      </div>
      <div className="p-4">
        {plano ? (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="font-medium text-gray-800">{plano.nome}</p>
            <p className="text-sm text-gray-500 mt-1">{plano.caloriasMedia} kcal/dia</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 border border-gray-100 text-center text-gray-400">
            Nenhum plano ativo
          </div>
        )}
      </div>
    </div>
  )
}
