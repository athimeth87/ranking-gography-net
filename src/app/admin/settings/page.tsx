'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Mail, Calendar, Settings2, Globe, LayoutTemplate } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [voySettings, setVoySettings] = useState({
    title: 'Travelled with us?\\nBecome a Voyageur',
    description: 'Customers who have travelled with GOGRAPHY earn Voyageur status — eligible to submit photos in a customer-only category. Each season the winner receives a 50,000 THB voucher, and the top 10 receive cashback on their next trip.',
    reward1_amount: '50,000 THB',
    reward1_label: 'VOUCHER',
    reward1_sub: 'ต่อหมวด',
    reward2_amount: '3-15%',
    reward2_label: 'CASHBACK',
    reward2_sub: 'TOP 10',
    image_url: ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.from('site_settings').select('value').eq('id', 'voyageurs_section').single();
      if (data?.value) {
        setVoySettings({ ...voySettings, ...data.value });
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = getSupabaseBrowserClient();
    let finalSettings = { ...voySettings };

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `voyageur-featured-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('photos').upload(fileName, imageFile);
      if (!error) {
        const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
        finalSettings.image_url = data.publicUrl;
      }
    }

    await supabase.from('site_settings').upsert({ id: 'voyageurs_section', value: finalSettings });
    setVoySettings(finalSettings);
    setImageFile(null);
    setIsSaving(false);
    alert('Settings saved!');
  };
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
          <Button 
            className="font-mono text-xs uppercase tracking-widest rounded-none bg-neutral-900 text-white hover:bg-neutral-800 gap-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-3.5 w-3.5" /> {isSaving ? 'Saving...' : 'Save Changes'}
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
          <TabsTrigger value="content" className="w-full justify-start rounded-none font-mono text-xs uppercase tracking-widest data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none px-4 py-3 border-l-2 border-transparent data-[state=active]:border-neutral-900 data-[state=active]:text-neutral-900 text-neutral-500">
            <LayoutTemplate className="h-4 w-4 mr-3" /> Home Content
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 max-w-3xl">
          <TabsContent value="general" className="mt-0 outline-none">
            <div className="bg-white border border-neutral-200 p-8">
              <h2 className="text-xl font-light mb-6 tracking-tight">Platform Details</h2>
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="siteName" className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Site Name</Label>
                  <Input id="siteName" defaultValue="Gography Photo Awards" className="rounded-none border-neutral-300 h-10" />
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
          <TabsContent value="content" className="mt-0 outline-none">
            <div className="bg-white border border-neutral-200 p-8">
              <h2 className="text-xl font-light mb-6 tracking-tight">Homepage Content (Voyageurs Section)</h2>
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Section Title</Label>
                  <Textarea 
                    value={voySettings.title} 
                    onChange={e => setVoySettings({...voySettings, title: e.target.value})}
                    className="rounded-none border-neutral-300 h-20" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Description</Label>
                  <Textarea 
                    value={voySettings.description} 
                    onChange={e => setVoySettings({...voySettings, description: e.target.value})}
                    className="rounded-none border-neutral-300 h-32" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Featured Image</Label>
                  {voySettings.image_url && (
                    <img src={voySettings.image_url} alt="Current featured" className="w-48 h-48 object-cover mb-2 border border-neutral-200" />
                  )}
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                    className="rounded-none border-neutral-300" 
                  />
                  <p className="text-xs text-neutral-500">Select a new image to replace the current one. Recommended aspect ratio 4:5.</p>
                </div>
                
                <h3 className="text-sm font-medium mt-8 border-b pb-2">Reward Box 1</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Amount</Label>
                    <Input value={voySettings.reward1_amount} onChange={e => setVoySettings({...voySettings, reward1_amount: e.target.value})} />
                  </div>
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input value={voySettings.reward1_label} onChange={e => setVoySettings({...voySettings, reward1_label: e.target.value})} />
                  </div>
                  <div>
                    <Label className="text-xs">Sub-text</Label>
                    <Input value={voySettings.reward1_sub} onChange={e => setVoySettings({...voySettings, reward1_sub: e.target.value})} />
                  </div>
                </div>

                <h3 className="text-sm font-medium mt-8 border-b pb-2">Reward Box 2</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Amount</Label>
                    <Input value={voySettings.reward2_amount} onChange={e => setVoySettings({...voySettings, reward2_amount: e.target.value})} />
                  </div>
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input value={voySettings.reward2_label} onChange={e => setVoySettings({...voySettings, reward2_label: e.target.value})} />
                  </div>
                  <div>
                    <Label className="text-xs">Sub-text</Label>
                    <Input value={voySettings.reward2_sub} onChange={e => setVoySettings({...voySettings, reward2_sub: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
