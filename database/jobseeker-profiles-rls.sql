-- jobseeker_profilesテーブルのRLS設定

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own jobseeker profile" ON jobseeker_profiles;
DROP POLICY IF EXISTS "Users can insert own jobseeker profile" ON jobseeker_profiles;
DROP POLICY IF EXISTS "Users can update own jobseeker profile" ON jobseeker_profiles;
DROP POLICY IF EXISTS "Users can delete own jobseeker profile" ON jobseeker_profiles;

-- RLSを有効化
ALTER TABLE jobseeker_profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールのみ表示可能
CREATE POLICY "Users can view own jobseeker profile" ON jobseeker_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- 自分のプロフィールのみ挿入可能
CREATE POLICY "Users can insert own jobseeker profile" ON jobseeker_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own jobseeker profile" ON jobseeker_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 自分のプロフィールのみ削除可能
CREATE POLICY "Users can delete own jobseeker profile" ON jobseeker_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 求職者プロフィールを他のユーザーが閲覧可能（企業がスワイプで見るため）
CREATE POLICY "Allow companies to view jobseeker profiles" ON jobseeker_profiles
    FOR SELECT USING (true);
