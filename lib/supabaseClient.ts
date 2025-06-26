import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// クライアントサイド用のSupabaseクライアント（シングルトン）
let supabaseClient: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
})()

// サーバーサイド用の管理者クライアント（シングルトン）
let supabaseAdminClient: ReturnType<typeof createClient> | null = null

export const supabaseAdmin = (() => {
  if (!supabaseAdminClient && supabaseServiceKey) {
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseAdminClient
})()

// 環境変数の存在チェック
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

export const isSupabaseAdminConfigured = () => {
  return !!(supabaseUrl && supabaseServiceKey)
}
