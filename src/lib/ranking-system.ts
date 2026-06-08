import { PHOTOGRAPHERS } from '@/lib/data';

// Helper to calculate the Monday key (YYYY-MM-DD) for a date
export function getWeekKey(dateStr: string | Date): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'unknown';
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(date.setDate(diff));
  return (monday.toISOString().split('T')[0]) as string;
}

// Compute the set of usernames who have achieved Rank Master status (top 3 for 3 consecutive weeks)
export function computeRankMasters(photos: any[]): Set<string> {
  const photosByWeek: Record<string, any[]> = {};
  photos.forEach(p => {
    const dateStr = p.date || p.uploaded_at;
    if (!dateStr) return;
    const wk = getWeekKey(dateStr);
    if (!photosByWeek[wk]) photosByWeek[wk] = [];
    photosByWeek[wk].push(p);
  });

  const weekRankings: Record<string, { username: string, totalScore: number }[]> = {};
  Object.entries(photosByWeek).forEach(([wk, weekPhotos]) => {
    const scoresByPhotographer: Record<string, number> = {};
    weekPhotos.forEach(p => {
      const username = p.by || p.users?.username;
      if (!username) return;
      
      // Support both client Photo model and Supabase Photo record
      const pulseScore = typeof p.pulse === 'number' ? p.pulse : ((p.likes_count || 0) + (p.favorites_count || 0) * 2);
      scoresByPhotographer[username] = (scoresByPhotographer[username] || 0) + pulseScore;
    });
    const sorted = Object.entries(scoresByPhotographer)
      .map(([username, totalScore]) => ({ username, totalScore }))
      .sort((a, b) => b.totalScore - a.totalScore);
    weekRankings[wk] = sorted;
  });

  const sortedWeeks = Object.keys(photosByWeek).sort();
  const rankMasterUsernames = new Set<string>();
  const allUsernames = Array.from(new Set(photos.map(p => p.by || p.users?.username).filter(Boolean)));

  if (sortedWeeks.length > 0) {
    const minDate = new Date(sortedWeeks[0] as string);
    const maxDate = new Date(sortedWeeks[sortedWeeks.length - 1] as string);
    const allWeeks: string[] = [];
    let curr = new Date(minDate);
    while (curr <= maxDate) {
      allWeeks.push(curr.toISOString().split('T')[0] as string);
      curr.setDate(curr.getDate() + 7);
    }

    allUsernames.forEach(username => {
      let streak = 0;
      for (const wk of allWeeks) {
        const rankings = weekRankings[wk] || [];
        const rankIndex = rankings.findIndex(r => r.username === username);
        const rankedTop3 = rankIndex !== -1 && rankIndex < 3;
        if (rankedTop3) {
          streak += 1;
          if (streak >= 3) {
            rankMasterUsernames.add(username);
          }
        } else {
          streak = 0;
        }
      }
    });
  }

  return rankMasterUsernames;
}

// Helper to calculate the cashback percentage based on voyageur rank
export function getCashbackPercentage(rank: number | null): number {
  if (rank === null || rank <= 0) return 0;
  if (rank === 1) return 15;
  if (rank >= 2 && rank <= 5) return 10;
  if (rank >= 6 && rank <= 10) return 5;
  if (rank >= 11 && rank <= 50) return 3;
  return 0;
}

