'use client';

import { usePathname } from 'next/navigation';
import { Slash, Sparkles, ExternalLink, Menu } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function AdminHeader() {
  const pathname = usePathname();
  
  // Quick breadcrumb logic
  const pathParts = pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 1 
    ? pathParts[1]!.charAt(0).toUpperCase() + pathParts[1]!.slice(1)
    : 'Overview';

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-neutral-200/60 bg-white/80 backdrop-blur-md px-4 sm:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile menu button (visual only for now) */}
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden -ml-2">
          <Menu className="h-4 w-4" />
        </Button>
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-900 hidden sm:inline-block">Gography</span>
          <Slash className="h-3.5 w-3.5 text-neutral-300 hidden sm:block" />
          <span className="text-neutral-900">{currentPage}</span>
        </div>
      </div>
      
      {/* Right side actions */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-full border border-neutral-200/50">
          <Sparkles className="h-3 w-3 text-yellow-500" />
          Season Active
        </div>
        <Link 
          href="/" 
          target="_blank" 
          className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Live Site <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </header>
  );
}
