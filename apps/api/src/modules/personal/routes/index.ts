import { FastifyInstance } from 'fastify'

export async function personalRoutes(app: FastifyInstance) {
  app.get('/alunos', async () => ({ alunos: [] }))
}
