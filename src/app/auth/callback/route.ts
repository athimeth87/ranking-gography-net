import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = request.nextUrl.origin;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=Authentication%20failed`);
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.session?.user) {
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=Authentication%20failed`);
  }

  const user = data.session.user;
  const createdAt = new Date(user.created_at).getTime();
  const isNewUser = Date.now() - createdAt < 60_000;

  if (isNewUser && user.email) {
    try {
      const { data: whitelistData } = await supabase
        .from('customer_whitelist')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .eq('status', 'pending')
        .single();

      if (whitelistData) {
        const roleUpdates: Record<string, unknown> = {};
        if (whitelistData.role === 'voyageur') roleUpdates.is_customer = true;
        if (whitelistData.role === 'photographer') roleUpdates.photographer_status = 'approved';

        await supabase.from('users').update(roleUpdates).eq('id', user.id);
        await supabase
          .from('customer_whitelist')
          .update({ status: 'registered', registered_at: new Date().toISOString() })
          .eq('id', whitelistData.id);
      }
    } catch (e) {
      console.error('Whitelist processing error:', e);
    }

    const userName = user.user_metadata?.full_name || 'Photographer';
    sendWelcomeEmail(user.email, userName).catch((err) =>
      console.error('Failed to send welcome email:', err),
    );
  }

  return NextResponse.redirect(`${request.nextUrl.origin}${next}`);
}
