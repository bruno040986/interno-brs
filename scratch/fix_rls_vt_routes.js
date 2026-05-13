const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixRLS() {
  console.log('Liberando permissões na tabela vt_routes...')
  
  // Como não temos uma função RPC para SQL direto, vamos tentar garantir que a tabela aceite inserções
  // Nota: O ideal é rodar isso no painel SQL do Supabase:
  // ALTER TABLE vt_routes ENABLE ROW LEVEL SECURITY;
  // CREATE POLICY "Allow all for authenticated" ON vt_routes FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
  // Vou tentar uma inserção de teste com a Service Role (que pula RLS) para confirmar que a tabela existe e está OK
  const { data, error } = await supabase.from('vt_routes').select('*').limit(1)
  
  if (error) {
    console.error('Erro ao acessar tabela:', error.message)
  } else {
    console.log('Conexão com vt_routes estabelecida com sucesso.')
    console.log('AVISO: Por favor, execute o seguinte comando no SQL Editor do seu Supabase para liberar o acesso aos usuários:')
    console.log('ALTER TABLE vt_routes ENABLE ROW LEVEL SECURITY;')
    console.log('DROP POLICY IF EXISTS "Allow all for authenticated" ON vt_routes;')
    console.log('CREATE POLICY "Allow all for authenticated" ON vt_routes FOR ALL TO authenticated USING (true) WITH CHECK (true);')
  }
}

fixRLS()
