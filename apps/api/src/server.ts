import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { nutricaoRoutes } from './modules/nutricao/routes/index'
import { personalRoutes } from './modules/personal/routes/index'
import { saasRoutes } from './modules/saas/routes/index'
import { tenantMiddleware } from './shared/middleware/tenant'
import { authMiddleware } from './shared/middleware/auth'

const app = Fastify({ logger: true })

app.register(cors, {
  origin: [process.env.WEB_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
})

app.register(jwt, { secret: process.env.JWT_SECRET! })

app.decorate('authenticate', authMiddleware)

app.get('/health', async () => ({ status: 'ok', ts: new Date() }))

app.addHook('onRequest', tenantMiddleware)

app.register(saasRoutes, { prefix: '/api/saas' })

app.register(async (instance) => {
  instance.addHook('onRequest', authMiddleware)
  instance.register(nutricaoRoutes, { prefix: '/api/nutricao' })
  instance.register(personalRoutes, { prefix: '/api/personal' })
})

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.API_PORT) || 3000,
      host: '0.0.0.0',
    })
    console.log('API rodando na porta 3000')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
