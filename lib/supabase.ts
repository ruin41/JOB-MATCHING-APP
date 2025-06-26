import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

// Re-export createClient for other modules
export { createClient } from "@supabase/supabase-js"

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Only create client if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey ? supabaseCreateClient(supabaseUrl, supabaseAnonKey) : null

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => {
  return supabaseUrl && supabaseAnonKey && supabase !== null
}

// 型定義
export type User = {
  id: string
  email: string
  password: string
  created_at?: string
  updated_at?: string
}

// Users CRUD操作
export const usersAPI = {
  // Create - ユーザー新規登録
  async create(userData: { email: string; password: string }): Promise<{ data: User | null; error: any }> {
    if (!isSupabaseAvailable()) {
      console.log("Mock user creation:", userData.email)
      return {
        data: {
          id: `user_${Date.now()}`,
          email: userData.email,
          password: userData.password,
          created_at: new Date().toISOString(),
        },
        error: null,
      }
    }

    try {
      const { data, error } = await supabase!.from("users").insert([userData]).select().single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Read - ユーザー取得
  async getById(id: string): Promise<{ data: User | null; error: any }> {
    if (!isSupabaseAvailable()) {
      return {
        data: {
          id,
          email: "demo@example.com",
          password: "",
          created_at: new Date().toISOString(),
        },
        error: null,
      }
    }

    try {
      const { data, error } = await supabase!.from("users").select("*").eq("id", id).single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update - ユーザー更新
  async update(
    id: string,
    userData: { email?: string; password?: string },
  ): Promise<{ data: User | null; error: any }> {
    if (!isSupabaseAvailable()) {
      return {
        data: {
          id,
          ...userData,
          created_at: new Date().toISOString(),
        } as User,
        error: null,
      }
    }

    try {
      const { data, error } = await supabase!.from("users").update(userData).eq("id", id).select().single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete - ユーザー削除
  async delete(id: string): Promise<{ error: any }> {
    if (!isSupabaseAvailable()) {
      console.log("Mock user deletion:", id)
      return { error: null }
    }

    try {
      const { error } = await supabase!.from("users").delete().eq("id", id)
      return { error }
    } catch (error) {
      return { error }
    }
  },
}
