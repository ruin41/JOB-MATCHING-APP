-- プロフィール表示の問題をデバッグするためのSQLスクリプト
-- 実際のユーザーIDに置き換えて実行してください

-- 1. 現在のユーザーID（テスト用）
-- 実際のユーザーIDに置き換えてください
SET @current_user_id = 'your-user-id-here';

-- 2. 全ての企業プロフィールを確認
SELECT 
    'All Companies' as category,
    user_id,
    company_name,
    created_at
FROM company_profiles
WHERE user_id != @current_user_id
ORDER BY created_at DESC;

-- 3. 全ての求職者プロフィールを確認
SELECT 
    'All Jobseekers' as category,
    user_id,
    name,
    created_at
FROM jobseeker_profiles
WHERE user_id != @current_user_id
ORDER BY created_at DESC;

-- 4. 現在のユーザーが送信したいいねを確認
SELECT 
    'Sent Likes' as category,
    sender_user_id,
    receiver_user_id,
    sender_type,
    created_at
FROM likes
WHERE sender_user_id = @current_user_id
ORDER BY created_at DESC;

-- 5. 現在のユーザーが受信したいいねを確認
SELECT 
    'Received Likes' as category,
    sender_user_id,
    receiver_user_id,
    sender_type,
    created_at
FROM likes
WHERE receiver_user_id = @current_user_id
ORDER BY created_at DESC;

-- 6. 現在のユーザーのマッチを確認
SELECT 
    'Matches' as category,
    user_id_company,
    user_id_jobseeker,
    matched_by,
    matched_at
FROM matches
WHERE user_id_company = @current_user_id OR user_id_jobseeker = @current_user_id
ORDER BY matched_at DESC;

-- 7. 除外されるべきユーザーIDの統合リスト
WITH liked_users AS (
    SELECT receiver_user_id as excluded_user_id, 'liked' as reason
    FROM likes
    WHERE sender_user_id = @current_user_id
),
matched_users AS (
    SELECT 
        CASE 
            WHEN user_id_company = @current_user_id THEN user_id_jobseeker
            ELSE user_id_company
        END as excluded_user_id,
        'matched' as reason
    FROM matches
    WHERE user_id_company = @current_user_id OR user_id_jobseeker = @current_user_id
)
SELECT 
    'Excluded Users' as category,
    excluded_user_id,
    reason
FROM liked_users
UNION ALL
SELECT 
    'Excluded Users' as category,
    excluded_user_id,
    reason
FROM matched_users
ORDER BY excluded_user_id;

-- 8. 表示されるべき企業（除外後）
WITH excluded_users AS (
    SELECT receiver_user_id as user_id FROM likes WHERE sender_user_id = @current_user_id
    UNION
    SELECT 
        CASE 
            WHEN user_id_company = @current_user_id THEN user_id_jobseeker
            ELSE user_id_company
        END as user_id
    FROM matches
    WHERE user_id_company = @current_user_id OR user_id_jobseeker = @current_user_id
)
SELECT 
    'Visible Companies' as category,
    cp.user_id,
    cp.company_name,
    cp.created_at
FROM company_profiles cp
WHERE cp.user_id != @current_user_id
  AND cp.user_id NOT IN (SELECT user_id FROM excluded_users)
ORDER BY cp.created_at DESC;

-- 9. 表示されるべき求職者（除外後）
WITH excluded_users AS (
    SELECT receiver_user_id as user_id FROM likes WHERE sender_user_id = @current_user_id
    UNION
    SELECT 
        CASE 
            WHEN user_id_company = @current_user_id THEN user_id_jobseeker
            ELSE user_id_company
        END as user_id
    FROM matches
    WHERE user_id_company = @current_user_id OR user_id_jobseeker = @current_user_id
)
SELECT 
    'Visible Jobseekers' as category,
    jp.user_id,
    jp.name,
    jp.created_at
FROM jobseeker_profiles jp
WHERE jp.user_id != @current_user_id
  AND jp.user_id NOT IN (SELECT user_id FROM excluded_users)
ORDER BY jp.created_at DESC;
