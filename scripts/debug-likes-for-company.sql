-- 企業が受け取ったいいねのデバッグ用クエリ
-- 特定の企業IDに対して実行してください

-- 1. 基本的ないいねデータの確認
SELECT 
  id,
  sender_user_id,
  receiver_user_id,
  sender_type,
  created_at
FROM likes 
WHERE receiver_user_id = 'YOUR_COMPANY_USER_ID_HERE'
ORDER BY created_at DESC;

-- 2. 求職者プロフィールと結合した確認
SELECT 
  l.id,
  l.sender_user_id,
  l.receiver_user_id,
  l.sender_type,
  l.created_at,
  jp.name as jobseeker_name,
  jp.job_type as jobseeker_job_type
FROM likes l
LEFT JOIN jobseeker_profiles jp ON l.sender_user_id = jp.user_id
WHERE l.receiver_user_id = 'YOUR_COMPANY_USER_ID_HERE'
ORDER BY l.created_at DESC;

-- 3. マッチ済みユーザーの確認
SELECT 
  user_id_company,
  user_id_jobseeker,
  matched_by,
  matched_at
FROM matches 
WHERE user_id_company = 'YOUR_COMPANY_USER_ID_HERE' 
   OR user_id_jobseeker = 'YOUR_COMPANY_USER_ID_HERE';

-- 4. sender_typeが設定されていないいいねの確認
SELECT 
  id,
  sender_user_id,
  receiver_user_id,
  sender_type,
  created_at
FROM likes 
WHERE receiver_user_id = 'YOUR_COMPANY_USER_ID_HERE'
  AND (sender_type IS NULL OR sender_type = '');
