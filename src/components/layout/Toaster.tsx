'use client';
import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      duration={5000}
      visibleToasts={4}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: 'bg-bg text-fg border border-rule-strong shadow-none !rounded-none font-sans text-[13px] p-4',
          title: 'font-medium tracking-[-0.005em]',
          description: 'text-fg-soft text-[12px] mt-1',
          actionButton: 'caps text-[11px] opacity-65 hover:opacity-100 !bg-transparent !text-fg',
        },
      }}
    />
  );
}
