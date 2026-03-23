import { FastifyInstance } from 'fastify'
import { googleLogin, googleCallback, getMe } from '../controllers/auth.controller'

export async function saasRoutes(app: FastifyInstance) {
  app.get('/auth/google', googleLogin)
  app.get('/auth/google/callback', googleCallback)
  app.get('/auth/me', { preHandler: [(app as any).authenticate] }, getMe)
}
