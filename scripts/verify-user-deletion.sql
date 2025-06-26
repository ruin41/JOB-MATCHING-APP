-- ユーザー退会後のデータ削除確認用SQLスクリプト
-- 実際のユーザーIDを入れて実行してください

-- 1. public_usersテーブルの確認
SELECT 'public_users' as table_name, COUNT(*) as count 
FROM public_users 
WHERE id = 'USER_ID_HERE';

-- 2. jobseeker_profilesテーブルの確認
SELECT 'jobseeker_profiles' as table_name, COUNT(*) as count 
FROM jobseeker_profiles 
WHERE user_id = 'USER_ID_HERE';

-- 3. company_profilesテーブルの確認
SELECT 'company_profiles' as table_name, COUNT(*) as count 
FROM company_profiles 
WHERE user_id = 'USER_ID_HERE';

-- 4. likesテーブルの確認
SELECT 'likes' as table_name, COUNT(*) as count 
FROM likes 
WHERE sender_user_id = 'USER_ID_HERE' OR receiver_user_id = 'USER_ID_HERE';

-- 5. matchesテーブルの確認
SELECT 'matches' as table_name, COUNT(*) as count 
FROM matches 
WHERE user_id_jobseeker = 'USER_ID_HERE' OR user_id_company = 'USER_ID_HERE';

-- 6. swipesテーブルの確認
SELECT 'swipes' as table_name, COUNT(*) as count 
FROM swipes 
WHERE user_id = 'USER_ID_HERE' OR target_user_id = 'USER_ID_HERE';

-- 7. messagesテーブルの確認
SELECT 'messages' as table_name, COUNT(*) as count 
FROM messages 
WHERE sender_id = 'USER_ID_HERE' OR receiver_id = 'USER_ID_HERE';

-- 8. jobseeker_skillsテーブルの確認（間接的）
SELECT 'jobseeker_skills' as table_name, COUNT(*) as count 
FROM jobseeker_skills js
JOIN jobseeker_profiles jp ON js.jobseeker_id = jp.id
WHERE jp.user_id = 'USER_ID_HERE';

-- 9. Storageの確認（SQLでは直接確認できないため、手動確認が必要）
-- avatarsバケット内の以下のパスを確認:
-- - USER_ID_HERE/
-- - companies/USER_ID_HERE/

-- 10. Authentication usersの確認（auth.usersテーブルは直接アクセスできない場合があります）
-- Supabase管理画面のAuthenticationセクションで確認してください
