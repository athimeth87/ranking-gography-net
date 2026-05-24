'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has already accepted or declined cookies
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Small delay so it doesn't flash immediately on load
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 pointer-events-none flex justify-center md:justify-start">
      <div className="pointer-events-auto w-full max-w-[420px] bg-white border border-neutral-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-2xl p-5 md:p-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
            <Cookie className="h-5 w-5 text-neutral-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900 mb-1.5 text-[15px]">We value your privacy</h3>
            <p className="text-sm text-neutral-500 leading-relaxed mb-5">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={handleAccept}
                className="flex-1 rounded-xl bg-neutral-950 text-white font-medium text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              >
                Accept All
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDecline}
                className="flex-1 rounded-xl font-medium text-xs uppercase tracking-widest border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
