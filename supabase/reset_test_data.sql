-- 1. ลบประวัติการกด Like, Favorite, Comment ของบอททั้งหมดทิ้ง
DELETE FROM public.votes 
WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE 'bot_voter_%');

DELETE FROM public.favorites 
WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE 'bot_voter_%');

DELETE FROM public.comments 
WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE 'bot_voter_%');

-- 2. รีเซ็ตคะแนนและสถิติทั้งหมดกลับเป็น 0 (และดึงยอด Like/Fav/Comment ของผู้ใช้งานจริงกลับคืนมา)
UPDATE public.photos p
SET 
    -- ดึงค่ายอดกดจริงๆ ของระบบกลับมา (ตัดของบอทออก)
    likes_count = (SELECT count(*) FROM public.votes WHERE photo_id = p.id),
    favorites_count = (SELECT count(*) FROM public.favorites WHERE photo_id = p.id),
    comments_count = (SELECT count(*) FROM public.comments WHERE photo_id = p.id AND is_hidden = false),
    
    -- ล้างค่ายอดวิว และคะแนน Pulse ทั้งหมดให้เป็น 0
    impressions_count = 0,
    pulse = 0,
    score_v2 = 0,
    percentile = 0,
    peak_pulse = 0,
    badge = null;

-- 3. รีเซ็ตค่า Engagement ของ V4 ให้คำนวณใหม่เฉพาะยอดของผู้ใช้จริง
UPDATE public.photos
SET engagement = (coalesce(likes_count, 0) * 1) + 
                 (coalesce(favorites_count, 0) * 2) + 
                 (coalesce(comments_count, 0) * 4);
