import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.session?.user) {
      const user = data.session.user;
      
      // Check if user was created within the last 60 seconds
      const createdAt = new Date(user.created_at).getTime();
      const now = Date.now();
      const isNewUser = (now - createdAt) < 60000;
      
      if (isNewUser && user.email) {
        // Process Whitelist
        try {
          const { data: whitelistData } = await supabase.from('customer_whitelist')
            .select('*').eq('email', user.email.toLowerCase()).eq('status', 'pending').single();
          
          if (whitelistData) {
            // Update User Role
            const roleUpdates: any = {};
            if (whitelistData.role === 'voyageur') roleUpdates.is_customer = true;
            if (whitelistData.role === 'photographer') roleUpdates.photographer_status = 'approved';
            
            await supabase.from('users').update(roleUpdates).eq('id', user.id);
            
            // Mark Whitelist as Registered
            await supabase.from('customer_whitelist').update({ status: 'registered', registered_at: new Date().toISOString() }).eq('id', whitelistData.id);
            console.log(`Applied whitelisted role ${whitelistData.role} to ${user.email}`);
          }
        } catch (e) {
          console.error("Whitelist processing error:", e);
        }

        // Send email in the background
        const userName = user.user_metadata?.full_name || 'Photographer';
        sendWelcomeEmail(user.email, userName).catch(err => console.error("Failed to send welcome email:", err));
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Authentication%20failed`);
}
