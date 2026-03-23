import { FastifyInstance } from 'fastify'
import {
  listarPacientes, buscarPaciente,
  criarPaciente, atualizarPaciente, inativarPaciente
} from '../controllers/pacientes.controller'

export async function nutricaoRoutes(app: FastifyInstance) {
  app.get('/pacientes',        listarPacientes)
  app.get('/pacientes/:id',    buscarPaciente)
  app.post('/pacientes',       criarPaciente)
  app.put('/pacientes/:id',    atualizarPaciente)
  app.delete('/pacientes/:id', inativarPaciente)
}
