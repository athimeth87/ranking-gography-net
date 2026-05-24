'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Mail, KeyRound, Loader2, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError('');
    setMessage('');

    const supabase = getSupabaseBrowserClient();
    
    // First check if they actually have admin privileges before sending OTP
    const { data: user } = await supabase
      .from('users')
      .select('is_admin, is_super_admin')
      .eq('email', email)
      .single();

    let hasAccess = user && (user.is_admin || user.is_super_admin);
    let shouldCreate = false;
    let inviteRole = null;

    if (!hasAccess) {
      // Check if they are in pending invites
      const { data: invite } = await supabase
        .from('admin_invites')
        .select('role')
        .eq('email', email)
        .single();
        
      if (invite) {
        hasAccess = true;
        shouldCreate = true;
        inviteRole = invite.role;
        setPendingRole(invite.role);
      }
    }

    if (!hasAccess) {
      setError('Unauthorized: This email does not have admin privileges or a pending invite.');
      setIsLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: shouldCreate, // Only create user if they have an invite
      }
    });

    if (authError) {
      setError(authError.message);
    } else {
      setStep('otp');
      setMessage('OTP has been sent to your email.');
    }
    
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setIsLoading(true);
    setError('');

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    if (authError) {
      setError('Invalid or expired OTP. Please try again.');
      setIsLoading(false);
    } else {
      // If they logged in via an invite, we must apply their permissions now
      if (pendingRole) {
        await supabase.rpc('promote_to_admin', {
          target_email: email,
          role_name: pendingRole
        });
      }
      // Success! Redirect to dashboard
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 shadow-sm">
        <div className="p-8 border-b border-neutral-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-neutral-900 flex items-center justify-center mb-6">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-light tracking-tight mb-2">GOGRAPHY SYSTEM</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Secure Administrator Access
          </p>
        </div>

        <div className="p-8">
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-neutral-500">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@gography.net" 
                    className="pl-10 rounded-none border-neutral-300 h-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <Button 
                type="submit" 
                className="w-full rounded-none h-10 font-mono text-xs uppercase tracking-widest bg-neutral-900 hover:bg-neutral-800 transition-colors"
                disabled={isLoading || !email}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="bg-neutral-50 border border-neutral-200 p-4 mb-6 text-center">
                <p className="text-sm text-neutral-600">
                  We sent a 6-digit code to <br/>
                  <span className="font-medium text-neutral-900">{email}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="font-mono text-xs uppercase tracking-widest text-neutral-500">Secure OTP Code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input 
                    id="otp" 
                    type="text" 
                    placeholder="123456" 
                    className="pl-10 rounded-none border-neutral-300 h-10 font-mono text-lg tracking-widest"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              {message && <p className="text-xs text-green-600 font-medium">{message}</p>}

              <Button 
                type="submit" 
                className="w-full rounded-none h-10 font-mono text-xs uppercase tracking-widest bg-neutral-900 hover:bg-neutral-800 transition-colors gap-2"
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify & Login <ArrowRight className="h-3.5 w-3.5" /></>}
              </Button>

              <button 
                type="button" 
                onClick={() => { setStep('email'); setOtp(''); setError(''); setMessage(''); }}
                className="w-full text-center text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-900"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
