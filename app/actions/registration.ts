"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function handleRegister(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const userType = formData.get("userType") as "jobseeker" | "company"

  try {
    // 1. Supabase Auth にユーザーを登録
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return {
        success: false,
        error: authError.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: "ユーザー登録に失敗しました",
      }
    }

    // 2. Auth の戻り値から必要な情報を取得
    const userId = authData.user.id
    const userEmail = authData.user.email
    const createdAt = new Date().toISOString()


    // 3-4. userType に応じて適切なテーブルに insert
    let insertError = null

    if (userType === "jobseeker") {
      const { error } = await supabase.from("users_jobseeker").insert({
        id: userId,
        email: userEmail,
        created_at: createdAt,
      })
      insertError = error
    } else if (userType === "company") {
      const { error } = await supabase.from("users_company").insert({
        id: userId,
        email: userEmail,
        created_at: createdAt,
      })
      insertError = error
    }

    if (insertError) {
      // テーブル insert に失敗した場合、Auth ユーザーも削除を試行（いったんコメントアウトでOK）
      // await supabase.auth.admin.deleteUser(userId)
      return {
        success: false,
        error: `${userType} テーブルへの登録に失敗しました: ${insertError.message}`,
      }
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
    }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      success: false,
      error: "予期しないエラーが発生しました",
    }
  }
}
