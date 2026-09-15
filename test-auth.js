const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCreate() {
  console.log('Tentando criar usuário via Service Role...');
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('ERRO AO BUSCAR PROFILES:', error);
  } else {
    console.log('Tabela profiles existe e retornou:', data);
  }
}

testCreate();
