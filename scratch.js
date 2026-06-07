const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  // Check season
  const { data: seasons } = await supabase.from('seasons').select('id, status, name');
  console.log("Seasons:", seasons);
  
  // Check photos with season_id
  const { data: withSeason } = await supabase
    .from('photos').select('id', { count: 'exact', head: true })
    .not('season_id', 'is', null);
  console.log("Photos with season_id:", withSeason);
  
  // Check raw count
  const { count: totalCount } = await supabase
    .from('photos').select('*', { count: 'exact', head: true });
  console.log("Total photos:", totalCount);

  // Check RPC
  const { data: rpc, error } = await supabase.rpc('get_v5_hall_of_fame', { p_season_id: null });
  console.log("RPC result:", rpc, "Error:", error);
}
run();
