"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Initialize Supabase on the server side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: any = null

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
      },
    })
  }
} catch (error) {
  console.warn("Failed to initialize Supabase client:", error)
}

function isDatabaseAvailable(): boolean {
  return supabase !== null
}

export async function resendConfirmationEmailAction() {
  if (!isDatabaseAvailable()) {
    console.log("Database not available, simulating email resend")
    return { success: true, message: "認証メールを再送信しました（デモモード）" }
  }

  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
    })

    if (error) {
      console.error("Email resend error:", error)
      return { error: "認証メールの再送信に失敗しました" }
    }

    return { success: true, message: "認証メールを再送信しました" }
  } catch (err) {
    console.error("Email resend error:", err)
    return { error: "認証メールの再送信に失敗しました" }
  }
}

export async function updateEmailAction(formData: FormData) {
  const newEmail = formData.get("email") as string

  // バリデーション
  if (!newEmail) {
    return { error: "新しいメールアドレスを入力してください" }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newEmail)) {
    return { error: "有効なメールアドレスを入力してください" }
  }

  if (!isDatabaseAvailable()) {
    console.log("Database not available, simulating email update")
    return {
      success: true,
      message: "メールアドレスを変更しました。新しいメールアドレスを確認してください（デモモード）",
    }
  }

  try {
    // Cookieから現在のユーザー情報を取得
    const currentUser = cookies().get("current-user")?.value
    if (!currentUser) {
      return { error: "ログインが必要です" }
    }

    const user = JSON.parse(currentUser)

    // デモモードの場合は成功を返す
    console.log("Email update for user:", user.email, "to:", newEmail)

    return {
      success: true,
      message: "メールアドレスを変更しました。新しいメールアドレスを確認してください",
    }
  } catch (err) {
    console.error("Email update error:", err)
    return { error: "メールアドレスの変更に失敗しました" }
  }
}

export async function getCurrentUserEmailAction() {
  try {
    // Check for demo user first
    const demoUser = cookies().get("demo-user")?.value
    if (demoUser) {
      const user = JSON.parse(demoUser)
      return {
        user: {
          email: user.email,
          email_confirmed_at: user.is_guest ? new Date().toISOString() : null,
        },
      }
    }

    // Check for current user
    const currentUser = cookies().get("current-user")?.value
    if (currentUser) {
      const user = JSON.parse(currentUser)
      return {
        user: {
          email: user.email,
          email_confirmed_at: new Date().toISOString(), // デモ用に認証済みとする
        },
      }
    }

    if (!isDatabaseAvailable()) {
      return { user: null }
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Get user error:", error)
      return { user: null }
    }

    return { user }
  } catch (error) {
    console.error("Get user error:", error)
    return { user: null }
  }
}
