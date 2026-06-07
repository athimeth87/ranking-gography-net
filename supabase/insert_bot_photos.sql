DO $$
DECLARE
    bot_users uuid[];
    bot_uid uuid;
    i INT := 1;
    files TEXT[] := ARRAY['/posttest/01.png', '/posttest/02.png', '/posttest/03.png', '/posttest/04.png'];
BEGIN
    -- Get 10 bots
    SELECT array_agg(id) INTO bot_users FROM (
        SELECT id FROM public.users WHERE email LIKE 'bot_voter_%' LIMIT 10
    ) sub;

    IF array_length(bot_users, 1) IS NULL THEN
        RAISE NOTICE 'No bot users found!';
        RETURN;
    END IF;

    FOREACH bot_uid IN ARRAY bot_users
    LOOP
        INSERT INTO public.photos (
            photographer_id, title, slug, description, category, storage_url, status, is_hidden, uploaded_at, pulse
        ) VALUES (
            bot_uid, 
            'Bot Test Photo ' || i, 
            'bot-test-photo-' || i || '-' || floor(random() * 1000000), 
            'A beautiful test photo uploaded by bot.', 
            'landscape', 
            files[ (i % 4) + 1 ], 
            'published', 
            false, 
            now(),
            5000 + i -- ให้คะแนน Pulse สูงๆ จะได้ขึ้นหน้าแรก
        );
        i := i + 1;
    END LOOP;
END $$;
