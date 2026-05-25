import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zotxmuifufctgikdyyuz.supabase.co',
  'sb_publishable_wEdoRyZ3JOSa189xQF1ylA_o8FjUIvb' // Anon key from .env.local
);

async function promote() {
  console.log('Promoting zerryboy28@gmail.com to superadmin...');
  
  // Call the RPC we just created!
  const { data, error } = await supabase.rpc('promote_to_admin', {
    target_email: 'zerryboy28@gmail.com',
    role_name: 'superadmin'
  });

  if (error) {
    console.error('Failed:', error.message);
  } else if (data === false) {
    console.log('User not found in users table. Inserting into admin_invites instead...');
    
    const { error: inviteError } = await supabase
      .from('admin_invites')
      .upsert({ email: 'zerryboy28@gmail.com', role: 'superadmin' }, { onConflict: 'email' });
      
    if (inviteError) {
      console.error('Failed to invite:', inviteError.message);
    } else {
      console.log('Successfully added to admin_invites!');
    }
  } else {
    console.log('Success! Promoted zerryboy28@gmail.com in the users table.');
  }
}

promote();
