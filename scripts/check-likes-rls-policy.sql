-- likesテーブルのRLSポリシーを確認・設定するスクリプト

-- 現在のRLSポリシーを確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'likes';

-- RLSが有効になっているか確認
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'likes';

-- 必要に応じてRLSポリシーを作成
-- （既存のポリシーがない場合のみ実行）

-- RLSを有効化
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（必要に応じて）
-- DROP POLICY IF EXISTS "Allow read/write for own likes" ON public.likes;

-- 新しいポリシーを作成
CREATE POLICY "Allow read/write for own likes"
ON public.likes
FOR ALL
TO public
USING (
    sender_user_id = auth.uid() OR receiver_user_id = auth.uid()
)
WITH CHECK (
    sender_user_id = auth.uid() OR receiver_user_id = auth.uid()
);

-- ポリシー作成後の確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'likes';
