import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserCheck, Shield, Ban, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface UserProps {
  id: string;
  name: string;
  username: string;
  avatar: string;
  loc?: string;
  isCustomer?: boolean;
  isAmbassador?: boolean;
  photographerStatus?: string;
  joined?: string;
  photos?: number;
}

export function AdminUserRow({ user, onUpdate }: { user: UserProps, onUpdate?: () => void }) {
  const [role, setRole] = useState(user.isCustomer ? 'voyageur' : user.photographerStatus === 'approved' ? 'photographer' : 'member');
  const [isUpdating, setIsUpdating] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setRole(user.isCustomer ? 'voyageur' : user.photographerStatus === 'approved' ? 'photographer' : 'member');
  }, [user.isCustomer, user.photographerStatus]);

  const handleUpdateRole = async () => {
    setIsUpdating(true);
    const supabase = getSupabaseBrowserClient();
    
    let is_customer = false;
    let photographer_status = 'none';

    if (role === 'voyageur') {
      is_customer = true;
    } else if (role === 'photographer') {
      photographer_status = 'approved';
    }

    const { data, error } = await supabase.rpc('update_user_role', {
      target_id: user.id,
      new_is_customer: is_customer,
      new_photographer_status: photographer_status
    });
    
    setIsUpdating(false);
    
    if (error) {
      alert('Failed to update role: ' + error.message);
      return;
    }

    if (!data) {
      alert('Update blocked: You do not have permission to change roles or the RPC function is missing on Supabase.');
      return;
    }

    setOpen(false);
    if (onUpdate) onUpdate();
  };
  return (
    <div className="grid grid-cols-[auto_1fr_1fr_120px_120px_60px] gap-4 p-4 items-center transition-colors hover:bg-neutral-50/50 group">
      
      {/* Avatar */}
      <div className="w-12 h-12 bg-neutral-100 overflow-hidden rounded-none border border-neutral-200">
        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
      </div>

      {/* Profile Details */}
      <div className="flex flex-col">
        <span className="font-medium text-sm leading-none mb-1">{user.name}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          @{user.username} {user.loc ? `· ${user.loc}` : ''}
        </span>
      </div>

      {/* Role */}
      <div className="flex items-center gap-2">
        {user.isCustomer ? (
          <Badge variant="outline" className="rounded-none px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border-neutral-300 text-neutral-700 bg-neutral-50">
            Traveller
          </Badge>
        ) : user.photographerStatus === 'approved' ? (
          <Badge variant="outline" className="rounded-none px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-neutral-900 text-white border-neutral-900">
            Photographer
          </Badge>
        ) : (
          <Badge variant="outline" className="rounded-none px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border-neutral-200 text-neutral-500 bg-transparent">
            Member
          </Badge>
        )}
        {user.isAmbassador && (
          <Badge variant="outline" className="rounded-none px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border-yellow-600/30 text-yellow-700 bg-yellow-50">
            Ambassador
          </Badge>
        )}
      </div>

      {/* Joined */}
      <div className="font-mono text-[10px] text-neutral-500 text-center tracking-wider">
        {user.joined || '2026-01-15'}
      </div>

      {/* Photos Count */}
      <div className="font-mono text-[10px] text-neutral-500 text-center tracking-wider">
        {user.photos || 0}
      </div>

      {/* Actions */}
      <div className="text-right">
        <Dialog open={open} onOpenChange={setOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-none hover:bg-neutral-200">
                <MoreHorizontal className="h-4 w-4 text-neutral-500" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="rounded-none font-mono text-xs uppercase tracking-wider min-w-[160px]">
              <DropdownMenuItem className="cursor-pointer" render={
                <Link href={`/photographer/${user.username}`}>
                  <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Profile
                </Link>
              } />
              <DropdownMenuSeparator />
              <DialogTrigger nativeButton={false} render={
                <DropdownMenuItem className="cursor-pointer">
                  <Shield className="mr-2 h-3.5 w-3.5" /> Manage Role
                </DropdownMenuItem>
              } />
              <DropdownMenuItem className="cursor-pointer">
                <UserCheck className="mr-2 h-3.5 w-3.5" /> Verify User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                <Ban className="mr-2 h-3.5 w-3.5" /> Suspend User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DialogContent className="sm:max-w-[425px] rounded-none">
            <DialogHeader>
              <DialogTitle className="font-light text-2xl tracking-tight">Manage Role</DialogTitle>
              <DialogDescription className="font-mono text-[10px] uppercase tracking-widest">
                Update role for {user.name} (@{user.username}).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 mt-2">
              <div className="grid gap-2">
                <Label htmlFor="role" className="font-mono text-xs uppercase tracking-widest text-neutral-500">Assign Role</Label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="flex h-10 w-full border border-neutral-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-none">
                  <option value="member">Member</option>
                  <option value="photographer">Photographer</option>
                  <option value="voyageur">Traveller (Customer)</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateRole} disabled={isUpdating} className="rounded-none w-full font-mono text-xs uppercase tracking-widest bg-neutral-900">
                {isUpdating ? 'Saving...' : 'Save Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
