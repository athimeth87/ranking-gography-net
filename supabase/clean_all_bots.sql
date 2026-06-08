-- สคริปต์ล้างข้อมูลบัญชีและกิจกรรมของบอททดสอบทุกประเภทออกจากระบบอย่างสมบูรณ์
-- ครอบคลุม: bot_voter_%, agent_sim_%, และ bot%

BEGIN;

-- 1. ลบความเกี่ยวพันทั้งหมดของบอท (Likes, Favorites, Comments, Follows, Notifications)
DELETE FROM public.votes 
WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE email LIKE 'bot_voter_%' 
       OR email LIKE 'agent_sim_%' 
       OR email LIKE 'bot%'
);

DELETE FROM public.favorites 
WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE email LIKE 'bot_voter_%' 
       OR email LIKE 'agent_sim_%' 
       OR email LIKE 'bot%'
);

DELETE FROM public.comments 
WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE email LIKE 'bot_voter_%' 
       OR email LIKE 'agent_sim_%' 
       OR email LIKE 'bot%'
);

DELETE FROM public.follows 
WHERE follower_id IN (
    SELECT id FROM public.users 
    WHERE email LIKE 'bot_voter_%' 
       OR email LIKE 'agent_sim_%' 
       OR email LIKE 'bot%'
) OR following_id IN (
    SELECT id FROM public.users 
    WHERE email LIKE 'bot_voter_%' 
       OR email LIKE 'agent_sim_%' 
       OR email LIKE 'bot%'
);

DELETE FROM public.notifications
WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE email LIKE 'bot_voter_%' 
       OR email LIKE 'agent_sim_%' 
       OR email LIKE 'bot%'
) OR related_user_id IN (
    SELECT id FROM public.users 
    WHERE email LIKE 'bot_voter_%' 
       OR email LIKE 'agent_sim_%' 
       OR email LIKE 'bot%'
);

-- 2. ลบรูปภาพทั้งหมดที่บอทอัปโหลดขึ้นมา (รวมรูปภาพจำลองด้วย)
DELETE FROM public.photos 
WHERE photographer_id IN (
    SELECT id FROM public.users 
    WHERE email LIKE 'bot_voter_%' 
       OR email LIKE 'agent_sim_%' 
       OR email LIKE 'bot%'
) OR slug LIKE 'sim-photo-%';

-- 3. ลบโปรไฟล์ของบอทออกจากตารางสาธารณะ
DELETE FROM public.users 
WHERE email LIKE 'bot_voter_%' 
   OR email LIKE 'agent_sim_%' 
   OR email LIKE 'bot%';

-- 4. ลบบัญชีผู้ใช้ของบอทออกจากตารางระบบสมาชิกหลัก
DELETE FROM auth.users 
WHERE email LIKE 'bot_voter_%' 
   OR email LIKE 'agent_sim_%' 
   OR email LIKE 'bot%';

-- 5. อัปเดตสถิติและคะแนนของรูปภาพช่างภาพจริงให้ถูกต้อง (นับเฉพาะโหวตของคนจริงๆ)
UPDATE public.photos p
SET 
    likes_count = (SELECT count(*) FROM public.votes WHERE photo_id = p.id),
    favorites_count = (SELECT count(*) FROM public.favorites WHERE photo_id = p.id),
    comments_count = (SELECT count(*) FROM public.comments WHERE photo_id = p.id AND is_hidden = false);

UPDATE public.photos
SET engagement = (coalesce(likes_count, 0) * 1) + 
                 (coalesce(favorites_count, 0) * 2) + 
                 (coalesce(comments_count, 0) * 4);

COMMIT;
