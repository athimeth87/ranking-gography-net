CREATE OR REPLACE FUNCTION public.get_v5_hall_of_fame(p_season_id uuid DEFAULT NULL)
RETURNS TABLE (
    photographer_id uuid,
    username text,
    display_name text,
    avatar_url text,
    photo_count bigint,
    hof_score numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH user_photos AS (
        SELECT 
            p.photographer_id,
            p.pulse,
            ROW_NUMBER() OVER (PARTITION BY p.photographer_id ORDER BY p.pulse DESC NULLS LAST) as rn
        FROM public.photos p
        WHERE p.is_hidden = false 
          AND p.status = 'published'
          AND (p_season_id IS NULL OR p.season_id = p_season_id)
    ),
    user_stats AS (
        SELECT 
            up.photographer_id,
            count(*) as total_photos
        FROM public.photos up
        WHERE up.is_hidden = false 
          AND up.status = 'published'
          AND (p_season_id IS NULL OR up.season_id = p_season_id)
        GROUP BY up.photographer_id
    ),
    top_10 AS (
        SELECT 
            up.photographer_id,
            avg(up.pulse) as raw_hof_score
        FROM user_photos up
        WHERE up.rn <= 10
        GROUP BY up.photographer_id
    )
    SELECT 
        u.id as photographer_id,
        u.username,
        u.display_name,
        u.avatar_url,
        s.total_photos,
        round(t.raw_hof_score::numeric, 1) as hof_score
    FROM user_stats s
    JOIN top_10 t ON s.photographer_id = t.photographer_id
    JOIN public.users u ON u.id = s.photographer_id
    WHERE s.total_photos >= 22
    ORDER BY t.raw_hof_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
