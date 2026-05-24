'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Image as ImageIcon, Heart, Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AdminStatCard } from '@/components/admin/AdminStatCard';

export default function AdminDashboardPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient();
      const [photosRes, usersRes] = await Promise.all([
        supabase.from('photos').select('*, users!inner(username)').order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('created_at', { ascending: false })
      ]);
      if (photosRes.data) setPhotos(photosRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const PHOTOS = photos;
  const PHOTOGRAPHERS = users;

  const totalPhotos = PHOTOS.length;
  const totalUsers = PHOTOGRAPHERS.length;
  const totalLikes = PHOTOS.reduce((acc: number, p: any) => acc + (p.likes_count || 0), 0);

  // Recent uploads (last 4)
  const recentUploads = PHOTOS.slice(0, 4).map((p: any, i: number) => ({
    id: p.id,
    title: p.title,
    src: p.image_url || p.storage_url,
    by: p.users?.username || 'Unknown',
    status: p.is_approved ? 'Approved' : 'Pending'
  }));
  
  // Pending users (photographers waiting approval)
  const pendingUsers = PHOTOGRAPHERS.filter((u: any) => u.photographer_status === 'pending' || !u.is_customer).slice(0, 3).map((u: any) => ({
    username: u.username,
    name: u.display_name || u.username,
    avatar: u.avatar_url || 'https://via.placeholder.com/150'
  }));

  if (isLoading) {
    return <div className="p-12 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">Loading Dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight mb-2">Workspace Overview</h1>
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
            Season: Spring 2026 · Week 12
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="font-mono text-xs uppercase tracking-widest rounded-none bg-neutral-900 text-white hover:bg-neutral-800">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard 
          title="Total Users" 
          value={totalUsers.toLocaleString()} 
          trend="+12% from last month" 
          icon={Users} 
        />
        <AdminStatCard 
          title="Submitted Photos" 
          value={totalPhotos} 
          trend="+56 new this week" 
          icon={ImageIcon} 
        />
        <AdminStatCard 
          title="Total Pulses" 
          value={totalLikes.toLocaleString()} 
          trend="+19% from last month" 
          icon={Heart} 
        />
        <AdminStatCard 
          title="Page Views" 
          value="84.2K" 
          trend="+5% from last week" 
          icon={Eye} 
        />
      </div>

      {/* Grid Layout for Lists */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Recent Uploads Section */}
        <div className="lg:col-span-4 border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 p-4 bg-neutral-50">
            <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-neutral-900">Recent Uploads</h2>
            <Link href="/admin/photos" className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-neutral-100">
            {recentUploads.map((photo) => (
              <div key={photo.id} className="flex items-center gap-4 p-4 hover:bg-neutral-50/50 transition-colors">
                <div className="h-12 w-16 bg-neutral-100 overflow-hidden border border-neutral-200 shrink-0">
                  <img src={photo.src} alt={photo.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <Link href={`/photo/${photo.id}`} className="font-medium text-sm leading-none mb-1 truncate hover:underline">
                    "{photo.title}"
                  </Link>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                    BY @{photo.by}
                  </span>
                </div>
                <div className="shrink-0">
                  <Badge variant="outline" className={`rounded-none px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest ${
                    photo.status === 'Approved' ? 'border-neutral-300 text-neutral-700 bg-neutral-50' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }`}>
                    {photo.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals Section */}
        <div className="lg:col-span-3 border border-neutral-200 bg-white flex flex-col">
          <div className="flex items-center justify-between border-b border-neutral-200 p-4 bg-neutral-50">
            <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-neutral-900">Account Approvals</h2>
            <Link href="/admin/users" className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-neutral-100 flex-1">
            {pendingUsers.map((user) => (
              <div key={user.username} className="flex items-center gap-4 p-4 hover:bg-neutral-50/50 transition-colors">
                <div className="h-10 w-10 bg-neutral-100 overflow-hidden border border-neutral-200 shrink-0">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover grayscale opacity-80" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <Link href={`/photographer/${user.username}`} className="font-medium text-sm leading-none mb-1 truncate hover:underline">
                    {user.name}
                  </Link>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                    @{user.username}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="h-7 rounded-none font-mono text-[10px] uppercase tracking-widest border-neutral-300">
                  Review
                </Button>
              </div>
            ))}
            
            {/* Call to action padding if list is short */}
            <div className="p-4 mt-auto">
              <Button className="w-full rounded-none font-mono text-xs uppercase tracking-widest bg-neutral-100 text-neutral-900 hover:bg-neutral-200">
                View All Pending Users
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
