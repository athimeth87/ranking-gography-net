'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';

// Demo page for the shadcn/ui primitives wired into this project.
// Reachable at /showcase. Will be removed once admin pages start consuming these.

function PageShowcase() {
  return (
    <div className="page-fade">
      <PageCover
        eyebrow="Internal · shadcn/ui"
        title="UI Showcase"
        subtitle="Reference page for shadcn/ui primitives wired into GOGRAPHY Ranking — tuned to the monochrome premium palette (no rounded corners, black/white only)."
      />

      <section className="py-[80px] pb-[120px]">
        <div className="wrap flex flex-col gap-[56px]">

          {/* Button */}
          <Group title="Button" path="components/ui/button.jsx">
            <div className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Group>

          {/* Badge — no badge.tsx; use branded span fallback */}
          <Group title="Badge" path="components/ui/badge.jsx">
            <div className="flex flex-wrap gap-[10px]">
              <span className="caps inline-block px-2 py-1 border border-rule text-[10px]">Default</span>
              <span className="caps inline-block px-2 py-1 border border-rule text-[10px]">Secondary</span>
              <span className="caps inline-block px-2 py-1 border border-rule text-[10px]">Outline</span>
              <span className="caps inline-block px-2 py-1 border border-rule text-[10px]">Destructive</span>
            </div>
          </Group>

          {/* Input + Label */}
          <Group title="Input + Label" path="components/ui/{input,label}.jsx">
            <div className="max-w-[380px] flex flex-col gap-[10px]">
              <Label htmlFor="demo-title">Photo title</Label>
              <Input id="demo-title" placeholder="e.g. Morning fog, Doi Inthanon" />
              <p className="text-[12px] text-[var(--fg-soft)] mt-1">
                สูงสุด 80 ตัวอักษร · ภาษาไทยหรืออังกฤษ
              </p>
            </div>
          </Group>

          {/* Card — no card.tsx; use plain div fallback */}
          <Group title="Card" path="components/ui/card.jsx">
            <div className="grid grid-cols-[1fr_1fr] gap-6 max-w-[880px]">
              {/* Card 1 */}
              <div className="border border-rule p-6">
                <div className="mb-3">
                  <div className="text-base font-medium leading-none mb-1">Rank Master</div>
                  <div className="text-sm text-[var(--fg-soft)]">คัดเลือกโดยทีม GOGRAPHY editorial — เพิ่ม Pulse +50</div>
                </div>
                <div className="mb-4">
                  <p className="text-[14px] text-[var(--fg-soft)] leading-[1.6]">
                    ภาพที่ได้ Rank Master จะปรากฏใน Cover of the week และมีโอกาสได้ขึ้น Hall of Fame ในฤดูกาลนั้น
                  </p>
                </div>
                <div>
                  <Button variant="outline" size="sm">Manage picks</Button>
                </div>
              </div>

              {/* Card 2 */}
              <div className="border border-rule p-6">
                <div className="mb-3">
                  <div className="text-base font-medium leading-none mb-1">Ambassador&apos;s Pick</div>
                  <div className="text-sm text-[var(--fg-soft)]">คัดเลือกโดยช่างภาพรับเชิญ — เพิ่ม Pulse +50</div>
                </div>
                <div className="mb-4">
                  <p className="text-[14px] text-[var(--fg-soft)] leading-[1.6]">
                    Ambassador คนเดียวกันเลือกภาพหนึ่งได้ครั้งเดียว แต่ Ambassador หลายคนเลือกภาพเดียวกันได้
                  </p>
                </div>
                <div>
                  <Button variant="outline" size="sm">View ambassadors</Button>
                </div>
              </div>
            </div>
          </Group>

          {/* Dialog */}
          <Group title="Dialog (modal)" path="components/ui/dialog.jsx">
            <DialogDemo />
          </Group>

          {/* Usage note */}
          <div className="border-t border-rule pt-8">
            <div className="caps opacity-55 mb-3">How to use</div>
            <pre className="font-[var(--mono)] text-[12px] leading-[1.7] bg-[var(--cream)] px-6 py-5 overflow-x-auto">
{`import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>Section title</CardHeader>
  <CardContent>
    <Button variant="outline">Action</Button>
  </CardContent>
</Card>`}
            </pre>
            <p className="th text-[14px] text-[var(--fg-soft)] mt-4 leading-[1.7]">
              เพิ่ม component เพิ่ม: <code className="bg-[var(--cream)] px-[6px] py-[2px]">npx shadcn@latest add &lt;name&gt;</code> — ดูทั้งหมดที่ ui.shadcn.com/docs/components
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}

function DialogDemo() {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>
            ตัวอย่าง dialog ที่จะใช้ในงาน admin — ยืนยันการ remove ภาพ, mark customer, ฯลฯ
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Input id="reason" placeholder="..." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface GroupProps {
  title: string;
  path?: string;
  children: React.ReactNode;
}

function Group({ title, path, children }: GroupProps) {
  return (
    <div>
      <div className="flex justify-between items-baseline border-b border-rule pb-3 mb-6">
        <h2 className="th text-[28px] font-normal tracking-[-.015em] m-0">{title}</h2>
        {path && (
          <code className="font-[var(--mono)] text-[11px] opacity-55">{path}</code>
        )}
      </div>
      {children}
    </div>
  );
}

export default function Page() { return <PageShowcase />; }
