'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, Shield, Ban, Plus, Search, Mail } from 'lucide-react';

import { AdminStaffRow } from '@/components/admin/AdminStaffRow';

export default function AdminStaffPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('moderator');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    const fetchAdmins = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('users')
        .select('*')
        .or('is_admin.eq.true,is_super_admin.eq.true')
        .order('created_at', { ascending: false });

      const { data: invites } = await supabase
        .from('admin_invites')
        .select('*')
        .order('created_at', { ascending: false });

      let combinedAdmins: any[] = [];

      if (data) {
        combinedAdmins = data.map((u: any) => ({
          id: u.id,
          username: u.username,
          name: u.display_name || u.username,
          loc: u.location || 'Unknown Location',
          avatar: u.avatar_url || 'https://via.placeholder.com/150',
          role: u.is_super_admin ? 'Superadmin' : 'Admin',
          status: 'Active',
          created_at: u.created_at
        }));
      }

      if (invites) {
        const pending = invites.map((inv: any) => ({
          id: inv.id,
          username: inv.email.split('@')[0],
          name: inv.email,
          avatar: 'https://via.placeholder.com/150',
          role: inv.role.charAt(0).toUpperCase() + inv.role.slice(1),
          status: 'Pending',
          joined: 'Awaiting Login'
        }));
        combinedAdmins = [...combinedAdmins, ...pending];
      }

      setAdminUsers(combinedAdmins);
      setIsLoading(false);
    };
    fetchAdmins();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    setInviteMessage('');

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      if (res.ok) {
        setInviteMessage('✅ Invitation sent successfully!');
        setInviteEmail('');
        // Refresh list
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setInviteMessage('❌ ' + (data.error || 'Failed to send invite'));
      }
    } catch (err: any) {
      setInviteMessage('❌ Error: ' + err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const filteredAdmins = adminUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight mb-2">Admin Team</h1>
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
            Manage System Administrators and Content Moderators
          </p>
        </div>
        <div className="flex gap-2">
          {/* Add Admin Dialog */}
          <Dialog>
            <DialogTrigger render={
              <Button className="font-mono text-xs uppercase tracking-widest rounded-none bg-neutral-900 text-white hover:bg-neutral-800 gap-2">
                <Plus className="h-3.5 w-3.5" /> Add New Admin
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px] rounded-none">
              <DialogHeader>
                <DialogTitle className="font-light text-2xl tracking-tight">Add Administrator</DialogTitle>
                <DialogDescription className="font-mono text-[10px] uppercase tracking-widest">
                  Invite a new team member and assign their system role.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 mt-2">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-neutral-500">Email address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="staff@gography.net" 
                    className="rounded-none border-neutral-300"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 mt-2">
                  <Label htmlFor="role" className="font-mono text-xs uppercase tracking-widest text-neutral-500">Assign Role</Label>
                  <select 
                    id="role" 
                    className="flex h-10 w-full border border-neutral-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-none"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="superadmin">Superadmin (Full Access)</option>
                    <option value="moderator">Content Moderator (Photos & Users only)</option>
                    <option value="editor">Editorial (Manage Pulse & Seasons)</option>
                  </select>
                </div>
                {inviteMessage && (
                  <div className={`text-sm ${inviteMessage.includes('✅') ? 'text-green-600' : 'text-red-600'} mt-2 font-medium`}>
                    {inviteMessage}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleInvite} 
                  disabled={isInviting || !inviteEmail} 
                  className="rounded-none w-full font-mono text-xs uppercase tracking-widest bg-neutral-900"
                >
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-2">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
          <Input 
            type="text" 
            placeholder="Search by name, handle, or role..." 
            className="pl-9 rounded-none border-neutral-300 h-9 font-mono text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-neutral-200 bg-white">
        {/* Custom Table Header */}
        <div className="grid grid-cols-[auto_1fr_1fr_120px_120px_60px] gap-4 p-4 border-b border-neutral-200 bg-neutral-50 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          <div className="w-12 text-center">Avatar</div>
          <div>Staff Member</div>
          <div>System Role</div>
          <div className="text-center">Added On</div>
          <div className="text-center">Status</div>
          <div className="text-right">Actions</div>
        </div>

        {/* Data Rows */}
        <div className="flex flex-col divide-y divide-neutral-100">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">Loading Admins...</div>
          ) : filteredAdmins.length > 0 ? (
            filteredAdmins.map((admin) => (
              <AdminStaffRow key={admin.id} user={admin} />
            ))
          ) : (
            <div className="p-8 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">No admins found</div>
          )}
        </div>
      </div>
    </div>
  );
}
