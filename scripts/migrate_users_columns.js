const { createClient } = require('@supabase/supabase-js')

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ACCESS_TOKEN ||
  process.env.SUPABASE_MANAGEMENT_API_KEY
const projectRef = process.env.SUPABASE_PROJECT_REF

if (!url || !key || !projectRef) {
  console.error('Variáveis necessárias não configuradas. Defina: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_ACCESS_TOKEN) e SUPABASE_PROJECT_REF.')
  process.exit(1)
}

async function runMigrationViaManagementAPI(sql) {
  // Supabase Management API para executar SQL
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key
    },
    body: JSON.stringify({ query: sql })
  })
  const text = await res.text()
  return { status: res.status, body: text }
}

async function runSQLViaPostgREST(sql) {
  // Alternativa: chamar via pg_query da extension pg_net (se existir)
  // Outra alternativa: chamar o endpoint /sql direto
  const res = await fetch(`${url}/rest/v1/`, {
    method: 'GET',
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key
    }
  })
  return { status: res.status }
}

async function main() {
  console.log('Tentando via Management API do Supabase...')

  const sqlStatements = [
    `CREATE TABLE IF NOT EXISTS commercial_entities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      cpf_cnpj TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('superintendente', 'supervisor', 'gerente')),
      parent_id UUID REFERENCES commercial_entities(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'ativo' NOT NULL CHECK (status IN ('ativo', 'inativo')),
      arw_code TEXT,
      filial TEXT,
      nivel_acesso TEXT,
      tipo_agente TEXT,
      regra_fisico TEXT,
      phone_whatsapp TEXT,
      email_comissao TEXT,
      google_drive_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
    )`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS commercial_role TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS superintendente_id UUID`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS supervisor_id UUID`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS gerente_id UUID`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id UUID`,
  ]

  for (const stmt of sqlStatements) {
    const preview = stmt.trim().substring(0, 60) + '...'
    const result = await runMigrationViaManagementAPI(stmt)
    console.log(`[${result.status}] ${preview}`)
    if (result.status !== 200 && result.status !== 201 && result.status !== 204) {
      console.log('  Resposta:', result.body.substring(0, 200))
    } else {
      console.log('  OK!')
    }
  }

  // Verificar se funcionou
  const s = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await s.from('users').select('id, commercial_role, employee_id').limit(1)
  if (error) {
    console.log('\nVerificacao FALHOU:', error.message)
    console.log('\n=== SQL para executar MANUALMENTE no Supabase Dashboard ===')
    console.log('Acesse: https://supabase.com/dashboard/project/gazwohjfigvcycnukdwj/sql/new')
    console.log('\n--- Cole e execute este SQL ---\n')
    console.log(sqlStatements.join(';\n\n') + ';')
  } else {
    console.log('\nVerificacao OK - colunas existem!')
    console.log('Colunas:', data && data[0] ? Object.keys(data[0]).join(', ') : 'sem registros mas coluna existe')
  }
}

main().catch(console.error)
