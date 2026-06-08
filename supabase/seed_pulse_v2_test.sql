-- Script to generate 500 test users and 1000 test photos for testing Pulse V2 Ecosystem
-- INSTRUCTIONS: Run this script directly in the Supabase SQL Editor.

DO $$
DECLARE
    new_user_id uuid;
    i INT;
    j INT;
    new_photo_id uuid;
    r_likes INT;
    r_comments INT;
    r_favs INT;
    r_views INT;
    r_days_ago INT;
    r_cat TEXT;
    categories TEXT[] := ARRAY['landscape', 'portrait', 'bw'];
BEGIN
    FOR i IN 1..500 LOOP
        new_user_id := gen_random_uuid();
        
        -- Insert into auth.users (minimal fields needed by Supabase Auth)
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
            recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
            'pulse_test_user' || i || '@gography.net', crypt('password123', gen_salt('bf')), 
            now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 
            now(), now(), '', '', '', ''
        );
        
        -- The Supabase 'handle_new_user' trigger automatically inserts a row into public.users
        -- So we just need to UPDATE that row to set is_customer if we want.
        UPDATE public.users 
        SET is_customer = (random() > 0.8)
        WHERE id = new_user_id;
        
        -- Generate 2 photos per user
        FOR j IN 1..2 LOOP
            new_photo_id := gen_random_uuid();
            r_likes := floor(random() * 500);
            r_comments := floor(random() * 50);
            r_favs := floor(random() * 100);
            r_views := floor(random() * 10000) + r_likes + r_comments; -- views must be larger
            r_days_ago := floor(random() * 30); -- spread photos over the last 30 days
            r_cat := categories[1 + floor(random() * 3)];
            
            INSERT INTO public.photos (
                id, photographer_id, category, title, description, storage_url, 
                status, uploaded_at, likes_count, comments_count, favorites_count, impressions_count
            )
            VALUES (
                new_photo_id, new_user_id, r_cat, 
                'Test Photo ' || i || '-' || j, 
                'Automated test photo for Pulse V2 algorithm.', 
                'https://picsum.photos/seed/' || new_photo_id || '/800/1000', 
                'published', 
                now() - (r_days_ago || ' days')::interval, 
                r_likes, r_comments, r_favs, r_views
            );
        END LOOP;
    END LOOP;
END $$;
