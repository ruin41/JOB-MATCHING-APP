-- matchesテーブルの作成
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_company UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_jobseeker UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_by TEXT NOT NULL CHECK (matched_by IN ('auto', 'company_reply')),
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 同じ企業と求職者の組み合わせは一度だけマッチ可能
  UNIQUE (user_id_company, user_id_jobseeker)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_matches_company ON matches(user_id_company);
CREATE INDEX IF NOT EXISTS idx_matches_jobseeker ON matches(user_id_jobseeker);
CREATE INDEX IF NOT EXISTS idx_matches_matched_at ON matches(matched_at);

-- RLS（Row Level Security）の設定
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分が関わるマッチのみ閲覧可能
CREATE POLICY "Users can view their own matches" ON matches
  FOR SELECT USING (
    auth.uid() = user_id_company OR 
    auth.uid() = user_id_jobseeker
  );

-- ユーザーは自分が関わるマッチのみ作成可能
CREATE POLICY "Users can create matches they are part of" ON matches
  FOR INSERT WITH CHECK (
    auth.uid() = user_id_company OR 
    auth.uid() = user_id_jobseeker
  );

-- 更新は禁止（マッチは一度成立したら変更不可）
CREATE POLICY "Matches cannot be updated" ON matches
  FOR UPDATE USING (false);

-- 削除は禁止（マッチは削除不可）
CREATE POLICY "Matches cannot be deleted" ON matches
  FOR DELETE USING (false);
