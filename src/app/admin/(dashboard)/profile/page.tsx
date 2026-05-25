'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Shield, Mail, Key, Clock, Save, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AdminProfilePage() {
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (data) setAdminProfile({ ...data, email: user.email });
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  if (isLoading) {
    return <div className="p-12 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">Loading profile...</div>;
  }

  const displayName = adminProfile?.display_name || adminProfile?.username || 'Admin User';
  const roleName = adminProfile?.is_super_admin ? 'Superadmin' : 'Admin';

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      window.location.replace('/admin/login');
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-4xl animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight mb-2">My Profile</h1>
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
            Manage your personal workspace settings and security
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSignOut} variant="outline" className="font-mono text-[10px] uppercase tracking-widest rounded-none border-neutral-300 gap-2">
            <LogOut className="h-3 w-3" /> Sign Out
          </Button>
          <Button className="font-mono text-[10px] uppercase tracking-widest rounded-none bg-neutral-900 text-white hover:bg-neutral-800 gap-2">
            <Save className="h-3 w-3" /> Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
        
        {/* Left Sidebar - Profile Summary */}
        <div className="flex flex-col gap-6">
          <div className="border border-neutral-200 bg-white p-6 flex flex-col items-center text-center">
            <div className="relative mb-4 group cursor-pointer">
              <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                <AvatarImage src={adminProfile?.avatar_url || "https://ui.shadcn.com/avatars/01.png"} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-neutral-900 text-white text-3xl font-light">
                  {displayName.substring(0,2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div className="absolute bottom-1 right-1 h-5 w-5 bg-green-500 rounded-full border-4 border-white shadow-sm"></div>
            </div>
            
            <h2 className="text-xl font-medium tracking-tight">{displayName}</h2>
            <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mt-1 mb-4">{adminProfile?.email}</p>
            
            <Badge variant="outline" className="rounded-none px-3 py-1 text-[10px] font-mono uppercase tracking-widest border-blue-600/30 text-blue-700 bg-blue-50 w-full justify-center">
              <Shield className="h-3 w-3 mr-1.5" />
              {roleName}
            </Badge>
          </div>

          <div className="border border-neutral-200 bg-white p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-neutral-900 mb-4 border-b pb-2">Workspace Info</h3>
            <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest">
              <div className="flex justify-between">
                <span className="text-neutral-400">Joined</span>
                <span className="text-neutral-900 font-medium">Jan 12, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Last Login</span>
                <span className="text-neutral-900 font-medium">Today, 09:41 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Location</span>
                <span className="text-neutral-900 font-medium">Bangkok, TH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Forms */}
        <div className="border border-neutral-200 bg-white">
          <Tabs defaultValue="general" className="w-full">
            <div className="border-b border-neutral-100 p-2">
              <TabsList className="bg-transparent space-x-2">
                <TabsTrigger value="general" className="rounded-none font-mono text-[10px] uppercase tracking-widest data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none px-4 py-2 border border-transparent data-[state=active]:border-neutral-200">
                  General Info
                </TabsTrigger>
                <TabsTrigger value="security" className="rounded-none font-mono text-[10px] uppercase tracking-widest data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none px-4 py-2 border border-transparent data-[state=active]:border-neutral-200">
                  Security
                </TabsTrigger>
              </TabsList>
            </div>

            {/* General Info Tab */}
            <TabsContent value="general" className="p-6 m-0 outline-none space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-xs font-mono uppercase tracking-widest text-neutral-500">Display Name</Label>
                  <Input id="displayName" defaultValue={displayName} className="rounded-none h-10 border-neutral-300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-mono uppercase tracking-widest text-neutral-500">Username</Label>
                  <Input id="username" defaultValue={adminProfile?.username || ''} className="rounded-none h-10 border-neutral-300" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-mono uppercase tracking-widest text-neutral-500">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input id="email" type="email" defaultValue={adminProfile?.email} disabled className="rounded-none h-10 pl-10 border-neutral-300 bg-neutral-50 text-neutral-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs font-mono uppercase tracking-widest text-neutral-500">Short Bio</Label>
                <textarea 
                  id="bio" 
                  rows={4} 
                  defaultValue={adminProfile?.bio || ""}
                  placeholder="Tell us a little bit about yourself..."
                  className="w-full flex rounded-none border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 resize-none" 
                />
                <p className="text-[10px] text-neutral-400 font-mono">Will be visible to other admin team members.</p>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="p-6 m-0 outline-none space-y-8">
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Change Password</h3>
                  <p className="text-xs text-neutral-500 mb-4">Ensure your account is using a long, random password to stay secure.</p>
                </div>
                
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="current" className="text-xs font-mono uppercase tracking-widest text-neutral-500">Current Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <Input id="current" type="password" placeholder="••••••••" className="rounded-none h-10 pl-10 border-neutral-300" />
                  </div>
                </div>
                
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="new" className="text-xs font-mono uppercase tracking-widest text-neutral-500">New Password</Label>
                  <Input id="new" type="password" placeholder="••••••••" className="rounded-none h-10 border-neutral-300" />
                </div>
                
                <Button className="font-mono text-[10px] uppercase tracking-widest rounded-none border border-neutral-200 bg-neutral-50 text-neutral-900 hover:bg-neutral-100 shadow-none">
                  Update Password
                </Button>
              </div>

              <div className="border-t border-neutral-100 pt-8 space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Active Sessions</h3>
                  <p className="text-xs text-neutral-500 mb-4">Devices currently logged into your account.</p>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50/30">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mac OS · Chrome</p>
                      <p className="text-[10px] font-mono text-neutral-500">Bangkok, TH · Active now</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-green-600/30 text-green-700 bg-green-50 rounded-none text-[10px]">Current</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-neutral-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-neutral-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">iPhone 15 · Safari</p>
                      <p className="text-[10px] font-mono text-neutral-500">Chiang Mai, TH · 2 days ago</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="font-mono text-[10px] uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 rounded-none h-8">Revoke</Button>
                </div>
              </div>
              
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
}
