-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can read/write own role" ON public_users;

-- 新しいポリシーを作成（認証済みユーザーは自分のレコードを作成・読み書き可能）
CREATE POLICY "Users can manage own data" 
ON public_users 
FOR ALL 
USING (auth.uid() = id);

-- 認証済みユーザーが自分のレコードを挿入できるポリシーを追加
CREATE POLICY "Users can insert own data" 
ON public_users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 認証済みユーザーが自分のレコードを選択できるポリシーを追加
CREATE POLICY "Users can select own data" 
ON public_users 
FOR SELECT 
USING (auth.uid() = id);

-- 認証済みユーザーが自分のレコードを更新できるポリシーを追加
CREATE POLICY "Users can update own data" 
ON public_users 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 認証済みユーザーが自分のレコードを削除できるポリシーを追加
CREATE POLICY "Users can delete own data" 
ON public_users 
FOR DELETE 
USING (auth.uid() = id);

-- RLSが有効になっていることを確認
ALTER TABLE public_users ENABLE ROW LEVEL SECURITY;

-- 現在のポリシー一覧を表示（確認用）
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'public_users';
