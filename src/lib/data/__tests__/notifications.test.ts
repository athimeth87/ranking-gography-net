import { describe, expect, it } from 'vitest';
import { formatNotificationBody, type NotificationRow } from '../notifications';

const base: Omit<NotificationRow, 'type' | 'body'> = {
  id: 'n1',
  user_id: 'u-owner',
  related_photo_id: 'p1',
  related_user_id: 'u-actor',
  related_url: '/photo/p1',
  is_read: false,
  created_at: '2026-05-24T00:00:00Z',
};

describe('formatNotificationBody', () => {
  it('uses DB body when present', () => {
    const n: NotificationRow = { ...base, type: 'like_received', body: 'somnuk liked your photo' };
    expect(formatNotificationBody(n)).toBe('somnuk liked your photo');
  });

  it('falls back to generic text when body is empty', () => {
    const n: NotificationRow = { ...base, type: 'like_received', body: '' };
    expect(formatNotificationBody(n)).toBe('Someone liked your photo');
  });

  it('falls back per type for comment_received', () => {
    const n: NotificationRow = { ...base, type: 'comment_received', body: '' };
    expect(formatNotificationBody(n)).toBe('Someone commented on your photo');
  });

  it('falls back per type for comment_reply', () => {
    const n: NotificationRow = { ...base, type: 'comment_reply', body: '' };
    expect(formatNotificationBody(n)).toBe('Someone replied to your comment');
  });

  it('returns the body unchanged for unknown types', () => {
    const n: NotificationRow = { ...base, type: 'editor_pick', body: 'You were picked' };
    expect(formatNotificationBody(n)).toBe('You were picked');
  });
});
