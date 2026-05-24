'use client';
import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useComments } from '@/hooks/useComments';
import { createComment, type CommentRow } from '@/lib/data/comments-db';
import { CommentItem } from './CommentItem';

export interface CommentSectionProps {
  photoId: string;
}

export function CommentSection({ photoId }: CommentSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser } = useApp();
  const { comments, loading, refresh } = useComments(photoId);

  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const { roots, repliesByParent } = useMemo(() => {
    const roots: CommentRow[] = [];
    const repliesByParent = new Map<string, CommentRow[]>();
    for (const c of comments) {
      if (!c.parent_id) {
        roots.push(c);
      } else {
        const arr = repliesByParent.get(c.parent_id) ?? [];
        arr.push(c);
        repliesByParent.set(c.parent_id, arr);
      }
    }
    return { roots, repliesByParent };
  }, [comments]);

  const onPost = async () => {
    if (!authUser) {
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
      return;
    }
    setBusy(true);
    const res = await createComment({ photoId, body, authUser });
    setBusy(false);
    if (res.kind === 'unauth') {
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
      return;
    }
    if (res.kind === 'ok') {
      setBody('');
      refresh();
    }
  };

  return (
    <div className="mt-14">
      <div className="mb-8">
        <div className="caps opacity-55 mb-2">Comments</div>
        <div className="mono text-[11px] opacity-50">
          {loading ? 'Loading…' : `${comments.length} comments`}
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          className="input flex-1"
          placeholder="พิมพ์ Comments ของคุณ"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !busy && body.trim().length > 0) onPost();
          }}
          disabled={busy}
        />
        <button className="btn" onClick={onPost} disabled={busy || body.trim().length === 0}>Post</button>
      </div>

      <div className="flex flex-col gap-6">
        {roots.length === 0 && !loading && (
          <div className="opacity-50 text-[13px]">No comments yet. Be the first.</div>
        )}
        {roots.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            replies={repliesByParent.get(c.id) ?? []}
            photoId={photoId}
            onMutated={refresh}
          />
        ))}
      </div>
    </div>
  );
}
