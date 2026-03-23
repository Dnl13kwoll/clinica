import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../config/database'

const PUBLIC_ROUTES = ['/health', '/api/saas/auth']

export async function tenantMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const isPublic = PUBLIC_ROUTES.some(r => request.url.startsWith(r))
  if (isPublic) return
  const host = request.headers.host || ''
  const subdominio = host.split('.')[0].replace('www', '')
  if (!subdominio) return reply.status(400).send({ error: 'Clínica não identificada' })
  const result = await prisma.$queryRaw<any[]>`
    SELECT schema_name FROM public.clinicas
    WHERE subdominio = ${subdominio} AND status = 'ativa' LIMIT 1
  `
  if (!result.length) return reply.status(404).send({ error: 'Clínica não encontrada' })
  ;(request as any).schema = result[0].schema_name
  ;(request as any).subdominio = subdominio
}
