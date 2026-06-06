-- Script to create 500 fake users and have them vote/like REAL photos.
-- INSTRUCTIONS: Run this directly in the Supabase SQL Editor.

DO $$
DECLARE
    fake_user_ids uuid[] := '{}';
    real_photo_ids uuid[];
    new_user_id uuid;
    pid uuid;
    i INT;
    j INT;
    vote_count INT;
    fav_count INT;
    random_user_index INT;
    fake_email TEXT;
BEGIN
    -- 1. Create 500 Fake Users
    FOR i IN 1..500 LOOP
        new_user_id := gen_random_uuid();
        fake_email := 'bot_voter_' || i || '_' || floor(random() * 10000) || '@gography.net';
        
        -- Insert into auth.users (bypass email verification)
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
            created_at, updated_at, raw_app_meta_data, raw_user_meta_data
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
            fake_email, crypt('password123', gen_salt('bf')), now(), 
            now(), now(), '{"provider":"email","providers":["email"]}', '{}'
        );
        
        -- The Supabase 'handle_new_user' trigger automatically inserts a row into public.users
        -- So we just need to UPDATE that row to set is_customer if we want.
        UPDATE public.users 
        SET is_customer = (random() > 0.9)
        WHERE id = new_user_id;
        
        fake_user_ids := array_append(fake_user_ids, new_user_id);
    END LOOP;

    -- 2. Find all REAL photos (photos not created by our bot_voter emails)
    SELECT array_agg(p.id) INTO real_photo_ids 
    FROM public.photos p
    JOIN public.users u ON p.photographer_id = u.id
    WHERE u.email NOT LIKE 'bot_voter_%';

    -- 3. Loop through real photos and let fake users vote on them
    IF real_photo_ids IS NOT NULL THEN
        FOREACH pid IN ARRAY real_photo_ids LOOP
            -- Randomize how many likes/favs this photo gets (e.g. 10 to 150)
            vote_count := 10 + floor(random() * 140);
            fav_count := floor(vote_count * 0.3); -- Approx 30% of likers also favorite
            
            -- Insert Likes (Votes)
            FOR j IN 1..vote_count LOOP
                random_user_index := 1 + floor(random() * array_length(fake_user_ids, 1));
                new_user_id := fake_user_ids[random_user_index];
                
                -- Get the fake email for this user
                SELECT email INTO fake_email FROM public.users WHERE id = new_user_id;

                -- Insert vote (ignore if they already voted)
                INSERT INTO public.votes (user_id, user_email, photo_id, voted_at)
                VALUES (new_user_id, fake_email, pid, now() - (floor(random() * 7) || ' days')::interval)
                ON CONFLICT (user_email, photo_id) DO NOTHING;
            END LOOP;

            -- Insert Favorites
            FOR j IN 1..fav_count LOOP
                random_user_index := 1 + floor(random() * array_length(fake_user_ids, 1));
                new_user_id := fake_user_ids[random_user_index];

                -- Insert favorite (ignore if already favorited)
                INSERT INTO public.favorites (user_id, photo_id, favorited_at)
                VALUES (new_user_id, pid, now() - (floor(random() * 7) || ' days')::interval)
                ON CONFLICT (user_id, photo_id) DO NOTHING;
            END LOOP;
        END LOOP;
    END IF;
END $$;
