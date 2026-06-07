DO $$
DECLARE
    ambassador_ids uuid[];
    rankmaster_ids uuid[];
    regular_bot_ids uuid[];
    real_photo_ids uuid[];
    pid uuid;
    uid uuid;
    i int;
    j int;
    comment_texts text[] := ARRAY[
        'Amazing shot! 📸', 'Love the lighting here.', 'This is absolutely stunning.', 
        'Great composition!', 'What camera did you use for this?', 'Breathtaking view.', 
        'Incredible colors!', 'Wow, just wow.', 'Perfect timing on this one.', 'Masterpiece! 🔥'
    ];
BEGIN
    -- 1. อัปเกรดยศให้บอท (เพื่อให้เทส V4 แบบมีน้ำหนักคะแนนได้)
    -- ตั้งให้บอท 20 ตัวเป็น Ambassador (คะแนน x5)
    UPDATE public.users SET photographer_status = 'approved'
    WHERE email IN (SELECT email FROM public.users WHERE email LIKE 'bot_voter_%' LIMIT 20);

    -- ตั้งให้บอท 100 ตัวเป็น Rankmaster (คะแนน x3)
    UPDATE public.users SET is_customer = true, photographer_status = 'pending'
    WHERE email IN (
        SELECT email FROM public.users 
        WHERE email LIKE 'bot_voter_%' AND photographer_status != 'approved' 
        LIMIT 100
    );

    -- 2. โหลดไอดีบอทและรูปภาพ
    SELECT array_agg(id) INTO ambassador_ids FROM public.users WHERE email LIKE 'bot_voter_%' AND photographer_status = 'approved';
    SELECT array_agg(id) INTO rankmaster_ids FROM public.users WHERE email LIKE 'bot_voter_%' AND is_customer = true AND photographer_status != 'approved';
    SELECT array_agg(id) INTO regular_bot_ids FROM public.users WHERE email LIKE 'bot_voter_%' AND is_customer = false AND photographer_status != 'approved';
    
    SELECT array_agg(p.id) INTO real_photo_ids FROM public.photos p JOIN public.users u ON p.photographer_id = u.id WHERE u.email NOT LIKE 'bot_voter_%';

    IF real_photo_ids IS NULL THEN RETURN; END IF;

    -- 3. เสกยอดโหวต (ระบบ Trigger V4 จะคำนวณ Engagement ให้อัตโนมัติทันทีที่บรรทัดนี้ทำงาน!)
    FOREACH pid IN ARRAY real_photo_ids
    LOOP
        -- ให้ Ambassador โหวต (ได้คะแนนโหดสุด)
        FOR j IN 1..(floor(random() * 5) + 1) LOOP
            uid := ambassador_ids[floor(random() * array_length(ambassador_ids, 1)) + 1];
            INSERT INTO public.votes (user_id, user_email, photo_id) 
            VALUES (uid, (SELECT email FROM public.users WHERE id = uid), pid) 
            ON CONFLICT (user_email, photo_id) DO NOTHING;
            
            IF random() > 0.3 THEN
                INSERT INTO public.favorites (user_id, photo_id) VALUES (uid, pid) ON CONFLICT DO NOTHING;
            END IF;

            -- ให้บางคนคอมเมนต์ด้วย (ได้คะแนน 20 แต้มเต็ม!)
            IF random() > 0.5 THEN
                INSERT INTO public.comments (photo_id, user_id, body) VALUES (pid, uid, comment_texts[floor(random() * 10) + 1]);
            END IF;
        END LOOP;

        -- ให้ Rankmaster โหวต
        FOR j IN 1..(floor(random() * 15) + 1) LOOP
            uid := rankmaster_ids[floor(random() * array_length(rankmaster_ids, 1)) + 1];
            INSERT INTO public.votes (user_id, user_email, photo_id) 
            VALUES (uid, (SELECT email FROM public.users WHERE id = uid), pid) 
            ON CONFLICT (user_email, photo_id) DO NOTHING;
            
            IF random() > 0.5 THEN
                INSERT INTO public.favorites (user_id, photo_id) VALUES (uid, pid) ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;

        -- ให้ Regular Bot โหวต
        FOR j IN 1..(floor(random() * 50) + 1) LOOP
            uid := regular_bot_ids[floor(random() * array_length(regular_bot_ids, 1)) + 1];
            INSERT INTO public.votes (user_id, user_email, photo_id) 
            VALUES (uid, (SELECT email FROM public.users WHERE id = uid), pid) 
            ON CONFLICT (user_email, photo_id) DO NOTHING;
            
            IF random() > 0.8 THEN
                INSERT INTO public.favorites (user_id, photo_id) VALUES (uid, pid) ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;

        -- 4. เสกยอดวิวจำลองขั้นต่ำ เพื่อให้ปลดล็อค Badge ได้
        UPDATE public.photos SET impressions_count = (floor(random() * 500) + 200) WHERE id = pid;
    END LOOP;
END $$;
