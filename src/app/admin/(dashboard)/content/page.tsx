'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, LayoutTemplate, Image as ImageIcon, UploadCloud, Type, Trophy, Crown } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AdminContentPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  
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
  
  const [heroSettings, setHeroSettings] = useState({
    headline: 'Photographs<br />that tell stories',
    description: 'A photography ranking platform by photographers and travellers — vote, discover, and help choose the photo of the season.',
    image_url: ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const [voyRes, heroRes] = await Promise.all([
        supabase.from('site_settings').select('value').eq('id', 'voyageurs_section').single(),
        supabase.from('site_settings').select('value').eq('id', 'hero_section').single()
      ]);
      
      if (voyRes.data?.value) {
        setVoySettings(prev => ({ ...prev, ...voyRes.data.value }));
      }
      if (heroRes.data?.value) {
        setHeroSettings(prev => ({ ...prev, ...heroRes.data.value }));
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setIsSaving(false); return; }
    let finalSettings = { ...voySettings };
    let finalHeroSettings = { ...heroSettings };

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `voyageur-featured-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('photos').upload(fileName, imageFile);
      if (error) {
        alert('Failed to upload Voyageurs image: ' + error.message);
        setIsSaving(false);
        return;
      }
      const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
      finalSettings.image_url = data.publicUrl;
    } else if (voySettings.image_url && voySettings.image_url.startsWith('blob:')) {
      alert("Error: Missing file for image upload.");
      setIsSaving(false);
      return;
    }

    if (heroImageFile) {
      const fileExt = heroImageFile.name.split('.').pop();
      const fileName = `hero-banner-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('photos').upload(fileName, heroImageFile);
      if (error) {
        alert('Failed to upload Hero image: ' + error.message);
        setIsSaving(false);
        return;
      }
      const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
      finalHeroSettings.image_url = data.publicUrl;
    } else if (heroSettings.image_url && heroSettings.image_url.startsWith('blob:')) {
      alert("Error: Missing file for Hero image upload.");
      setIsSaving(false);
      return;
    }

    await supabase.from('site_settings').upsert([
      { id: 'voyageurs_section', value: finalSettings },
      { id: 'hero_section', value: finalHeroSettings }
    ]);
    
    setVoySettings(finalSettings);
    setHeroSettings(finalHeroSettings);
    setImageFile(null);
    setHeroImageFile(null);
    setIsSaving(false);
    alert('Content saved successfully!');
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-1">Site Content</h1>
          <p className="text-neutral-500 text-sm">
            Manage text and images for the public homepage sections
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="rounded-full px-6 bg-black text-white hover:bg-neutral-800 transition-all shadow-md shadow-black/5"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl space-y-10">
        {/* HERO SECTION */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
          <div className="bg-neutral-50/50 px-8 py-5 border-b border-neutral-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-neutral-200/50">
              <LayoutTemplate className="text-neutral-700 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Hero Section</h2>
              <p className="text-xs text-neutral-500 mt-0.5">The main banner at the top of the homepage</p>
            </div>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid gap-3">
              <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-2"><Type className="w-3.5 h-3.5"/> Headline</Label>
              <Textarea 
                value={heroSettings.headline} 
                onChange={e => setHeroSettings({...heroSettings, headline: e.target.value})}
                className="rounded-xl border-neutral-200 focus-visible:ring-black h-24 text-base resize-none bg-neutral-50/50" 
              />
              <p className="text-[11px] text-neutral-400">Use &lt;br /&gt; for line breaks.</p>
            </div>
            <div className="grid gap-3">
              <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-2"><Type className="w-3.5 h-3.5"/> Description</Label>
              <Textarea 
                value={heroSettings.description} 
                onChange={e => setHeroSettings({...heroSettings, description: e.target.value})}
                className="rounded-xl border-neutral-200 focus-visible:ring-black h-24 text-sm resize-none bg-neutral-50/50" 
              />
            </div>
            <div className="grid gap-3 pt-4 border-t border-neutral-100">
              <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5"/> Banner Background Image</Label>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative w-full sm:w-64 aspect-[21/9] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 group">
                  {heroSettings.image_url ? (
                    <>
                      <img src={heroSettings.image_url} alt="Current banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <UploadCloud className="text-white w-6 h-6" />
                      </div>
                    </>
                  ) : (
                    <ImageIcon className="w-8 h-8 text-neutral-300" />
                  )}
                  {/* Hidden file input stretching over the image area */}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setHeroImageFile(e.target.files[0]);
                        // Local preview
                        const url = URL.createObjectURL(e.target.files[0]);
                        setHeroSettings({...heroSettings, image_url: url});
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-neutral-900">Upload a new image</p>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">Click the image area to select a new background. Recommended landscape ratio (e.g. 1920x800) in JPG or WEBP format for optimal loading speed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VOYAGEURS SECTION */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
          <div className="bg-amber-50/50 px-8 py-5 border-b border-amber-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-amber-200/60">
              <Crown className="text-amber-500 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-amber-900">Voyageurs Section</h2>
              <p className="text-xs text-amber-700/70 mt-0.5">Exclusive content and rewards for past customers</p>
            </div>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid gap-3">
              <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-2"><Type className="w-3.5 h-3.5"/> Section Title</Label>
              <Textarea 
                value={voySettings.title} 
                onChange={e => setVoySettings({...voySettings, title: e.target.value})}
                className="rounded-xl border-neutral-200 focus-visible:ring-black h-20 text-base resize-none bg-neutral-50/50" 
              />
            </div>
            <div className="grid gap-3">
              <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-2"><Type className="w-3.5 h-3.5"/> Description</Label>
              <Textarea 
                value={voySettings.description} 
                onChange={e => setVoySettings({...voySettings, description: e.target.value})}
                className="rounded-xl border-neutral-200 focus-visible:ring-black h-28 text-sm resize-none bg-neutral-50/50" 
              />
            </div>
            
            <div className="grid gap-3 pt-4 border-t border-neutral-100">
              <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5"/> Featured Image</Label>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative w-40 aspect-[4/5] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 group">
                  {voySettings.image_url ? (
                    <>
                      <img src={voySettings.image_url} alt="Current featured" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <UploadCloud className="text-white w-6 h-6" />
                      </div>
                    </>
                  ) : (
                    <ImageIcon className="w-8 h-8 text-neutral-300" />
                  )}
                  {/* Hidden file input stretching over the image area */}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                        // Local preview
                        const url = URL.createObjectURL(e.target.files[0]);
                        setVoySettings({...voySettings, image_url: url});
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-neutral-900">Upload promotional photo</p>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">Click the image area to select a new featured photo. Recommended aspect ratio 4:5 (portrait).</p>
                </div>
              </div>
            </div>
            
            <div className="pt-8 border-t border-neutral-100">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-neutral-900">Rewards Configuration</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reward Box 1 */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Reward Box 1</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs mb-1.5 block text-neutral-600">Amount (e.g. 50,000 THB)</Label>
                      <Input value={voySettings.reward1_amount} onChange={e => setVoySettings({...voySettings, reward1_amount: e.target.value})} className="rounded-lg bg-white h-9" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block text-neutral-600">Label (e.g. VOUCHER)</Label>
                      <Input value={voySettings.reward1_label} onChange={e => setVoySettings({...voySettings, reward1_label: e.target.value})} className="rounded-lg bg-white h-9" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block text-neutral-600">Sub-text (e.g. ต่อหมวด)</Label>
                      <Input value={voySettings.reward1_sub} onChange={e => setVoySettings({...voySettings, reward1_sub: e.target.value})} className="rounded-lg bg-white h-9" />
                    </div>
                  </div>
                </div>

                {/* Reward Box 2 */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Reward Box 2</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs mb-1.5 block text-neutral-600">Amount (e.g. 3-15%)</Label>
                      <Input value={voySettings.reward2_amount} onChange={e => setVoySettings({...voySettings, reward2_amount: e.target.value})} className="rounded-lg bg-white h-9" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block text-neutral-600">Label (e.g. CASHBACK)</Label>
                      <Input value={voySettings.reward2_label} onChange={e => setVoySettings({...voySettings, reward2_label: e.target.value})} className="rounded-lg bg-white h-9" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block text-neutral-600">Sub-text (e.g. TOP 10)</Label>
                      <Input value={voySettings.reward2_sub} onChange={e => setVoySettings({...voySettings, reward2_sub: e.target.value})} className="rounded-lg bg-white h-9" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
