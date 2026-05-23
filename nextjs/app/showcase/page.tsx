'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageCover } from '@/components/PageCover';
import { Footer } from '@/components/Footer';
import { MobileShowcase } from '@/components/mobile/MobileMisc';

// Demo page for the shadcn/ui primitives wired into this project.
// Reachable at /showcase. Will be removed once admin pages start consuming these.

function PageShowcase() {
  return (
    <>
    <div className="md:hidden"><MobileShowcase /></div>
    <div className="page-fade hidden md:block">
      <PageCover
        photoId="p018"
        eyebrow="Internal · shadcn/ui"
        title="UI Showcase"
        subtitle="Reference page for shadcn/ui primitives wired into Gography Photo Awards — tuned to the monochrome premium palette (no rounded corners, black/white only)."
        height="40vh"
        minHeight={320}
        maxHeight={440}
      />

      <section style={{ padding: '80px 0 120px' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>

          {/* Button */}
          <Group title="Button" path="components/ui/button.jsx">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Group>

          {/* Badge */}
          <Group title="Badge" path="components/ui/badge.jsx">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </Group>

          {/* Input + Label */}
          <Group title="Input + Label" path="components/ui/{input,label}.jsx">
            <div style={{ maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Label htmlFor="demo-title">Photo title</Label>
              <Input id="demo-title" placeholder="e.g. Morning fog, Doi Inthanon" />
              <p style={{ fontSize: 12, color: 'var(--fg-soft)', marginTop: 4 }}>
                สูงสุด 80 ตัวอักษร · ภาษาไทยหรืออังกฤษ
              </p>
            </div>
          </Group>

          {/* Card */}
          <Group title="Card" path="components/ui/card.jsx">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, maxWidth: 880 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Editor's Pick</CardTitle>
                  <CardDescription>คัดเลือกโดยทีม GOGRAPHY editorial — เพิ่ม Pulse +50</CardDescription>
                </CardHeader>
                <CardContent>
                  <p style={{ fontSize: 14, color: 'var(--fg-soft)', lineHeight: 1.6 }}>
                    ภาพที่ได้ Editor's Pick จะปรากฏใน Cover of the week และมีโอกาสได้ขึ้น Hall of Fame ในฤดูกาลนั้น
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm">Manage picks</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ambassador's Pick</CardTitle>
                  <CardDescription>คัดเลือกโดยช่างภาพรับเชิญ — เพิ่ม Pulse +50</CardDescription>
                </CardHeader>
                <CardContent>
                  <p style={{ fontSize: 14, color: 'var(--fg-soft)', lineHeight: 1.6 }}>
                    Ambassador คนเดียวกันเลือกภาพหนึ่งได้ครั้งเดียว แต่ Ambassador หลายคนเลือกภาพเดียวกันได้
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm">View ambassadors</Button>
                </CardFooter>
              </Card>
            </div>
          </Group>

          {/* Dialog */}
          <Group title="Dialog (modal)" path="components/ui/dialog.jsx">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm action</DialogTitle>
                  <DialogDescription>
                    ตัวอย่าง dialog ที่จะใช้ในงาน admin — ยืนยันการ remove ภาพ, mark customer, ฯลฯ
                  </DialogDescription>
                </DialogHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Input id="reason" placeholder="..." />
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Group>

          {/* Usage note */}
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 32 }}>
            <div className="caps" style={{ opacity: 0.55, marginBottom: 12 }}>How to use</div>
            <pre style={{ fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.7, background: 'var(--cream)', padding: '20px 24px', overflowX: 'auto' }}>
{`import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>Section title</CardHeader>
  <CardContent>
    <Button variant="outline">Action</Button>
  </CardContent>
</Card>`}
            </pre>
            <p style={{ fontSize: 13, color: 'var(--fg-soft)', marginTop: 16, lineHeight: 1.7 }} className="th">
              เพิ่ม component เพิ่ม: <code style={{ background: 'var(--cream)', padding: '2px 6px' }}>npx shadcn@latest add &lt;name&gt;</code> — ดูทั้งหมดที่ ui.shadcn.com/docs/components
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </div>
    </>
  );
}

function Group({ title, path, children }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--rule)', paddingBottom: 12, marginBottom: 24 }}>
        <h2 className="th" style={{ fontSize: 28, fontWeight: 400, letterSpacing: '-.015em', margin: 0 }}>{title}</h2>
        {path && (
          <code style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.55 }}>{path}</code>
        )}
      </div>
      {children}
    </div>
  );
}

export default function Page() { return <PageShowcase />; }
