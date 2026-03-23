CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
cat > ~/nutriapp/scripts/banco.sql << 'EOF'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS public.planos_saas (
  id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome               VARCHAR(100) NOT NULL,
  preco_mensal       NUMERIC(10,2) NOT NULL,
  preco_anual        NUMERIC(10,2) NOT NULL,
  desconto_anual_pct NUMERIC(5,2)  DEFAULT 16.67,
  modulos            TEXT[]        DEFAULT '{}',
  max_nutricionistas INT           DEFAULT 1,
  max_pacientes      INT           DEFAULT 100,
  ativo              BOOLEAN       DEFAULT true,
  criado_em          TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clinicas (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        VARCHAR(200) NOT NULL,
  subdominio  VARCHAR(100) UNIQUE NOT NULL,
  schema_name VARCHAR(50)  UNIQUE NOT NULL,
  cnpj        VARCHAR(18),
  email_admin VARCHAR(200) NOT NULL,
  telefone    VARCHAR(20),
  status      VARCHAR(20)  DEFAULT 'ativa' CHECK (status IN ('ativa','suspensa','cancelada')),
  plano_id    UUID         REFERENCES public.planos_saas(id),
  criada_em   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assinaturas (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id     UUID         NOT NULL REFERENCES public.clinicas(id),
  plano_id       UUID         NOT NULL REFERENCES public.planos_saas(id),
  modulos        TEXT[]       DEFAULT '{}',
  periodicidade  VARCHAR(10)  NOT NULL CHECK (periodicidade IN ('mensal','anual')),
  valor_cheio    NUMERIC(10,2) NOT NULL,
  desconto_combo NUMERIC(10,2) DEFAULT 0,
  valor_cobrado  NUMERIC(10,2) NOT NULL,
  inicio_em      DATE         NOT NULL DEFAULT CURRENT_DATE,
  vence_em       DATE         NOT NULL,
  status         VARCHAR(20)  DEFAULT 'ativa' CHECK (status IN ('ativa','vencida','cancelada')),
  gateway_sub_id VARCHAR(100),
  criado_em      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.faturas (
  id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  assinatura_id      UUID         NOT NULL REFERENCES public.assinaturas(id),
  clinica_id         UUID         NOT NULL REFERENCES public.clinicas(id),
  valor              NUMERIC(10,2) NOT NULL,
  vencimento         DATE         NOT NULL,
  pago_em            TIMESTAMPTZ,
  metodo             VARCHAR(20)  CHECK (metodo IN ('pix','cartao','boleto')),
  status             VARCHAR(20)  DEFAULT 'pendente' CHECK (status IN ('pendente','paga','vencida','estornada')),
  gateway_payment_id VARCHAR(100),
  criado_em          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id           BIGSERIAL    PRIMARY KEY,
  clinica_id   UUID         REFERENCES public.clinicas(id),
  usuario_id   UUID,
  acao         VARCHAR(100) NOT NULL,
  tabela       VARCHAR(100),
  registro_id  UUID,
  dados_antes  JSONB,
  dados_depois JSONB,
  ip           INET,
  criado_em    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinicas_subdominio ON public.clinicas(subdominio);
CREATE INDEX IF NOT EXISTS idx_assinaturas_clinica ON public.assinaturas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_faturas_clinica     ON public.faturas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_faturas_status      ON public.faturas(status);
CREATE INDEX IF NOT EXISTS idx_audit_clinica       ON public.audit_log(clinica_id);

INSERT INTO public.planos_saas (nome, preco_mensal, preco_anual, modulos, max_nutricionistas, max_pacientes) VALUES
  ('Nutri Starter',    197.00, 1970.00, ARRAY['nutricao'],            1, 100),
  ('Nutri Pro',        397.00, 3970.00, ARRAY['nutricao'],            3, 500),
  ('Personal Starter', 147.00, 1470.00, ARRAY['personal'],            1,  50),
  ('Personal Pro',     297.00, 2970.00, ARRAY['personal'],            3, 200),
  ('Combo Starter',    297.00, 2970.00, ARRAY['nutricao','personal'], 1, 100),
  ('Combo Pro',        597.00, 5970.00, ARRAY['nutricao','personal'], 3, 500)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.criar_schema_clinica(p_schema VARCHAR)
RETURNS void AS $$
BEGIN

  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.usuarios (
      id        UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
      google_id VARCHAR(100) UNIQUE NOT NULL,
      nome      VARCHAR(200) NOT NULL,
      email     VARCHAR(200) UNIQUE NOT NULL,
      foto_url  TEXT,
      perfil    VARCHAR(20)  NOT NULL CHECK (perfil IN (''admin'',''nutricionista'',''personal'',''paciente'')),
      modulos   TEXT[]       DEFAULT ARRAY[]::text[],
      ativo     BOOLEAN      DEFAULT true,
      criado_em TIMESTAMPTZ  DEFAULT NOW()
    )', p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.nutricionistas (
      id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      usuario_id            UUID NOT NULL REFERENCES %I.usuarios(id),
      crn                   VARCHAR(20) UNIQUE,
      especialidade         VARCHAR(100),
      google_calendar_token TEXT,
      google_calendar_id    VARCHAR(200),
      valor_consulta        NUMERIC(10,2),
      ativo                 BOOLEAN DEFAULT true
    )', p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.personals (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      usuario_id    UUID NOT NULL REFERENCES %I.usuarios(id),
      cref          VARCHAR(20) UNIQUE,
      especialidade VARCHAR(100),
      valor_sessao  NUMERIC(10,2),
      ativo         BOOLEAN DEFAULT true
    )', p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.pacientes (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      usuario_id       UUID REFERENCES %I.usuarios(id),
      nutricionista_id UUID REFERENCES %I.nutricionistas(id),
      cpf              VARCHAR(14) UNIQUE,
      data_nascimento  DATE,
      sexo             VARCHAR(10) CHECK (sexo IN (''M'',''F'',''outro'')),
      telefone         VARCHAR(20),
      objetivo         TEXT,
      alergias         TEXT[] DEFAULT ARRAY[]::text[],
      patologias       TEXT[] DEFAULT ARRAY[]::text[],
      ativo            BOOLEAN DEFAULT true,
      criado_em        TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.avaliacoes_corporais (
      id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      paciente_id       UUID NOT NULL REFERENCES %I.pacientes(id),
      nutricionista_id  UUID REFERENCES %I.nutricionistas(id),
      data_avaliacao    DATE NOT NULL DEFAULT CURRENT_DATE,
      peso_kg           NUMERIC(5,2),
      altura_cm         NUMERIC(5,1),
      imc               NUMERIC(5,2),
      gordura_pct       NUMERIC(5,2),
      massa_muscular_kg NUMERIC(5,2),
      cintura_cm        NUMERIC(5,1),
      quadril_cm        NUMERIC(5,1),
      braco_cm          NUMERIC(5,1),
      coxa_cm           NUMERIC(5,1),
      observacoes       TEXT,
      criado_em         TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.historico_paciente (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      paciente_id      UUID NOT NULL REFERENCES %I.pacientes(id),
      nutricionista_id UUID REFERENCES %I.nutricionistas(id),
      data_registro    DATE NOT NULL DEFAULT CURRENT_DATE,
      tipo             VARCHAR(20) CHECK (tipo IN (''consulta'',''retorno'',''avaliacao'')),
      queixa_principal TEXT,
      anamnese         TEXT,
      conduta          TEXT,
      retorno_em       DATE,
      criado_em        TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.alimentos (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nome          VARCHAR(200) NOT NULL,
      porcao_g      NUMERIC(7,2) DEFAULT 100,
      calorias      NUMERIC(7,2) DEFAULT 0,
      proteina_g    NUMERIC(6,2) DEFAULT 0,
      carboidrato_g NUMERIC(6,2) DEFAULT 0,
      gordura_g     NUMERIC(6,2) DEFAULT 0,
      fibra_g       NUMERIC(6,2) DEFAULT 0,
      fonte         VARCHAR(20)  DEFAULT ''manual'' CHECK (fonte IN (''taco'',''manual'',''usda''))
    )', p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.planos_alimentares (
      id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      paciente_id        UUID NOT NULL REFERENCES %I.pacientes(id),
      nutricionista_id   UUID REFERENCES %I.nutricionistas(id),
      nome               VARCHAR(200) NOT NULL,
      objetivo           VARCHAR(100),
      calorias_meta      NUMERIC(7,2),
      proteina_meta_g    NUMERIC(6,2),
      carboidrato_meta_g NUMERIC(6,2),
      gordura_meta_g     NUMERIC(6,2),
      ativo              BOOLEAN DEFAULT true,
      valido_ate         DATE,
      criado_em          TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.refeicoes (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      plano_id    UUID NOT NULL REFERENCES %I.planos_alimentares(id) ON DELETE CASCADE,
      nome        VARCHAR(100) NOT NULL,
      horario     TIME,
      ordem       INT  DEFAULT 1,
      observacoes TEXT
    )', p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.refeicao_alimentos (
      id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      refeicao_id  UUID NOT NULL REFERENCES %I.refeicoes(id) ON DELETE CASCADE,
      alimento_id  UUID NOT NULL REFERENCES %I.alimentos(id),
      quantidade_g NUMERIC(7,2) NOT NULL,
      ordem        INT  DEFAULT 1,
      observacao   TEXT,
      substitutos  UUID[] DEFAULT ARRAY[]::uuid[]
    )', p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.registro_alimentar (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      paciente_id   UUID NOT NULL REFERENCES %I.pacientes(id),
      plano_id      UUID REFERENCES %I.planos_alimentares(id),
      refeicao_id   UUID REFERENCES %I.refeicoes(id),
      data          DATE NOT NULL DEFAULT CURRENT_DATE,
      seguiu        BOOLEAN DEFAULT true,
      observacao    TEXT,
      registrado_em TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.consultas (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      paciente_id      UUID NOT NULL REFERENCES %I.pacientes(id),
      nutricionista_id UUID NOT NULL REFERENCES %I.nutricionistas(id),
      inicio_em        TIMESTAMPTZ NOT NULL,
      fim_em           TIMESTAMPTZ NOT NULL,
      tipo             VARCHAR(20) DEFAULT ''presencial'' CHECK (tipo IN (''presencial'',''online'')),
      status           VARCHAR(20) DEFAULT ''agendada'' CHECK (status IN (''agendada'',''confirmada'',''realizada'',''cancelada'',''falta'')),
      google_event_id  VARCHAR(200),
      link_online      TEXT,
      observacoes      TEXT,
      criado_em        TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.disponibilidade (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nutricionista_id UUID NOT NULL REFERENCES %I.nutricionistas(id),
      dia_semana       INT  NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
      hora_inicio      TIME NOT NULL,
      hora_fim         TIME NOT NULL,
      duracao_min      INT  DEFAULT 60,
      ativo            BOOLEAN DEFAULT true
    )', p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.pagamentos_consultas (
      id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      consulta_id     UUID NOT NULL REFERENCES %I.consultas(id),
      paciente_id     UUID NOT NULL REFERENCES %I.pacientes(id),
      valor           NUMERIC(10,2) NOT NULL,
      desconto        NUMERIC(10,2) DEFAULT 0,
      valor_final     NUMERIC(10,2) NOT NULL,
      metodo          VARCHAR(20) CHECK (metodo IN (''pix'',''cartao'',''dinheiro'',''convenio'')),
      status          VARCHAR(20) DEFAULT ''pendente'' CHECK (status IN (''pendente'',''pago'',''estornado'')),
      pago_em         TIMESTAMPTZ,
      comprovante_url TEXT,
      criado_em       TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.pacotes_consultas (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      paciente_id      UUID NOT NULL REFERENCES %I.pacientes(id),
      nutricionista_id UUID NOT NULL REFERENCES %I.nutricionistas(id),
      total_consultas  INT  NOT NULL,
      usadas           INT  DEFAULT 0,
      valor_total      NUMERIC(10,2) NOT NULL,
      valido_ate       DATE,
      status           VARCHAR(20) DEFAULT ''ativo'' CHECK (status IN (''ativo'',''esgotado'',''vencido'')),
      criado_em        TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema);


  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.alunos (
      id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      usuario_id      UUID REFERENCES %I.usuarios(id),
      personal_id     UUID REFERENCES %I.personals(id),
      cpf             VARCHAR(14) UNIQUE,
      data_nascimento DATE,
      sexo            VARCHAR(10) CHECK (sexo IN (''M'',''F'',''outro'')),
      telefone        VARCHAR(20),
      objetivo        TEXT,
      restricoes      TEXT[] DEFAULT ARRAY[]::text[],
      ativo           BOOLEAN DEFAULT true,
      criado_em       TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.avaliacoes_fisicas (
      id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      aluno_id          UUID NOT NULL REFERENCES %I.alunos(id),
      personal_id       UUID REFERENCES %I.personals(id),
      data_avaliacao    DATE NOT NULL DEFAULT CURRENT_DATE,
      peso_kg           NUMERIC(5,2),
      altura_cm         NUMERIC(5,1),
      imc               NUMERIC(5,2),
      gordura_pct       NUMERIC(5,2),
      massa_muscular_kg NUMERIC(5,2),
      vo2_max           NUMERIC(5,2),
      cintura_cm        NUMERIC(5,1),
      quadril_cm        NUMERIC(5,1),
      braco_cm          NUMERIC(5,1),
      coxa_cm           NUMERIC(5,1),
      observacoes       TEXT,
      criado_em         TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.exercicios (
      id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nome           VARCHAR(200) NOT NULL,
      grupo_muscular VARCHAR(100),
      equipamento    VARCHAR(100),
      descricao      TEXT,
      video_url      TEXT,
      dificuldade    VARCHAR(20) CHECK (dificuldade IN (''iniciante'',''intermediario'',''avancado''))
    )', p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.fichas_treino (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      aluno_id    UUID NOT NULL REFERENCES %I.alunos(id),
      personal_id UUID REFERENCES %I.personals(id),
      nome        VARCHAR(200) NOT NULL,
      objetivo    VARCHAR(100),
      dias_semana INT[] DEFAULT ARRAY[]::int[],
      ativo       BOOLEAN DEFAULT true,
      valido_ate  DATE,
      criado_em   TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.ficha_exercicios (
      id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ficha_id     UUID NOT NULL REFERENCES %I.fichas_treino(id) ON DELETE CASCADE,
      exercicio_id UUID NOT NULL REFERENCES %I.exercicios(id),
      series       INT  NOT NULL DEFAULT 3,
      repeticoes   VARCHAR(20) NOT NULL DEFAULT ''12'',
      carga_kg     NUMERIC(6,2),
      descanso_seg INT  DEFAULT 60,
      ordem        INT  DEFAULT 1,
      observacoes  TEXT
    )', p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.sessoes_treino (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      aluno_id    UUID NOT NULL REFERENCES %I.alunos(id),
      personal_id UUID NOT NULL REFERENCES %I.personals(id),
      ficha_id    UUID REFERENCES %I.fichas_treino(id),
      inicio_em   TIMESTAMPTZ NOT NULL,
      fim_em      TIMESTAMPTZ NOT NULL,
      tipo        VARCHAR(20) DEFAULT ''presencial'' CHECK (tipo IN (''presencial'',''online'')),
      status      VARCHAR(20) DEFAULT ''agendada'' CHECK (status IN (''agendada'',''realizada'',''cancelada'',''falta'')),
      link_online TEXT,
      observacoes TEXT,
      criado_em   TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.registro_treino (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      aluno_id      UUID NOT NULL REFERENCES %I.alunos(id),
      ficha_id      UUID REFERENCES %I.fichas_treino(id),
      sessao_id     UUID REFERENCES %I.sessoes_treino(id),
      data          DATE NOT NULL DEFAULT CURRENT_DATE,
      concluido     BOOLEAN DEFAULT false,
      duracao_min   INT,
      observacao    TEXT,
      registrado_em TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.evolucao_fisica (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      aluno_id    UUID NOT NULL REFERENCES %I.alunos(id),
      data        DATE NOT NULL DEFAULT CURRENT_DATE,
      peso_kg     NUMERIC(5,2),
      gordura_pct NUMERIC(5,2),
      observacao  TEXT,
      criado_em   TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.pagamentos_sessoes (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      sessao_id   UUID NOT NULL REFERENCES %I.sessoes_treino(id),
      aluno_id    UUID NOT NULL REFERENCES %I.alunos(id),
      valor       NUMERIC(10,2) NOT NULL,
      desconto    NUMERIC(10,2) DEFAULT 0,
      valor_final NUMERIC(10,2) NOT NULL,
      metodo      VARCHAR(20) CHECK (metodo IN (''pix'',''cartao'',''dinheiro'')),
      status      VARCHAR(20) DEFAULT ''pendente'' CHECK (status IN (''pendente'',''pago'',''estornado'')),
      pago_em     TIMESTAMPTZ,
      criado_em   TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.vinculos_modulos (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      cpf         VARCHAR(14) NOT NULL UNIQUE,
      paciente_id UUID REFERENCES %I.pacientes(id),
      aluno_id    UUID REFERENCES %I.alunos(id),
      criado_em   TIMESTAMPTZ DEFAULT NOW()
    )', p_schema, p_schema, p_schema);

  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_pac_nutri     ON %I.pacientes(nutricionista_id)',       p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_pac_cpf       ON %I.pacientes(cpf)',                    p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_aval_pac      ON %I.avaliacoes_corporais(paciente_id)', p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_plano_pac     ON %I.planos_alimentares(paciente_id)',   p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_plano_ativo   ON %I.planos_alimentares(ativo)',         p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_consul_pac    ON %I.consultas(paciente_id)',            p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_consul_data   ON %I.consultas(inicio_em)',              p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_aluno_pes     ON %I.alunos(personal_id)',               p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_ficha_aluno   ON %I.fichas_treino(aluno_id)',           p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_sessao_data   ON %I.sessoes_treino(inicio_em)',         p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_reg_alim_pac  ON %I.registro_alimentar(paciente_id)',  p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_reg_alim_data ON %I.registro_alimentar(data)',         p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_alim_nome     ON %I.alimentos USING gin(nome gin_trgm_ops)', p_schema, p_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_exer_nome     ON %I.exercicios USING gin(nome gin_trgm_ops)', p_schema, p_schema);

  RAISE NOTICE 'Schema % criado — 22 tabelas + indices', p_schema;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.nova_clinica(
  p_nome        VARCHAR,
  p_subdominio  VARCHAR,
  p_email_admin VARCHAR,
  p_plano_nome  VARCHAR DEFAULT 'Nutri Starter'
) RETURNS UUID AS $$
DECLARE
  v_clinica_id UUID;
  v_plano_id   UUID;
  v_schema     VARCHAR;
BEGIN
  v_schema := 'clinica_' || lower(regexp_replace(p_subdominio, '[^a-z0-9]', '_', 'g'));
  SELECT id INTO v_plano_id FROM public.planos_saas WHERE nome = p_plano_nome LIMIT 1;
  INSERT INTO public.clinicas (nome, subdominio, schema_name, email_admin, plano_id)
  VALUES (p_nome, p_subdominio, v_schema, p_email_admin, v_plano_id)
  RETURNING id INTO v_clinica_id;
  PERFORM public.criar_schema_clinica(v_schema);
  RAISE NOTICE 'Clinica "%" criada — schema: %', p_nome, v_schema;
  RETURN v_clinica_id;
END;
$$ LANGUAGE plpgsql;

SELECT public.nova_clinica('Clinica Demo', 'demo', 'admin@demo.com.br', 'Combo Starter');

DO $$
DECLARE
  v_schemas INT;
  v_tabelas INT;
  v_planos  INT;
BEGIN
  SELECT COUNT(*) INTO v_schemas FROM information_schema.schemata   WHERE schema_name LIKE 'clinica_%';
  SELECT COUNT(*) INTO v_tabelas FROM information_schema.tables      WHERE table_schema LIKE 'clinica_%';
  SELECT COUNT(*) INTO v_planos  FROM public.planos_saas;
  RAISE NOTICE '================================';
  RAISE NOTICE 'Banco criado com sucesso!';
  RAISE NOTICE 'Planos SaaS : %', v_planos;
  RAISE NOTICE 'Clinicas    : %', v_schemas;
  RAISE NOTICE 'Tabelas     : %', v_tabelas;
  RAISE NOTICE '================================';
END;
$$;
