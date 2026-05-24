'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/providers/AppProvider';
import { deleteComment, updateComment, createComment, type CommentRow } from '@/lib/data/comments-db';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const REPLIES_INITIAL = 2;

export interface CommentItemProps {
  comment: CommentRow;
  replies?: CommentRow[];
  photoId: string;
  onMutated: () => void;
}

export function CommentItem({ comment, replies = [], photoId, onMutated }: CommentItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser } = useApp();
  const isOwn = authUser?.id === comment.user_id;

  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(false);

  const redirectIfNeeded = () => {
    router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
  };

  const onReplySubmit = async () => {
    if (!authUser) { redirectIfNeeded(); return; }
    setBusy(true);
    const res = await createComment({
      photoId,
      body: replyBody,
      parentId: comment.parent_id ?? comment.id,
      authUser,
    });
    setBusy(false);
    if (res.kind === 'unauth') { redirectIfNeeded(); return; }
    if (res.kind === 'ok') {
      setReplyBody('');
      setReplying(false);
      onMutated();
    }
  };

  const onEditSubmit = async () => {
    if (!authUser) { redirectIfNeeded(); return; }
    setBusy(true);
    const res = await updateComment(comment.id, editBody, authUser);
    setBusy(false);
    if (res.kind === 'unauth') { redirectIfNeeded(); return; }
    if (res.kind === 'ok') {
      setEditing(false);
      onMutated();
    }
  };

  const onDeleteClick = () => {
    if (!authUser) { redirectIfNeeded(); return; }
    setConfirmDeleteOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!authUser) { redirectIfNeeded(); return; }
    setBusy(true);
    const res = await deleteComment(comment.id, authUser);
    setBusy(false);
    setConfirmDeleteOpen(false);
    if (res.kind === 'unauth') { redirectIfNeeded(); return; }
    if (res.kind === 'ok') onMutated();
  };

  const username = comment.author?.username ?? 'unknown';
  const displayName = comment.author?.display_name ?? username;
  const avatar = comment.author?.avatar_url ?? '';
  const edited = comment.updated_at && comment.updated_at !== comment.created_at;

  return (
    <div className="flex gap-4 pb-6 border-b border-rule">
      <div className="w-9 h-9 rounded-full bg-tile overflow-hidden shrink-0">
        {avatar && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-baseline">
          <Link href={`/photographer/${username}`} className="text-[13px] font-medium tracking-[-0.005em]">
            {displayName}
          </Link>
          <span className="mono text-[11px] opacity-50">
            {new Date(comment.created_at).toLocaleString()}
            {edited && <span className="ml-2 opacity-60">(edited)</span>}
          </span>
        </div>

        {editing ? (
          <div className="mt-2 flex gap-2">
            <input
              className="input flex-1"
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              disabled={busy}
            />
            <button className="btn" onClick={onEditSubmit} disabled={busy}>Save</button>
            <button className="btn" onClick={() => { setEditing(false); setEditBody(comment.body); }}>Cancel</button>
          </div>
        ) : (
          <p className="th mt-2 text-[14px] leading-[1.6]">{comment.body}</p>
        )}

        <div className="mt-3 flex gap-4 text-[11px] uppercase tracking-[0.12em] opacity-65">
          <button onClick={() => setReplying((v) => !v)}>Reply</button>
          {isOwn && !editing && <button onClick={() => setEditing(true)}>Edit</button>}
          {isOwn && <button onClick={onDeleteClick}>Delete</button>}
        </div>

        {replying && (
          <div className="mt-3 flex gap-2">
            <input
              className="input flex-1"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder={`Reply to ${displayName}…`}
              disabled={busy}
            />
            <button className="btn" onClick={onReplySubmit} disabled={busy}>Post</button>
          </div>
        )}

        {replies.length > 0 && (() => {
          const visibleReplies = repliesExpanded ? replies : replies.slice(0, REPLIES_INITIAL);
          const hiddenReplyCount = Math.max(0, replies.length - visibleReplies.length);
          return (
            <div className="mt-6 pl-8 flex flex-col gap-6 border-l border-rule">
              {visibleReplies.map((r) => (
                <CommentItem key={r.id} comment={r} photoId={photoId} onMutated={onMutated} />
              ))}
              {hiddenReplyCount > 0 && (
                <button
                  type="button"
                  className="self-start caps text-[11px] tracking-[0.12em] opacity-65 hover:opacity-100 border-b border-rule pb-[2px]"
                  onClick={() => setRepliesExpanded(true)}
                >
                  Read more ({hiddenReplyCount})
                </button>
              )}
            </div>
          );
        })()}
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this comment?"
        body="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        busy={busy}
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
