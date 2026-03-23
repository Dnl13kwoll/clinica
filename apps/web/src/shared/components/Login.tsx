export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-sm w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">SalusMetrics</h1>
        <p className="text-gray-500 mb-8">Plataforma de gestão para profissionais de saúde</p>
        <a href="/api/saas/auth/google"
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-50 transition font-medium">
          Entrar com Google
        </a>
      </div>
    </div>
  )
}
