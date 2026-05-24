'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Users, 
  Settings, 
  LogOut,
  ShieldCheck,
  Trophy,
  Search,
  ChevronsUpDown,
  Command,
  Bell,
  Megaphone,
  ClipboardList,
  LayoutTemplate
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AdminCommandMenu } from '@/components/admin/AdminCommandMenu';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Photos & Gallery', href: '/admin/photos', icon: ImageIcon, badge: '12 New' },
    ]
  },
  {
    label: 'Management',
    items: [
      { name: 'Users & Roles', href: '/admin/users', icon: Users },
      { name: 'Admin Team', href: '/admin/admins', icon: ShieldCheck },
      { name: 'Customer Whitelist', href: '/admin/customers', icon: ClipboardList },
      { name: 'Ads & Popups', href: '/admin/popups', icon: Megaphone, badge: 'Campaigns' },
    ]
  },
  {
    label: 'System',
    items: [
      { name: 'Site Content', href: '/admin/content', icon: LayoutTemplate },
      { name: 'Points & Rewards', href: '/admin/rewards', icon: Trophy },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [openCommand, setOpenCommand] = useState(false);

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-72 flex-col bg-[#FDFDFD] border-r border-neutral-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all">
      
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-neutral-200/60">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="flex h-7 w-7 items-center justify-center bg-neutral-900 text-white rounded-sm shadow-sm transition-transform group-hover:scale-105">
            <span className="font-bold text-xs font-mono">G</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold tracking-tight text-sm leading-none text-neutral-900">GOGRAPHY</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 mt-0.5 font-medium">Workspace</span>
          </div>
        </Link>
        <button className="h-7 w-7 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors">
          <Bell className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Global Search Hint */}
      <div className="px-4 py-4">
        <button 
          onClick={() => setOpenCommand(true)}
          className="w-full flex items-center justify-between px-3 py-2 bg-white border border-neutral-200 shadow-sm rounded-md text-sm text-neutral-500 hover:border-neutral-300 hover:text-neutral-900 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600" />
            <span className="font-medium text-xs">Search...</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="inline-flex h-5 items-center gap-1 rounded bg-neutral-100 px-1.5 font-mono text-[10px] font-medium text-neutral-500 border border-neutral-200">
              <Command className="h-3 w-3" />
              <span>K</span>
            </kbd>
          </div>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <div className="mb-2 px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400/80">
              {group.label}
            </div>
            <nav className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-md'
                        : 'text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-700'
                      }`} />
                      <span className={isActive ? 'font-semibold tracking-wide' : 'tracking-wide'}>
                        {item.name}
                      </span>
                    </div>
                    {item.badge && (
                      <Badge variant="secondary" className={`h-5 px-1.5 text-[9px] uppercase tracking-wider rounded-sm font-mono border-0 ${
                        isActive 
                          ? 'bg-white/20 text-white hover:bg-white/30' 
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {item.badge}
                      </Badge>
                    )}
                    
                    {/* Active Indicator Line */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-white rounded-r-sm" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Footer Context */}
      <div className="mt-auto p-4 bg-neutral-50/50 border-t border-neutral-200/60">
        <Link href="/admin/profile" className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-200 transition-all group">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-9 w-9 border border-neutral-200 shadow-sm group-hover:border-neutral-300 transition-colors">
                <AvatarImage src="https://ui.shadcn.com/avatars/01.png" alt="Admin" />
                <AvatarFallback className="bg-neutral-900 text-white font-mono text-xs">AD</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold text-neutral-900 leading-none">John Editor</span>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-1">Superadmin</span>
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600" />
        </Link>
        
        <Link
          href="/"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-[11px] font-mono font-medium uppercase tracking-widest text-neutral-500 border border-neutral-200 bg-white transition-all hover:bg-neutral-100 hover:text-neutral-900 shadow-sm"
        >
          <LogOut className="h-3.5 w-3.5" />
          Exit Workspace
        </Link>
      </div>
      
      <AdminCommandMenu open={openCommand} setOpen={setOpenCommand} />
    </aside>
  );
}
