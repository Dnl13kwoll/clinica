export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 px-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Bem-vindo</h1>
        <p className="text-gray-500 text-sm mb-8">Acesse seu plano alimentar</p>
        <a href="/api/saas/auth/google"
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-50 transition font-medium text-sm">
          Entrar com Google
        </a>
      </div>
    </div>
  )
}
