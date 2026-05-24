'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function GlobalPopup() {
  const [popup, setPopup] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchAndCheckPopup = async () => {
      const supabase = getSupabaseBrowserClient();
      
      // Fetch active popups
      const { data: campaigns } = await supabase
        .from('popup_campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1); // For now, we just pick the latest active one

      if (!campaigns || campaigns.length === 0) return;
      
      const activePopup = campaigns[0];

      // Frequency check using localStorage
      const storageKey = `popup_seen_${activePopup.id}`;
      const lastSeen = localStorage.getItem(storageKey);
      
      if (activePopup.frequency === 'once_session' && sessionStorage.getItem(storageKey)) {
        return; // Already seen in this session
      }
      
      if (activePopup.frequency === 'once_day' && lastSeen) {
        const hoursSinceLastSeen = (Date.now() - parseInt(lastSeen)) / (1000 * 60 * 60);
        if (hoursSinceLastSeen < 24) return; // Seen within 24 hours
      }

      // Audience check
      const { data: { user } } = await supabase.auth.getUser();
      if (activePopup.audience === 'logged_in' && !user) return;
      if (activePopup.audience === 'guest' && user) return;

      // Passed all checks! Show the popup
      setPopup(activePopup);
      setIsOpen(true);

      // Record impressions
      if (activePopup.frequency === 'once_session') sessionStorage.setItem(storageKey, 'true');
      if (activePopup.frequency === 'once_day' || activePopup.frequency === 'always') {
        localStorage.setItem(storageKey, Date.now().toString());
      }

      await supabase.rpc('increment_popup_stat', {
        campaign_id: activePopup.id,
        stat_type: 'impression'
      });
    };

    // Small delay to not block initial render
    const timer = setTimeout(fetchAndCheckPopup, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleImageClick = async () => {
    if (!popup) return;
    
    // Record click
    const supabase = getSupabaseBrowserClient();
    await supabase.rpc('increment_popup_stat', {
      campaign_id: popup.id,
      stat_type: 'click'
    });

    setIsOpen(false);
    
    if (popup.target_url) {
      window.open(popup.target_url, '_blank');
    }
  };

  if (!popup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[400px] w-[90vw] p-0 border-0 bg-transparent shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] [&>button]:hidden rounded-3xl overflow-hidden" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{popup.name}</DialogTitle>
        <DialogDescription className="sr-only">Promotional campaign banner</DialogDescription>

        <div className="relative flex w-full h-auto animate-in fade-in zoom-in-95 duration-500 ease-out group">
          
          {/* Image - Scales to fit perfectly */}
          <img 
            src={popup.image_url} 
            alt={popup.name} 
            className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.02]"
          />

          {/* Close Button - Glassmorphism */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 z-50 text-white/90 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-md transition-colors p-2 rounded-full shadow-md"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>

          {/* Clickable Area Overlay */}
          {popup.target_url && (
            <div 
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={handleImageClick}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
