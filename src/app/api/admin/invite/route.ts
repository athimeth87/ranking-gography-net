import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAdminInviteEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Try to promote the user immediately if they already exist in the database.
    // We use an RPC function to bypass RLS.
    const { data: userUpdated } = await supabase.rpc('promote_to_admin', {
      target_email: email,
      role_name: role
    });

    // 2. If user doesn't exist yet, store them in admin_invites (pending)
    if (!userUpdated) {
      await supabase
        .from('admin_invites')
        .upsert({ email, role }, { onConflict: 'email' });
    }

    // 3. Send the invite email
    const emailSent = await sendAdminInviteEmail(email, role);

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send invite email, but database was updated.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Invitation sent successfully!' });
  } catch (error: any) {
    console.error('API /admin/invite Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
