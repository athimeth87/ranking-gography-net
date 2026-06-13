// Cold-start switch: hide raw like counts (show badges) until NEXT_PUBLIC_SHOW_LIKE_COUNTS=true. Unset → hidden.
export const SHOW_LIKE_COUNTS = process.env.NEXT_PUBLIC_SHOW_LIKE_COUNTS === 'true';
