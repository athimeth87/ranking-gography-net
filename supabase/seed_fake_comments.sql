DO $$
DECLARE
    fake_user_ids uuid[];
    real_photo_ids uuid[];
    pid uuid;
    uid uuid;
    i int;
    j int;
    comment_texts text[] := ARRAY[
        'Amazing shot! 📸',
        'Love the lighting here.',
        'This is absolutely stunning.',
        'Great composition!',
        'What camera did you use for this?',
        'Breathtaking view.',
        'Incredible colors!',
        'Wow, just wow.',
        'Perfect timing on this one.',
        'Masterpiece! 🔥'
    ];
BEGIN
    -- 1. Find all bot users
    SELECT array_agg(id) INTO fake_user_ids
    FROM public.users
    WHERE email LIKE 'bot_voter_%';

    IF fake_user_ids IS NULL THEN
        RAISE NOTICE 'No bot users found. Please run seed_fake_votes.sql first.';
        RETURN;
    END IF;

    -- 2. Find all REAL photos
    SELECT array_agg(p.id) INTO real_photo_ids 
    FROM public.photos p
    JOIN public.users u ON p.photographer_id = u.id
    WHERE u.email NOT LIKE 'bot_voter_%';

    IF real_photo_ids IS NULL THEN
        RAISE NOTICE 'No real photos found.';
        RETURN;
    END IF;

    -- 3. Insert random comments
    FOREACH pid IN ARRAY real_photo_ids
    LOOP
        -- Give each photo 1 to 5 random comments
        FOR j IN 1..(floor(random() * 5) + 1)
        LOOP
            uid := fake_user_ids[floor(random() * array_length(fake_user_ids, 1)) + 1];
            
            INSERT INTO public.comments (photo_id, user_id, body, created_at)
            VALUES (
                pid, 
                uid, 
                comment_texts[floor(random() * array_length(comment_texts, 1)) + 1],
                now() - (floor(random() * 7) || ' days')::interval
            );
        END LOOP;
    END LOOP;
END $$;
