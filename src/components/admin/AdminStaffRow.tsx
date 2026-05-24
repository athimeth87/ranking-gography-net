import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, Ban, Mail } from 'lucide-react';

interface StaffProps {
  name: string;
  username: string;
  avatar: string;
  role: string;
  joined?: string;
  status?: string;
}

export function AdminStaffRow({ user }: { user: StaffProps }) {
  return (
    <div className="grid grid-cols-[auto_1fr_1fr_120px_120px_60px] gap-4 p-4 items-center transition-colors hover:bg-neutral-50/50 group">
      
      {/* Avatar */}
      <div className="w-12 h-12 bg-neutral-100 overflow-hidden rounded-none border border-neutral-200">
        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-300" />
      </div>

      {/* Profile Details */}
      <div className="flex flex-col">
        <span className="font-medium text-sm leading-none mb-1">{user.name}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 flex items-center gap-1">
          <Mail className="h-3 w-3" /> {user.username}@gography.net
        </span>
      </div>

      {/* Role */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`rounded-none px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest ${
          user.role === 'Superadmin' 
            ? 'border-blue-600/30 text-blue-700 bg-blue-50'
            : 'border-purple-600/30 text-purple-700 bg-purple-50'
        }`}>
          <Shield className="h-2 w-2 mr-1 inline-block" />
          {user.role}
        </Badge>
      </div>

      {/* Joined */}
      <div className="font-mono text-[10px] text-neutral-500 text-center tracking-wider">
        {user.joined || '2026-01-01'}
      </div>

      {/* Status */}
      <div className="flex justify-center">
        <Badge variant="outline" className={`rounded-none px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest ${
          user.status === 'Pending' 
            ? 'border-yellow-600/30 text-yellow-700 bg-yellow-50' 
            : 'border-green-600/30 text-green-700 bg-green-50'
        }`}>
          {user.status || 'Active'}
        </Badge>
      </div>

      {/* Actions */}
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-none hover:bg-neutral-200">
              <MoreHorizontal className="h-4 w-4 text-neutral-500" />
            </Button>
          } />
          <DropdownMenuContent align="end" className="rounded-none font-mono text-xs uppercase tracking-wider min-w-[160px]">
            <DropdownMenuItem className="cursor-pointer">
              <Shield className="mr-2 h-3.5 w-3.5" /> Edit Role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
              <Ban className="mr-2 h-3.5 w-3.5" /> Revoke Access
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
