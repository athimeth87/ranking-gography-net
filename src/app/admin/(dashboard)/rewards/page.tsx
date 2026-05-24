'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trophy, Gift, Target, Megaphone, Plus, Save } from 'lucide-react';
import { AdminPrizeCard } from '@/components/admin/AdminPrizeCard';

export default function AdminRewardsPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight mb-2">Points & Rewards</h1>
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
            Manage gamification rules, point allocation, and season prizes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="font-mono text-xs uppercase tracking-widest rounded-none bg-neutral-900 text-white hover:bg-neutral-800 gap-2">
            <Save className="h-3.5 w-3.5" /> Save Rules
          </Button>
        </div>
      </div>

      <Tabs defaultValue="points" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <TabsList className="rounded-none bg-neutral-100 p-1 h-auto">
            <TabsTrigger value="points" className="rounded-none font-mono text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2">
              <Target className="h-3 w-3" /> Point System
            </TabsTrigger>
            <TabsTrigger value="prizes" className="rounded-none font-mono text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2">
              <Gift className="h-3 w-3" /> Season Prizes
            </TabsTrigger>
            <TabsTrigger value="winners" className="rounded-none font-mono text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 flex items-center gap-2">
              <Trophy className="h-3 w-3" /> Announce Winners
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. Point System Tab */}
        <TabsContent value="points" className="mt-0 outline-none">
          <div className="bg-white border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
              <h2 className="text-lg font-medium mb-1">Point Allocation Rules</h2>
              <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Configure how users earn points</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Uploads & Content */}
              <div className="space-y-6">
                <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-neutral-900 border-b pb-2">Content Creation</h3>
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm">Photo Upload (Approved)</Label>
                  <Input type="number" defaultValue="50" className="w-24 rounded-none h-8 font-mono text-right" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm">Admin's Choice (Editor Pick)</Label>
                  <Input type="number" defaultValue="200" className="w-24 rounded-none h-8 font-mono text-right text-yellow-600" />
                </div>
              </div>

              {/* Engagement */}
              <div className="space-y-6">
                <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-neutral-900 border-b pb-2">Engagement & Social</h3>
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm">Receive a Like (from user)</Label>
                  <Input type="number" defaultValue="5" className="w-24 rounded-none h-8 font-mono text-right" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm">Give a Like (Daily Cap: 10)</Label>
                  <Input type="number" defaultValue="1" className="w-24 rounded-none h-8 font-mono text-right" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm">Receive a Comment</Label>
                  <Input type="number" defaultValue="10" className="w-24 rounded-none h-8 font-mono text-right" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. Prizes Tab */}
        <TabsContent value="prizes" className="mt-0 outline-none">
          <div className="bg-white border border-neutral-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-medium mb-1">Current Season Prizes</h2>
                <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Spring 2026 Season Rewards</p>
              </div>
              <Button variant="outline" className="font-mono text-xs uppercase tracking-widest rounded-none border-neutral-300 gap-2">
                <Plus className="h-3 w-3" /> Add Prize
              </Button>
            </div>

            <div className="grid gap-4">
              <AdminPrizeCard 
                rank="Rank #1 (Grand Prize)"
                title="Free Trip to GOGRAPHY Exclusive Route"
                description="Includes flight, accommodation, and private photography session."
                icon={Trophy}
                variant="grand"
              />
              <AdminPrizeCard 
                rank="Rank #2 - #5"
                title="GOGRAPHY Ambassador Kit + Camera Strap"
                description="Official merchandise and automatic Ambassador status."
                icon={Gift}
                variant="runner"
              />
            </div>
          </div>
        </TabsContent>

        {/* 3. Announce Winners Tab */}
        <TabsContent value="winners" className="mt-0 outline-none">
          <div className="bg-white border border-neutral-200 flex flex-col md:flex-row">
            <div className="p-8 md:w-1/2 border-b md:border-b-0 md:border-r border-neutral-100">
              <div className="h-12 w-12 bg-blue-100 flex items-center justify-center rounded-full mb-6">
                <Megaphone className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-light tracking-tight mb-2">End Season & Announce</h2>
              <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                This action will lock the current leaderboard, freeze all point generation for the season, and automatically send congratulatory emails to the top-ranked photographers.
              </p>
              
              <div className="bg-neutral-50 p-4 border border-neutral-200 mb-6 font-mono text-xs">
                <div className="flex justify-between mb-2">
                  <span className="text-neutral-500">Current Leader:</span>
                  <span className="font-bold text-neutral-900">@kanthorn (12,450 pts)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Total Participants:</span>
                  <span className="text-neutral-900">1,204</span>
                </div>
              </div>

              <Label className="flex items-center gap-2 text-sm cursor-pointer mb-6">
                <input type="checkbox" className="rounded-none border-neutral-300 text-neutral-900 focus:ring-neutral-900" />
                I confirm that the season is officially over.
              </Label>

              <Button className="w-full rounded-none bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs uppercase tracking-widest h-12">
                Broadcast Winners
              </Button>
            </div>
            <div className="p-8 md:w-1/2 bg-neutral-50">
              <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-neutral-900 mb-4">Email Preview</h3>
              <div className="bg-white border border-neutral-200 p-6 shadow-sm">
                <div className="border-b border-neutral-100 pb-4 mb-4">
                  <p className="text-xs text-neutral-400 font-mono mb-1">SUBJECT</p>
                  <p className="font-medium">🎉 Congratulations! You've won the GOGRAPHY Spring 2026 Awards</p>
                </div>
                <div className="prose prose-sm text-neutral-600">
                  <p>Hi [Photographer Name],</p>
                  <p>The votes have been tallied, the Pulse algorithms have settled, and we are thrilled to announce that your portfolio has reached the top of the leaderboard!</p>
                  <p>Our team will be in touch shortly regarding your prize claiming process.</p>
                  <p className="mt-8 font-mono text-xs uppercase tracking-widest text-neutral-400">— GOGRAPHY Editorial Team</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
