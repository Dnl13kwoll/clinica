import { FastifyRequest, FastifyReply } from 'fastify'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '../../../config/database'

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
)

export async function googleLogin(_req: FastifyRequest, reply: FastifyReply) {
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar',
    ],
    prompt: 'consent',
  })
  reply.redirect(url)
}

export async function googleCallback(request: FastifyRequest, reply: FastifyReply) {
  const { code } = request.query as { code: string }
  try {
    const { tokens } = await googleClient.getToken(code)
    googleClient.setCredentials(tokens)
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()!
    const { sub: googleId, email, name, picture } = payload
    const schema = (request as any).schema || 'clinica_demo'

    let rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${schema}".usuarios WHERE email = $1 LIMIT 1`, email
    )
    if (!rows.length) {
      rows = await prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO "${schema}".usuarios (google_id, nome, email, foto_url, perfil)
         VALUES ($1, $2, $3, $4, 'paciente') RETURNING *`,
        googleId, name, email, picture
      )
    }
    const user = rows[0]

    if (tokens.refresh_token && user.perfil === 'nutricionista') {
      await prisma.$queryRawUnsafe(
        `UPDATE "${schema}".nutricionistas SET google_calendar_token = $1 WHERE usuario_id = $2`,
        tokens.refresh_token, user.id
      )
    }

    const clinicaRows = await prisma.$queryRaw<any[]>`
      SELECT modulos FROM public.clinicas WHERE schema_name = ${schema} LIMIT 1
    `
    const modulos = clinicaRows[0]?.modulos || []

    const token = await reply.jwtSign(
      { id: user.id, email: user.email, nome: user.nome, perfil: user.perfil, modulos, schema },
      { expiresIn: '30d' }
    )
    const frontendUrl = process.env.WEB_URL || 'http://localhost:5173'
    reply.redirect(`${frontendUrl}/auth/callback?token=${token}`)
  } catch (err) {
    console.error('Erro OAuth:', err)
    reply.status(500).send({ error: 'Erro ao fazer login' })
  }
}

export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user
  reply.send({ id: user.id, nome: user.nome, email: user.email, perfil: user.perfil, modulos: user.modulos })
}
