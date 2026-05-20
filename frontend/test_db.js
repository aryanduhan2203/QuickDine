const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: stores, error: sErr } = await supabase.from('store_profiles').select('*');
  console.log('Stores:', stores?.length, sErr);
  if (stores?.length) {
    console.log('First store tags:', stores[0].cuisine_tags);
    console.log('First store name:', stores[0].store_name);
    console.log('First store is_visible:', stores[0].is_visible);
  }
  
  const searchStr = 'naan';
  const { data: menus, error: mErr } = await supabase.from('menu_items').select('*').or(`name.ilike.%${searchStr}%,category.ilike.%${searchStr}%`);
  console.log('Menus:', menus?.length, mErr);
  if (menus?.length) {
    console.log('Matched menu item:', menus[0].name);
  }
}
run();
