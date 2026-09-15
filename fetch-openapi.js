const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function getOpenAPI() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
  const response = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const data = await response.json();
  fs.writeFileSync('openapi.json', JSON.stringify(data, null, 2));
  console.log('OpenAPI spec saved to openapi.json');
}

getOpenAPI();
