-- Simulation: 50 AI Agents uploading 1 photo/day for 30 days + Random Votes
-- This script inserts actual auth.users and generates photos & votes to test Hall of Fame logic.

-- Simulation: 50 AI Agents uploading 1 photo/day for 30 days + Random Votes
-- Optimized set-based execution to prevent timeouts.

DO $$
DECLARE
    v_files text[] := ARRAY[
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific__air-canada-boeing-777-landing-at-montreal-yul-in-h__80579.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific__air-canada-boeing-777-landing-at-montreal-yul-in-h__80580.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific__air-canada-boeing-787-dreamliner-parked-at-toronto__80581.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific__air-canada-dreamliner-departing-at-dawn-with-orang__80582.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific__air-canada-dreamliner-departing-at-dawn-with-orang__80583.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific__air-canada-dreamliner-departing-at-dawn-with-orang__80584.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific__air-canada-dreamliner-departing-at-dawn-with-orang__80585.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific__cockpit-view-during-approach-into-vancouver-mounta__80578.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_aerial-drone-view-of-geir_xgtplwPjfW.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_crystal-clear-ice-on-lake_9RKE6GXNYZ.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_iconic-hamnoy-bridge-over_fFcZQbwCDY.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_inside-historic-moscow-me_LUheLD7swO.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_luxury-car-driving-along-_WM7jVevcXe.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_luxury-interior-of-the-he_swvdspgl8e.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_nevsky-prospect-at-night-_rlIMrTOxtc.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_photo-01-red-square-sunri_J9Fm7UKOq4.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_red-square-moscow-at-sunr_SOCogscUb8.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_red-square-moscow-at-sunr_SOCogszUb8.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_red-square-moscow-at-sunr_hEn6mIwvqL.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_remote-arctic-fishing-vil_DB9UXMrpcl.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_senja-island-coastal-clif_LUhdSjpswO (1).png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_senja-island-coastal-clif_LUhdSjpswO.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_senja-island-coastal-clif_hEniCmSvqL.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_snowcovered-streets-of-sa_ubVAuRfQLD.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_trans-siberian-railway-cr_CH02uk1EEy.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_traveler-standing-on-trol_435Ci229Aa.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_volcanic-mountains-of-kam_EqTAQ17uuO.png',
        'https://pub-5537def73c924545a3c1b34bc9ca5ba0.r2.dev/testpic/magnific_volcanic-mountains-of-kam_y6qa42YPW9.png'
    ];
BEGIN
    RAISE NOTICE 'Starting Optimized Simulation Data Generation...';

    -- 0. Cleanup previous simulation run
    RAISE NOTICE 'Cleaning up previous simulation data...';
    DELETE FROM public.photos WHERE slug LIKE 'sim-photo-%';
    DELETE FROM auth.users WHERE email LIKE 'agent_sim_%@simulation.test';

    -- 1. Create 50 AI Agents
    RAISE NOTICE 'Creating 50 AI Agents...';
    WITH new_agents AS (
        SELECT 
            gen_random_uuid() as id,
            'agent_sim_' || i || '@simulation.test' as email,
            'AI Agent ' || i as display_name,
            'agent_sim_' || i as username,
            i
        FROM generate_series(1, 50) as i
    )
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data
    )
    SELECT 
        '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', 
        email, crypt('password123', gen_salt('bf')), now(), 
        now() - interval '30 days', now(), '{"provider":"email","providers":["email"]}', '{}'
    FROM new_agents;
    
    -- Update public.users for the new agents
    UPDATE public.users u
    SET display_name = 'AI Agent ' || regexp_replace(u.username, 'agent_sim_', ''),
        photographer_status = 'approved',
        is_customer = (random() > 0.8),
        created_at = now() - interval '30 days'
    WHERE u.email LIKE 'agent_sim_%@simulation.test';

    -- 2. Each agent posts 1 photo per day for 30 days
    RAISE NOTICE 'Generating 1500 photos (30 days x 50 agents)...';
    INSERT INTO public.photos (
        id, photographer_id, title, slug, description, category, storage_url, status, is_hidden, uploaded_at, pulse
    )
    SELECT 
        gen_random_uuid(),
        u.id,
        'Simulated Photo Day ' || d || ' by ' || u.username,
        'sim-photo-' || d || '-' || u.username || '-' || floor(random() * 1000000),
        'Day ' || d || ' of the 30-day simulation challenge.',
        (ARRAY['landscape', 'portrait', 'bw'])[floor(random() * 3) + 1],
        v_files[floor(random() * array_length(v_files, 1)) + 1],
        'published',
        false,
        now() - interval '30 days' + ((d - 1) * interval '1 day') + (random() * interval '23 hours'),
        0
    FROM public.users u
    CROSS JOIN generate_series(1, 30) AS d
    WHERE u.email LIKE 'agent_sim_%@simulation.test';

    -- 3. Random Voting
    RAISE NOTICE 'Generating random votes for 1500 photos...';
    WITH bot_users AS (
        SELECT id, email FROM public.users WHERE email LIKE 'agent_sim_%@simulation.test'
    ),
    sim_photos AS (
        SELECT id FROM public.photos WHERE slug LIKE 'sim-photo-%'
    ),
    vote_pairs AS (
        SELECT 
            p.id as photo_id,
            u.id as user_id,
            u.email as user_email
        FROM sim_photos p
        CROSS JOIN bot_users u
        WHERE random() < 0.3 -- ~30% chance for each bot to vote on each photo (~15 votes per photo)
    )
    INSERT INTO public.votes (user_id, user_email, photo_id)
    SELECT user_id, user_email, photo_id FROM vote_pairs
    ON CONFLICT DO NOTHING;

    -- 4. Random Favorites
    RAISE NOTICE 'Generating random favorites...';
    WITH bot_users AS (
        SELECT id FROM public.users WHERE email LIKE 'agent_sim_%@simulation.test'
    ),
    sim_photos AS (
        SELECT id FROM public.photos WHERE slug LIKE 'sim-photo-%'
    ),
    fav_pairs AS (
        SELECT 
            p.id as photo_id,
            u.id as user_id
        FROM sim_photos p
        CROSS JOIN bot_users u
        WHERE random() < 0.05 -- ~5% chance to favorite (~2-3 favs per photo)
    )
    INSERT INTO public.favorites (user_id, photo_id)
    SELECT user_id, photo_id FROM fav_pairs
    ON CONFLICT DO NOTHING;

    -- 5. Force backfill Pulse for all simulation photos
    -- Because the realtime pulse trigger only recalculates for photos within 24 hours!
    RAISE NOTICE 'Backfilling pulse scores for all historical simulation photos...';
    UPDATE public.photos
       SET pulse = round((99.99 * (1 - exp(-0.03 * engagement)))::numeric, 1),
           peak_pulse = round((99.99 * (1 - exp(-0.03 * engagement)))::numeric, 1)
     WHERE slug LIKE 'sim-photo-%';

    RAISE NOTICE 'Simulation complete! Fast execution successful.';
END $$;
