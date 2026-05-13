const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler .env.local manualmente
const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateSchema() {
  console.log('--- Verificando Colunas de Vigência ---');
  
  // Tentar selecionar a coluna para ver se existe
  const { error: checkError } = await supabase.from('vt_records').select('end_date').limit(1);
  
  if (checkError && checkError.code === '42703') {
    console.log('Coluna end_date não existe. Por favor, adicione-a via painel do Supabase SQL:');
    console.log('ALTER TABLE vt_records ADD COLUMN end_date DATE;');
    console.log('---');
    console.log('Tentando criar via RPC se disponível...');
    
    // Tentar via RPC caso o usuário tenha configurado um exec_sql
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE vt_records ADD COLUMN end_date DATE;'
    });
    
    if (rpcError) {
      console.error('Não foi possível criar automaticamente. Ação manual necessária no Supabase.');
    } else {
      console.log('Coluna criada via RPC!');
    }
  } else if (checkError) {
    console.error('Erro ao verificar coluna:', checkError.message);
  } else {
    console.log('A coluna end_date já está presente no banco!');
  }
}

updateSchema();
