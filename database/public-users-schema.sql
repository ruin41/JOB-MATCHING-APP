-- public_users テーブルの作成
CREATE TABLE IF NOT EXISTS public_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('company', 'jobseeker')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS（行レベルセキュリティ）を有効化
ALTER TABLE public_users ENABLE ROW LEVEL SECURITY;

-- 自分のデータのみ読み書きできるポリシー
CREATE POLICY "Users can read/write own role" 
ON public_users 
FOR ALL 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_public_users_role ON public_users(role);
CREATE INDEX IF NOT EXISTS idx_public_users_created_at ON public_users(created_at);

-- 既存のテーブルにカラムが存在しない場合は追加
DO $$ 
BEGIN
    -- created_at カラムが存在しない場合は追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'public_users' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE public_users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- updated_at カラムが存在しない場合は追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'public_users' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public_users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 既存のレコードのcreated_atとupdated_atがNULLの場合は現在時刻を設定
UPDATE public_users 
SET created_at = NOW() 
WHERE created_at IS NULL;

UPDATE public_users 
SET updated_at = NOW() 
WHERE updated_at IS NULL;
