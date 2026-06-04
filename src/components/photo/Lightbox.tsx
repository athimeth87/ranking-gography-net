'use client';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';

interface LightboxProps {
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lightbox — fullscreen image overlay.
 * Built on the themed shadcn Dialog (base-ui) so Escape/focus-trap work out of the box.
 * Styled to match the source's .lbox-overlay (fixed inset-0, near-black bg, centered image).
 */
export function Lightbox({ src, alt, open, onOpenChange }: LightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        {/* Backdrop: near-black, matches .lbox-overlay */}
        <DialogOverlay className="bg-black/90 z-[200]" />

        {/* Popup: full viewport, no card chrome, just the image centered */}
        <DialogPrimitive.Popup
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 outline-none
            data-open:animate-in data-open:fade-in-0
            data-closed:animate-out data-closed:fade-out-0"
        >
          {/* Close button — top-right corner */}
          <DialogPrimitive.Close
            className="absolute top-4 right-4 text-white/70 hover:text-white cursor-pointer transition-colors z-10"
            aria-label="Close lightbox"
          >
            <XIcon size={24} />
          </DialogPrimitive.Close>

          {/* Click outside the image to close */}
          <div
            className="absolute inset-0"
            onClick={() => onOpenChange(false)}
            aria-hidden
          />

          {/* Image: constrained to viewport, natural aspect ratio preserved */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="relative max-w-full max-h-[90vh] object-contain pointer-events-none select-none"
            loading="lazy"
          />
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
