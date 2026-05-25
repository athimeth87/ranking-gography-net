'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Mail, Calendar, Settings2, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight mb-2">Settings</h1>
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
            Configure platform preferences, seasons, and notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="font-mono text-xs uppercase tracking-widest rounded-none bg-neutral-900 text-white hover:bg-neutral-800 gap-2">
            <Save className="h-3.5 w-3.5" /> Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full flex flex-col md:flex-row gap-8">
        <TabsList className="flex flex-row md:flex-col justify-start items-start w-full md:w-64 bg-transparent p-0 h-auto gap-2 border-b md:border-b-0 pb-4 md:pb-0 overflow-x-auto">
          <TabsTrigger value="general" className="w-full justify-start rounded-none font-mono text-xs uppercase tracking-widest data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none px-4 py-3 border-l-2 border-transparent data-[state=active]:border-neutral-900 data-[state=active]:text-neutral-900 text-neutral-500">
            <Globe className="h-4 w-4 mr-3" /> General
          </TabsTrigger>
          <TabsTrigger value="season" className="w-full justify-start rounded-none font-mono text-xs uppercase tracking-widest data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none px-4 py-3 border-l-2 border-transparent data-[state=active]:border-neutral-900 data-[state=active]:text-neutral-900 text-neutral-500">
            <Calendar className="h-4 w-4 mr-3" /> Active Season
          </TabsTrigger>
          <TabsTrigger value="notifications" className="w-full justify-start rounded-none font-mono text-xs uppercase tracking-widest data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none px-4 py-3 border-l-2 border-transparent data-[state=active]:border-neutral-900 data-[state=active]:text-neutral-900 text-neutral-500">
            <Mail className="h-4 w-4 mr-3" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="advanced" className="w-full justify-start rounded-none font-mono text-xs uppercase tracking-widest data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none px-4 py-3 border-l-2 border-transparent data-[state=active]:border-neutral-900 data-[state=active]:text-neutral-900 text-neutral-500">
            <Settings2 className="h-4 w-4 mr-3" /> Advanced
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 max-w-3xl">
          <TabsContent value="general" className="mt-0 outline-none">
            <div className="bg-white border border-neutral-200 p-8">
              <h2 className="text-xl font-light mb-6 tracking-tight">Platform Details</h2>
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="siteName" className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Site Name</Label>
                  <Input id="siteName" defaultValue="Gography Ranking" className="rounded-none border-neutral-300 h-10" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactEmail" className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Contact Email</Label>
                  <Input id="contactEmail" defaultValue="hello@gography.net" className="rounded-none border-neutral-300 h-10" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">SEO Description</Label>
                  <Textarea id="description" defaultValue="A photography ranking platform by photographers and travellers." className="rounded-none border-neutral-300 min-h-[100px] resize-none" />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="season" className="mt-0 outline-none">
            <div className="bg-white border border-neutral-200 p-8">
              <h2 className="text-xl font-light mb-6 tracking-tight">Season Configuration</h2>
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="seasonName" className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Active Season Name</Label>
                  <Input id="seasonName" defaultValue="Spring 2026" className="rounded-none border-neutral-300 h-10" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate" className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Start Date</Label>
                    <Input id="startDate" type="date" defaultValue="2026-03-01" className="rounded-none border-neutral-300 h-10 uppercase font-mono text-xs" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate" className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">End Date</Label>
                    <Input id="endDate" type="date" defaultValue="2026-06-30" className="rounded-none border-neutral-300 h-10 uppercase font-mono text-xs" />
                  </div>
                </div>
                <div className="pt-4 border-t border-neutral-100 mt-6">
                  <Button variant="outline" className="rounded-none font-mono text-xs uppercase tracking-widest text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                    Close Season Early
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 outline-none">
            <div className="bg-white border border-neutral-200 p-8">
              <h2 className="text-xl font-light mb-6 tracking-tight">Email & Alerts</h2>
              <p className="text-sm text-neutral-500 mb-6 font-mono tracking-wide leading-relaxed">
                SMTP and email delivery providers (e.g., Resend) are managed securely via environment variables on Vercel. 
                Use this section to test delivery configurations.
              </p>
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="testEmail" className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Test Email Recipient</Label>
                  <div className="flex gap-2">
                    <Input id="testEmail" type="email" placeholder="you@gography.net" className="rounded-none border-neutral-300 h-10" />
                    <Button variant="outline" className="rounded-none font-mono text-xs uppercase tracking-widest">
                      Send Test
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="mt-0 outline-none">
            <div className="bg-white border border-red-200 p-8">
              <h2 className="text-xl font-light text-red-600 mb-2 tracking-tight">Danger Zone</h2>
              <p className="text-sm text-neutral-500 mb-6 font-mono tracking-wide">
                These actions are irreversible. Proceed with extreme caution.
              </p>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-red-100 bg-red-50/30 gap-4">
                  <div>
                    <h3 className="font-medium text-sm">Purge Cache</h3>
                    <p className="text-xs text-neutral-500 font-mono mt-1">Clear all Redis/CDN cache globally.</p>
                  </div>
                  <Button variant="outline" className="rounded-none border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-mono text-xs uppercase tracking-widest shrink-0">
                    Clear Cache
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-red-100 bg-red-50/30 gap-4">
                  <div>
                    <h3 className="font-medium text-sm">Reset Database Stats</h3>
                    <p className="text-xs text-neutral-500 font-mono mt-1">Recalculate all likes and views from raw logs.</p>
                  </div>
                  <Button variant="outline" className="rounded-none border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-mono text-xs uppercase tracking-widest shrink-0">
                    Run Recalculation
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
