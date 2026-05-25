'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Image as ImageIcon, Link as LinkIcon, Loader2, UploadCloud, CheckCircle } from 'lucide-react';
import { AdminPopupRow } from '@/components/admin/AdminPopupRow';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AdminPopupsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [popups, setPopups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [audience, setAudience] = useState('all');
  const [frequency, setFrequency] = useState('once_session');
  const [isActive, setIsActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPopups = async () => {
    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('popup_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPopups(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  const handleEdit = (popup: any) => {
    setEditingId(popup.id);
    setName(popup.name);
    setImageUrl(popup.image_url);
    setTargetUrl(popup.target_url || '');
    setAudience(popup.audience);
    setFrequency(popup.frequency);
    setIsActive(popup.status === 'active');
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setImageUrl('');
    setTargetUrl('');
    setAudience('all');
    setFrequency('once_session');
    setIsActive(false);
    setIsOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("You must be logged in to upload images.");
      setIsUploading(false);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/popups/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath);
      setImageUrl(publicUrl);
    }
    
    setIsUploading(false);
  };

  const handleSaveCampaign = async () => {
    if (!name || !imageUrl) return alert('Name and Image URL are required!');
    
    setIsSaving(true);
    const supabase = getSupabaseBrowserClient();
    
    // Check user to set created_by
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      name,
      image_url: imageUrl,
      target_url: targetUrl || null,
      audience,
      frequency,
      status: isActive ? 'active' : 'draft',
    };

    let error;

    if (editingId) {
      const { error: updateError } = await supabase
        .from('popup_campaigns')
        .update(payload)
        .eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('popup_campaigns')
        .insert({
          ...payload,
          created_by: user?.id
        });
      error = insertError;
    }

    setIsSaving(false);
    if (!error) {
      resetForm();
      fetchPopups();
    } else {
      alert('Error saving campaign: ' + error.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.from('popup_campaigns').update({ status: newStatus }).eq('id', id);
    fetchPopups();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    const supabase = getSupabaseBrowserClient();
    await supabase.from('popup_campaigns').delete().eq('id', id);
    fetchPopups();
  };

  const filteredPopups = popups.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight mb-2">Popup Campaigns</h1>
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
            Manage promotional popups, banners, and advertisements
          </p>
        </div>
        
        {/* Create Campaign Dialog */}
        <Dialog open={isOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          else setIsOpen(true);
        }}>
          {/* @ts-ignore */}
          <DialogTrigger asChild>
            <Button className="font-mono text-xs uppercase tracking-widest rounded-none bg-neutral-900 text-white hover:bg-neutral-800 gap-2">
              <Plus className="h-3.5 w-3.5" /> Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-none p-0 overflow-hidden">
            <div className="bg-neutral-900 p-6 text-white">
              <DialogTitle className="font-light text-2xl tracking-tight">
                {editingId ? 'Edit Campaign' : 'New Popup Campaign'}
              </DialogTitle>
              <DialogDescription className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mt-2">
                Configure your advertisement banner and targeting rules
              </DialogDescription>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-6">
                
                {/* General */}
                <div className="space-y-4">
                  <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-neutral-900 border-b pb-2">General Info</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-mono uppercase tracking-widest text-neutral-500">Campaign Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. Summer Photo Contest 2026" 
                      className="rounded-none border-neutral-300" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Creative */}
                <div className="space-y-4">
                  <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-neutral-900 border-b pb-2">Creative (Image)</h3>
                  
                  <div 
                    className={`border-2 border-dashed ${imageUrl ? 'border-green-500 bg-green-50' : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100'} p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      onChange={handleImageUpload}
                    />
                    
                    {isUploading ? (
                      <>
                        <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                          <Loader2 className="h-5 w-5 text-neutral-900 animate-spin" />
                        </div>
                        <p className="text-sm font-medium mb-1">Uploading image...</p>
                      </>
                    ) : imageUrl ? (
                      <>
                        <div className="absolute inset-0 w-full h-full p-2 opacity-20">
                          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <p className="text-sm font-medium text-green-800 mb-1">Image Uploaded Successfully</p>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-green-700">Click to change image</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                          <UploadCloud className="h-5 w-5 text-neutral-400" />
                        </div>
                        <p className="text-sm font-medium mb-1">Click to upload banner image</p>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Recommended: 800x600px (JPG/PNG)</p>
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="url" className="text-xs font-mono uppercase tracking-widest text-neutral-500">Target URL (On Click)</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                      <Input 
                        id="url" 
                        placeholder="https://gography.net/contest" 
                        className="rounded-none pl-10 border-neutral-300" 
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Display Rules */}
                <div className="space-y-4">
                  <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-neutral-900 border-b pb-2">Display Rules</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="audience" className="text-xs font-mono uppercase tracking-widest text-neutral-500">Target Audience</Label>
                      <select 
                        id="audience" 
                        className="flex h-10 w-full border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 rounded-none"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                      >
                        <option value="all">All Visitors</option>
                        <option value="logged_in">Only Logged-in Users</option>
                        <option value="guest">Only Guest Users (Not Logged in)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="frequency" className="text-xs font-mono uppercase tracking-widest text-neutral-500">Frequency</Label>
                      <select 
                        id="frequency" 
                        className="flex h-10 w-full border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 rounded-none"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                      >
                        <option value="once_session">Once per session</option>
                        <option value="always">Every time (Aggressive)</option>
                        <option value="once_day">Once per day</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border p-4 bg-neutral-50">
                    <div>
                      <Label className="text-sm font-medium">Activate Campaign</Label>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mt-1">Set live immediately upon saving</p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>

                </div>

              </div>
            </div>
            
            <DialogFooter className="p-4 bg-neutral-50 border-t">
              <Button variant="outline" className="rounded-none font-mono text-xs uppercase tracking-widest" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveCampaign} disabled={isSaving || !name || !imageUrl} className="rounded-none font-mono text-xs uppercase tracking-widest bg-neutral-900">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-2">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
          <Input 
            type="text" 
            placeholder="Search campaigns..." 
            className="pl-9 rounded-none border-neutral-300 h-9 font-mono text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-mono text-[10px] uppercase tracking-widest rounded-none border-neutral-300 h-9">
            Filter: All Status
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-neutral-200 bg-white">
        <div className="grid grid-cols-[80px_1fr_100px_120px_120px_180px_60px] gap-4 p-4 border-b border-neutral-200 bg-neutral-50 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          <div className="text-center">Preview</div>
          <div>Campaign Name</div>
          <div className="text-center">Status</div>
          <div className="text-right">Impressions</div>
          <div className="text-right">Clicks (CTR)</div>
          <div className="text-center">Schedule</div>
          <div className="text-right">Action</div>
        </div>

        <div className="flex flex-col divide-y divide-neutral-100">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-neutral-500 font-mono uppercase tracking-widest">Loading campaigns...</div>
          ) : filteredPopups.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500 font-mono uppercase tracking-widest">No campaigns found</div>
          ) : (
            filteredPopups.map((popup) => (
              <AdminPopupRow 
                key={popup.id} 
                popup={popup} 
                onStatusChange={handleStatusChange} 
                onDelete={handleDelete} 
                onEdit={handleEdit}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
