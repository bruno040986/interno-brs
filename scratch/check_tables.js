
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  const { data, error } = await supabase
    .from('sector_links')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('Tabela sector_links não encontrada ou erro:', error.message);
  } else {
    console.log('Tabela sector_links encontrada!');
  }
}

checkTables();
