import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../../config/database'
import { z } from 'zod'

const pacienteSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
  sexo: z.enum(['M', 'F', 'outro']).optional(),
  objetivo: z.string().optional(),
  alergias: z.array(z.string()).optional(),
  patologias: z.array(z.string()).optional(),
})

export async function listarPacientes(request: FastifyRequest, reply: FastifyReply) {
  const schema = (request as any).user.schema
  const { busca } = request.query as any
  let q = `SELECT p.*, u.nome, u.email, u.foto_url FROM "${schema}".pacientes p
    LEFT JOIN "${schema}".usuarios u ON u.id = p.usuario_id WHERE p.ativo = true`
  const params: any[] = []
  if (busca) { params.push(`%${busca}%`); q += ` AND u.nome ILIKE $1` }
  q += ' ORDER BY u.nome ASC'
  const pacientes = await prisma.$queryRawUnsafe<any[]>(q, ...params)
  reply.send({ pacientes })
}

export async function buscarPaciente(request: FastifyRequest, reply: FastifyReply) {
  const schema = (request as any).user.schema
  const { id } = request.params as { id: string }
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT p.*, u.nome, u.email, u.foto_url FROM "${schema}".pacientes p
     LEFT JOIN "${schema}".usuarios u ON u.id = p.usuario_id WHERE p.id = $1 LIMIT 1`, id
  )
  if (!rows.length) return reply.status(404).send({ error: 'Não encontrado' })
  reply.send(rows[0])
}

export async function criarPaciente(request: FastifyRequest, reply: FastifyReply) {
  const schema = (request as any).user.schema
  const nutricionistaId = (request as any).user.id
  const body = pacienteSchema.parse(request.body)

  let userRows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id FROM "${schema}".usuarios WHERE email = $1 LIMIT 1`, body.email
  )
  let userId: string
  if (!userRows.length) {
    const r = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "${schema}".usuarios (google_id, nome, email, perfil)
       VALUES ($1, $2, $3, 'paciente') RETURNING id`,
      `manual_${Date.now()}`, body.nome, body.email
    )
    userId = r[0].id
  } else {
    userId = userRows[0].id
  }

  const paciente = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO "${schema}".pacientes
     (usuario_id, nutricionista_id, cpf, data_nascimento, sexo, telefone, objetivo, alergias, patologias)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    userId, nutricionistaId, body.cpf||null, body.dataNascimento||null,
    body.sexo||null, body.telefone||null, body.objetivo||null,
    body.alergias||[], body.patologias||[]
  )
  reply.status(201).send(paciente[0])
}

export async function atualizarPaciente(request: FastifyRequest, reply: FastifyReply) {
  const schema = (request as any).user.schema
  const { id } = request.params as { id: string }
  const body = request.body as any
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `UPDATE "${schema}".pacientes SET
       cpf=COALESCE($1,cpf), data_nascimento=COALESCE($2,data_nascimento),
       sexo=COALESCE($3,sexo), telefone=COALESCE($4,telefone),
       objetivo=COALESCE($5,objetivo)
     WHERE id=$6 RETURNING *`,
    body.cpf, body.dataNascimento, body.sexo, body.telefone, body.objetivo, id
  )
  reply.send(rows[0])
}

export async function inativarPaciente(request: FastifyRequest, reply: FastifyReply) {
  const schema = (request as any).user.schema
  const { id } = request.params as { id: string }
  await prisma.$queryRawUnsafe(`UPDATE "${schema}".pacientes SET ativo=false WHERE id=$1`, id)
  reply.send({ ok: true })
}
