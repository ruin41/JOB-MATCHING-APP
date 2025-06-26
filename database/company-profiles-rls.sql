-- company_profilesテーブルのRLS設定

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own company profile" ON company_profiles;
DROP POLICY IF EXISTS "Users can insert own company profile" ON company_profiles;
DROP POLICY IF EXISTS "Users can update own company profile" ON company_profiles;
DROP POLICY IF EXISTS "Users can delete own company profile" ON company_profiles;

-- RLSを有効化
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールのみ表示可能
CREATE POLICY "Users can view own company profile" ON company_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- 自分のプロフィールのみ挿入可能
CREATE POLICY "Users can insert own company profile" ON company_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own company profile" ON company_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 自分のプロフィールのみ削除可能
CREATE POLICY "Users can delete own company profile" ON company_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 企業プロフィールを他のユーザーが閲覧可能（求職者がスワイプで見るため）
CREATE POLICY "Allow jobseekers to view company profiles" ON company_profiles
    FOR SELECT USING (true);
