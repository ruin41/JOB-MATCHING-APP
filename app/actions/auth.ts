"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabaseClient"

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// データベースが利用可能かチェック
async function isDatabaseAvailable(): Promise<boolean> {
  return isSupabaseConfigured()
}

// ユーザーの登録状態をチェックする関数
async function checkUserRegistrationStatus(userId: string, userType?: string) {
  try {
    console.log("=== ユーザー登録状態チェック開始 ===")
    console.log("ユーザーID:", userId)
    console.log("ユーザータイプ:", userType)

    if (!supabaseAdmin) {
      console.log("管理者クライアント利用不可、デモモードとして処理")
      return {
        hasRole: !!userType,
        hasProfile: false,
        redirectPath: userType ? `/signup/${userType}-profile` : "/signup/role",
      }
    }

    // ロールが設定されていない場合
    if (!userType) {
      console.log("ロール未設定 → ロール選択画面")
      return {
        hasRole: false,
        hasProfile: false,
        redirectPath: "/signup/role",
      }
    }

    // プロフィールの存在をチェック
    let hasProfile = false

    if (userType === "jobseeker") {
      const { data: profile, error } = await supabaseAdmin
        .from("jobseeker_profiles")
        .select("id")
        .eq("user_id", userId)
        .single()

      hasProfile = !error && !!profile
      console.log("求職者プロフィール存在:", hasProfile)
    } else if (userType === "company") {
      const { data: profile, error } = await supabaseAdmin
        .from("company_profiles")
        .select("id")
        .eq("user_id", userId)
        .single()

      hasProfile = !error && !!profile
      console.log("企業プロフィール存在:", hasProfile)
    }

    // リダイレクト先を決定
    let redirectPath: string
    if (!hasProfile) {
      redirectPath = `/signup/${userType}-profile`
      console.log("プロフィール未作成 → プロフィール登録画面")
    } else {
      redirectPath = `/swipe/${userType}`
      console.log("登録完了 → スワイプ画面")
    }

    return {
      hasRole: true,
      hasProfile,
      redirectPath,
    }
  } catch (error) {
    console.error("登録状態チェックエラー:", error)
    // エラーの場合はロール選択画面にリダイレクト
    return {
      hasRole: false,
      hasProfile: false,
      redirectPath: "/signup/role",
    }
  }
}

export async function signInAction(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    console.log("=== signInAction 開始 ===")
    console.log("Email:", email)

    // バリデーション
    if (!email || !password) {
      return { error: "メールアドレスとパスワードを入力してください" }
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    // 既存のセッションをクリア（新しいログインのため）
    try {
      await supabase.auth.signOut()
      console.log("既存セッションをクリア")
    } catch (signOutError) {
      console.log("セッションクリアエラー（問題なし）:", signOutError)
    }

    // Supabaseでログイン
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("ログインエラー:", error)
      return { error: `ログインに失敗しました: ${error.message}` }
    }

    if (data.user && data.session) {
      console.log("ログイン成功:", data.user.id)
      console.log("ユーザータイプ:", data.user.user_metadata?.user_type)

      // セッション情報をCookieに保存
      cookieStore.set("supabase-auth-token", data.session.access_token, {
        path: "/",
        maxAge: data.session.expires_in,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      // リフレッシュトークンを保存
      if (data.session.refresh_token) {
        cookieStore.set("supabase-refresh-token", data.session.refresh_token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30日
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })
      }

      // ユーザー情報を保存
      cookieStore.set(
        "current-user",
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        }),
        {
          path: "/",
          maxAge: 60 * 60 * 24, // 24時間
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        },
      )

      // sb-user Cookieも設定（プロフィール作成時に使用）
      cookieStore.set("sb-user", JSON.stringify(data.user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: data.session.expires_in,
        path: "/",
      })

      const userType = data.user.user_metadata?.user_type

      if (!userType) {
        console.log("ユーザータイプ未設定 → ロール選択画面")
        return {
          success: true,
          user: data.user,
          session: data.session,
          userType: null,
          redirectPath: "/signup/role",
        }
      }

      // ユーザーの登録状態をチェックして適切なリダイレクト先を決定
      const registrationStatus = await checkUserRegistrationStatus(data.user.id, userType)

      console.log("登録状態:", registrationStatus)
      console.log("Cookie設定完了、ログイン成功を返す")

      return {
        success: true,
        user: data.user,
        session: data.session,
        userType: userType,
        redirectPath: registrationStatus.redirectPath,
      }
    }

    return { error: "予期しないエラーが発生しました" }
  } catch (error) {
    console.error("signInAction エラー:", error)
    return { error: `ログイン処理でエラーが発生しました: ${(error as Error).message}` }
  }
}

export async function signUpWithRoleAction(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const role = formData.get("role") as string

    console.log("=== signUpWithRoleAction 開始 ===")
    console.log("Role:", role)
    console.log("Email:", email)

    // バリデーション
    if (!email || !password || !confirmPassword || !role) {
      return { error: "すべての項目を入力してください" }
    }

    if (password.length < 8) {
      return { error: "パスワードは8文字以上で入力してください" }
    }

    if (password !== confirmPassword) {
      return { error: "パスワードが一致しません" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "有効なメールアドレスを入力してください" }
    }

    if (!["company", "jobseeker"].includes(role)) {
      return { error: "有効なロールを選択してください" }
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    if (!(await isDatabaseAvailable())) {
      console.log("デモモードでユーザー作成")
      const mockUser = {
        id: `${role}_${Date.now()}`,
        email,
        user_metadata: { user_type: role },
      }

      console.log("デモユーザー作成:", mockUser)

      // デモユーザーのCookieを確実に設定
      try {
        cookieStore.set("demo-user", JSON.stringify(mockUser), {
          path: "/",
          maxAge: 60 * 60 * 24,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })

        cookieStore.set("current-user", JSON.stringify(mockUser), {
          path: "/",
          maxAge: 60 * 60 * 24,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })

        console.log("デモユーザーCookie設定完了:", mockUser.id)

        // Cookie設定の確認
        const demoUserCookie = cookieStore.get("demo-user")?.value
        const currentUserCookie = cookieStore.get("current-user")?.value
        console.log("Cookie設定確認 - demo-user:", !!demoUserCookie)
        console.log("Cookie設定確認 - current-user:", !!currentUserCookie)

        return { success: true, user: mockUser, role }
      } catch (cookieError) {
        console.error("Cookie設定エラー:", cookieError)
        return { error: "セッション保存に失敗しました" }
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: role,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "このメールアドレスは既に登録されています" }
      } else if (error.message.includes("Password should be")) {
        return { error: "パスワードは8文字以上で、英数字を含めてください" }
      } else {
        return { error: "登録に失敗しました: " + error.message }
      }
    }

    if (data.user) {
      console.log("Supabaseユーザー作成成功:", data.user.id)

      // Supabaseユーザーの場合もCookieを確実に設定
      try {
        if (data.session) {
          cookieStore.set("supabase-auth-token", data.session.access_token, {
            path: "/",
            maxAge: data.session.expires_in,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          })

          if (data.session.refresh_token) {
            cookieStore.set("supabase-refresh-token", data.session.refresh_token, {
              path: "/",
              maxAge: 60 * 60 * 24 * 30,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
            })
          }
        }

        // current-userを設定
        cookieStore.set(
          "current-user",
          JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
          }),
          {
            path: "/",
            maxAge: 60 * 60 * 24,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          },
        )

        console.log("Supabase Cookie設定完了")

        // Cookie設定の確認
        const currentUserCookie = cookieStore.get("current-user")?.value
        console.log("Cookie設定確認 - current-user:", !!currentUserCookie)
      } catch (cookieError) {
        console.error("Supabase Cookie設定エラー:", cookieError)
        return { error: "セッション保存に失敗しました" }
      }

      return { success: true, user: data.user, session: data.session, role }
    }

    return { error: "予期しないエラーが発生しました" }
  } catch (err) {
    console.error("signUpWithRoleAction エラー:", err)
    return { error: "登録に失敗しました" }
  }
}

export async function signUpJobseekerAction(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // バリデーション
    if (!email || !password || !confirmPassword) {
      return { error: "すべての項目を入力してください" }
    }

    if (password.length < 8) {
      return { error: "パスワードは8文字以上で入力してください" }
    }

    if (password !== confirmPassword) {
      return { error: "パスワードが一致しません" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "有効なメールアドレスを入力してください" }
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    if (!(await isDatabaseAvailable())) {
      const mockUser = {
        id: `jobseeker_${Date.now()}`,
        email,
        user_metadata: { user_type: "jobseeker" },
      }

      cookieStore.set("demo-user", JSON.stringify(mockUser), {
        path: "/",
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      cookieStore.set("current-user", JSON.stringify(mockUser), {
        path: "/",
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      return { success: true, user: mockUser, session: null }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: "jobseeker",
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "このメールアドレスは既に登録されています" }
      } else if (error.message.includes("Password should be")) {
        return { error: "パスワードは8文字以上で、英数字を含めてください" }
      } else {
        return { error: "登録に失敗しました: " + error.message }
      }
    }

    if (data.user) {
      // Cookieを設定
      if (data.session) {
        cookieStore.set("supabase-auth-token", data.session.access_token, {
          path: "/",
          maxAge: data.session.expires_in,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })

        if (data.session.refresh_token) {
          cookieStore.set("supabase-refresh-token", data.session.refresh_token, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          })
        }
      }

      cookieStore.set(
        "current-user",
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        }),
        {
          path: "/",
          maxAge: 60 * 60 * 24,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        },
      )

      return { success: true, user: data.user, session: data.session }
    }

    return { error: "予期しないエラーが発生しました" }
  } catch (err) {
    return { error: "予期しないエラーが発生しました" }
  }
}

export async function signUpCompanyAction(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    console.log("=== signUpCompanyAction 開始 ===")
    console.log("Email:", email)

    // バリデーション
    if (!email || !password || !confirmPassword) {
      return { error: "すべての項目を入力してください" }
    }

    if (password.length < 8) {
      return { error: "パスワードは8文字以上で入力してください" }
    }

    if (password !== confirmPassword) {
      return { error: "パスワードが一致しません" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "有効なメールアドレスを入力してください" }
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    if (!(await isDatabaseAvailable())) {
      console.log("デモモードで企業ユーザー作成")
      const mockUser = {
        id: `company_${Date.now()}`,
        email,
        user_metadata: { user_type: "company" },
      }

      // デモユーザーのCookieを設定
      cookieStore.set("demo-user", JSON.stringify(mockUser), {
        path: "/",
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      // current-userも設定
      cookieStore.set("current-user", JSON.stringify(mockUser), {
        path: "/",
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      console.log("企業デモユーザーCookie設定完了:", mockUser.id)
      return { success: true, user: mockUser, session: null }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: "company",
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "このメールアドレスは既に登録されています" }
      } else if (error.message.includes("Password should be")) {
        return { error: "パスワードは8文字以上で、英数字を含めてください" }
      } else {
        return { error: "登録に失敗しました: " + error.message }
      }
    }

    if (data.user) {
      console.log("Supabase企業ユーザー作成成功:", data.user.id)

      // Cookieを設定
      if (data.session) {
        cookieStore.set("supabase-auth-token", data.session.access_token, {
          path: "/",
          maxAge: data.session.expires_in,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })

        if (data.session.refresh_token) {
          cookieStore.set("supabase-refresh-token", data.session.refresh_token, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          })
        }
      }

      cookieStore.set(
        "current-user",
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        }),
        {
          path: "/",
          maxAge: 60 * 60 * 24,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        },
      )

      console.log("企業ユーザーCookie設定完了")
      return { success: true, user: data.user, session: data.session }
    }

    return { error: "予期しないエラーが発生しました" }
  } catch (err) {
    console.error("signUpCompanyAction エラー:", err)
    return { error: "予期しないエラーが発生しました" }
  }
}

export async function getUserRoleAction() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    // デモユーザーをチェック
    const demoUser = cookieStore.get("demo-user")?.value
    if (demoUser) {
      const user = JSON.parse(demoUser)
      return {
        success: true,
        role: user.user_metadata?.user_type || "jobseeker",
        isDemo: true,
      }
    }

    if (!(await isDatabaseAvailable())) {
      return { success: false, error: "Database not available" }
    }

    const authToken = cookieStore.get("supabase-auth-token")?.value
    if (!authToken) {
      return { success: false, error: "No session found" }
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(authToken)

    if (error || !user) {
      return { success: false, error: "Invalid session" }
    }

    return {
      success: true,
      role: user.user_metadata?.user_type || "jobseeker",
      isDemo: false,
    }
  } catch (error) {
    return { success: false, error: "Failed to get user role" }
  }
}

export async function createUserAction(userData: any) {
  try {
    if (!(await isDatabaseAvailable())) {
      const mockUser = {
        id: `user_${Date.now()}`,
        ...userData,
      }
      return { success: true, user: mockUser }
    }

    // 実際のユーザー作成ロジックをここに実装
    // 例: データベースにユーザー情報を保存する

    return { success: true, user: userData }
  } catch (error) {
    return { error: "ユーザー作成に失敗しました" }
  }
}

export async function restoreSessionAction(refreshToken?: string) {
  console.log("=== restoreSessionAction 開始 ===")

  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    // refreshTokenが渡されていない場合はCookieから取得
    const tokenToUse = refreshToken || cookieStore.get("supabase-refresh-token")?.value

    if (!tokenToUse) {
      console.log("リフレッシュトークンがありません")
      return { success: false, error: "リフレッシュトークンがありません" }
    }

    console.log("リフレッシュトークンでセッション復元を試行")
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: tokenToUse })

    if (error) {
      console.error("セッション復元エラー:", error)
      return { success: false, error: error.message }
    }

    if (data.session && data.user) {
      console.log("セッション復元成功:", data.user.id)

      // 新しいセッション情報をCookieに保存
      cookieStore.set("supabase-auth-token", data.session.access_token, {
        path: "/",
        maxAge: data.session.expires_in,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      if (data.session.refresh_token) {
        cookieStore.set("supabase-refresh-token", data.session.refresh_token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30日
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })
      }

      // ユーザー情報を更新
      cookieStore.set(
        "current-user",
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        }),
        {
          path: "/",
          maxAge: 60 * 60 * 24, // 24時間
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        },
      )

      // sb-user Cookieも更新
      cookieStore.set("sb-user", JSON.stringify(data.user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: data.session.expires_in,
        path: "/",
      })

      return { success: true, session: data.session, user: data.user }
    }

    console.log("セッション復元失敗: セッションがありません")
    return { success: false, error: "セッションの復元に失敗しました" }
  } catch (error) {
    console.error("restoreSessionAction エラー:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function checkSessionStatusAction() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    // デモユーザーをチェック
    const demoUser = cookieStore.get("demo-user")?.value
    if (demoUser) {
      return { isAuthenticated: true, isDemo: true }
    }

    // 通常のセッションをチェック
    const authToken = cookieStore.get("supabase-auth-token")?.value
    if (!authToken) {
      return { isAuthenticated: false }
    }

    if (!(await isDatabaseAvailable())) {
      return { isAuthenticated: false }
    }

    // トークンの有効性をチェック
    const { data, error } = await supabase.auth.getUser(authToken)

    if (error || !data.user) {
      return { isAuthenticated: false }
    }

    return { isAuthenticated: true, isDemo: false }
  } catch (error) {
    return { isAuthenticated: false }
  }
}

export async function getRedirectPathAfterLogin(userType: string) {
  try {
    const path = userType === "company" ? "/swipe/company" : "/swipe/jobseeker"
    return path
  } catch (error) {
    return "/swipe/jobseeker" // デフォルト
  }
}

export async function signOutAction() {
  try {
    console.log("=== signOutAction 開始 ===")

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    // Supabaseからサインアウト
    await supabase.auth.signOut()
    console.log("Supabaseサインアウト完了")

    // すべての認証関連Cookieを削除
    const cookiesToDelete = ["current-user", "demo-user", "supabase-auth-token", "supabase-refresh-token", "sb-user"]

    cookiesToDelete.forEach((cookieName) => {
      cookieStore.delete(cookieName)
      cookieStore.set(cookieName, "", {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
    })

    console.log("全認証Cookieクリア完了")

    // 成功を返す（redirectは使わない）
    return { success: true }
  } catch (error) {
    console.error("signOutAction エラー:", error)
    return { success: false, error: error.message }
  }
}

export async function getCurrentUserAction() {
  try {
    console.log("=== getCurrentUserAction 開始 ===")

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    // ユーザーがデータベースに存在するかチェックする関数
    const checkUserExistsInDatabase = async (userId: string, userType: string) => {
      if (!supabaseAdmin) {
        console.log("管理者クライアント利用不可、存在チェックスキップ")
        return true // デモモードの場合はスキップ
      }

      try {
        if (userType === "jobseeker") {
          const { data, error } = await supabaseAdmin
            .from("jobseeker_profiles")
            .select("id")
            .eq("user_id", userId)
            .single()

          const exists = !error && !!data
          console.log("求職者プロフィール存在確認:", exists)
          return exists
        } else if (userType === "company") {
          const { data, error } = await supabaseAdmin
            .from("company_profiles")
            .select("id")
            .eq("user_id", userId)
            .single()

          const exists = !error && !!data
          console.log("企業プロフィール存在確認:", exists)
          return exists
        }
        return false
      } catch (error) {
        console.error("プロフィール存在確認エラー:", error)
        return false
      }
    }

    // セッションを無効化する関数
    const invalidateSession = async () => {
      console.log("セッション無効化を実行")
      try {
        await supabase.auth.signOut()

        // Cookieもクリア
        const cookiesToDelete = [
          "current-user",
          "demo-user",
          "supabase-auth-token",
          "supabase-refresh-token",
          "sb-user",
        ]
        cookiesToDelete.forEach((cookieName) => {
          cookieStore.delete(cookieName)
          cookieStore.set(cookieName, "", {
            maxAge: 0,
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          })
        })
        console.log("セッション無効化完了")
      } catch (error) {
        console.error("セッション無効化エラー:", error)
      }
    }

    // 1. デモユーザーCookieをチェック
    const demoUserCookie = cookieStore.get("demo-user")
    if (demoUserCookie) {
      try {
        const demoUser = JSON.parse(demoUserCookie.value)
        console.log("デモユーザーCookieから取得:", demoUser.id)
        return {
          user: demoUser,
          userType: demoUser.user_metadata?.user_type,
          isDemo: true,
        }
      } catch (e) {
        console.error("デモユーザーCookie解析エラー:", e)
      }
    }

    // 2. current-userCookieをチェック
    const currentUserCookie = cookieStore.get("current-user")
    if (currentUserCookie) {
      try {
        const userData = JSON.parse(currentUserCookie.value)
        console.log("current-user Cookieから取得:", userData.id)

        // データベースが利用可能な場合、プロフィール存在確認
        if (await isDatabaseAvailable()) {
          const userType = userData.user_metadata?.user_type
          if (userType) {
            const userExists = await checkUserExistsInDatabase(userData.id, userType)
            if (!userExists) {
              console.log("ユーザーがデータベースに存在しない（退会済み）、セッション無効化")
              await invalidateSession()
              return { user: null, userType: null, isDemo: false }
            }
          }

          // Supabaseセッションも確認して最新の情報を取得
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession()

          if (session?.user && !sessionError) {
            console.log("Supabaseセッションも有効:", session.user.id)

            // Supabaseセッションのユーザーもプロフィール存在確認
            const sessionUserType = session.user.user_metadata?.user_type
            if (sessionUserType) {
              const sessionUserExists = await checkUserExistsInDatabase(session.user.id, sessionUserType)
              if (!sessionUserExists) {
                console.log("Supabaseセッションユーザーがデータベースに存在しない（退会済み）、セッション無効化")
                await invalidateSession()
                return { user: null, userType: null, isDemo: false }
              }
            }

            // 最新のユーザー情報でCookieを更新
            cookieStore.set(
              "current-user",
              JSON.stringify({
                id: session.user.id,
                email: session.user.email,
                user_metadata: session.user.user_metadata,
              }),
              {
                path: "/",
                maxAge: 60 * 60 * 24, // 24時間
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
              },
            )

            return {
              user: session.user,
              userType: session.user.user_metadata?.user_type,
              isDemo: false,
            }
          } else {
            console.log("Supabaseセッション無効、Cookieデータを使用")
          }
        }

        return {
          user: userData,
          userType: userData.user_metadata?.user_type,
          isDemo: false,
        }
      } catch (e) {
        console.error("current-user Cookie解析エラー:", e)
      }
    }

    // 3. Supabaseセッションを直接チェック
    if (await isDatabaseAvailable()) {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Supabaseセッション取得エラー:", sessionError)
      }

      if (session?.user) {
        console.log("Supabaseセッション有効:", session.user.id)
        console.log("ユーザータイプ:", session.user.user_metadata?.user_type)

        // プロフィール存在確認
        const userType = session.user.user_metadata?.user_type
        if (userType) {
          const userExists = await checkUserExistsInDatabase(session.user.id, userType)
          if (!userExists) {
            console.log("Supabaseセッションユーザーがデータベースに存在しない（退会済み）、セッション無効化")
            await invalidateSession()
            return { user: null, userType: null, isDemo: false }
          }
        }

        // current-userCookieを更新
        cookieStore.set(
          "current-user",
          JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
          }),
          {
            path: "/",
            maxAge: 60 * 60 * 24, // 24時間
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          },
        )

        return {
          user: session.user,
          userType: session.user.user_metadata?.user_type,
          isDemo: false,
        }
      }
    }

    // 4. sb-userという名前のCookieをチェック
    const sbUserCookie = cookieStore.get("sb-user")
    if (sbUserCookie) {
      try {
        const userData = JSON.parse(sbUserCookie.value)
        console.log("sb-user Cookieから取得:", userData.id)

        // データベースが利用可能な場合、プロフィール存在確認
        if (await isDatabaseAvailable()) {
          const userType = userData.user_metadata?.user_type
          if (userType) {
            const userExists = await checkUserExistsInDatabase(userData.id, userType)
            if (!userExists) {
              console.log("sb-userがデータベースに存在しない（退会済み）、セッション無効化")
              await invalidateSession()
              return { user: null, userType: null, isDemo: false }
            }
          }
        }

        return {
          user: userData,
          userType: userData.user_metadata?.user_type,
          isDemo: false,
        }
      } catch (e) {
        console.error("sb-user Cookie解析エラー:", e)
      }
    }

    console.log("有効なユーザーセッションが見つかりません")
    return { user: null, userType: null, isDemo: false }
  } catch (error) {
    console.error("getCurrentUserAction エラー:", error)
    return { user: null, userType: null, isDemo: false }
  }
}

export async function verifySessionAction() {
  try {
    console.log("=== verifySessionAction 開始 ===")

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    // デモユーザーをチェック
    const demoUser = cookieStore.get("demo-user")?.value
    if (demoUser) {
      const user = JSON.parse(demoUser)
      console.log("デモユーザーセッション確認:", user.id, user.user_metadata?.user_type)
      return {
        success: true,
        user: user,
        isDemo: true,
      }
    }

    // current-userからもチェック
    const currentUser = cookieStore.get("current-user")?.value
    if (currentUser) {
      const user = JSON.parse(currentUser)
      console.log("current-userセッション確認:", user.id, user.user_metadata?.user_type)
      return {
        success: true,
        user: user,
        isDemo: false,
      }
    }

    if (!(await isDatabaseAvailable())) {
      console.log("データベース利用不可")
      return { success: false, error: "Database not available" }
    }

    const authToken = cookieStore.get("supabase-auth-token")?.value
    if (!authToken) {
      console.log("認証トークンなし")
      return { success: false, error: "No session found" }
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(authToken)

    if (error || !user) {
      console.log("無効なセッション:", error?.message)
      // 無効なセッションをクリア
      cookieStore.delete("supabase-auth-token")
      cookieStore.delete("supabase-refresh-token")
      cookieStore.delete("current-user")
      return { success: false, error: "Invalid session" }
    }

    // Supabaseセッションが正常に取得できたら、Cookieを最新の情報に更新
    cookieStore.set(
      "current-user",
      JSON.stringify({
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      }),
      {
        path: "/",
        maxAge: 60 * 60 * 24, // 24時間
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    )

    console.log("Supabaseセッション確認成功:", user.id)
    return {
      success: true,
      user: user,
      isDemo: false,
    }
  } catch (error) {
    console.error("verifySessionAction エラー:", error)
    return { success: false, error: "Session verification failed" }
  }
}

export async function deleteUserAction(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("=== deleteUserAction 開始 ===")

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    // すべての認証関連Cookieを削除する関数
    const clearAllAuthCookies = () => {
      console.log("すべての認証関連Cookieを削除")
      const cookiesToDelete = ["current-user", "demo-user", "supabase-auth-token", "supabase-refresh-token", "sb-user"]

      cookiesToDelete.forEach((cookieName) => {
        cookieStore.delete(cookieName)
        // 念のため明示的に空文字で上書き
        cookieStore.set(cookieName, "", {
          maxAge: 0,
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })
      })
    }

    // 管理者権限でデータを削除する関数
    const deleteUserDataWithAdmin = async (userId: string) => {
      if (!supabaseAdmin) {
        console.error("管理者クライアントが利用できません")
        return false
      }

      console.log(`管理者権限でユーザーデータを削除: ${userId}`)

      try {
        // 1. avatarsバケットから画像を削除（個人用とcompanies用の両方）
        console.log("1. avatarsバケットから画像を削除")
        try {
          // 個人用avatarsフォルダから削除
          const { data: personalFiles, error: personalListError } = await supabaseAdmin.storage
            .from("avatars")
            .list(userId)

          if (!personalListError && personalFiles && personalFiles.length > 0) {
            const personalFilePaths = personalFiles.map((file: any) => `${userId}/${file.name}`)
            console.log("削除対象個人ファイル:", personalFilePaths)

            const { error: personalRemoveError } = await supabaseAdmin.storage.from("avatars").remove(personalFilePaths)

            if (personalRemoveError) {
              console.error("個人Avatar削除エラー:", personalRemoveError)
            } else {
              console.log("個人Avatar削除成功")
            }
          }

          // 企業用companiesフォルダから削除
          const { data: companyFiles, error: companyListError } = await supabaseAdmin.storage
            .from("avatars")
            .list(`companies/${userId}`)

          if (!companyListError && companyFiles && companyFiles.length > 0) {
            const companyFilePaths = companyFiles.map((file: any) => `companies/${userId}/${file.name}`)
            console.log("削除対象企業ファイル:", companyFilePaths)

            const { error: companyRemoveError } = await supabaseAdmin.storage.from("avatars").remove(companyFilePaths)

            if (companyRemoveError) {
              console.error("企業Avatar削除エラー:", companyRemoveError)
            } else {
              console.log("企業Avatar削除成功")
            }
          }

          // 企業フォルダ自体も削除を試行
          try {
            await supabaseAdmin.storage.from("avatars").remove([`companies/${userId}`])
            console.log("企業フォルダ削除成功")
          } catch (folderError) {
            console.log("企業フォルダ削除エラー（問題なし）:", folderError)
          }
        } catch (avatarError) {
          console.error("Avatar削除処理エラー:", avatarError)
        }

        // 2. 関連テーブルからデータを削除（外部キー制約を考慮した順序）
        console.log("2. 関連テーブルからデータを削除")

        // 2-1. matchesテーブルから削除
        try {
          const { error: matchError1 } = await supabaseAdmin.from("matches").delete().eq("user1_id", userId)
          const { error: matchError2 } = await supabaseAdmin.from("matches").delete().eq("user2_id", userId)
          const { error: matchError3 } = await supabaseAdmin.from("matches").delete().eq("user_id_jobseeker", userId)
          const { error: matchError4 } = await supabaseAdmin.from("matches").delete().eq("user_id_company", userId)

          if (matchError1) console.error("Matches削除エラー (user1_id):", matchError1)
          if (matchError2) console.error("Matches削除エラー (user2_id):", matchError2)
          if (matchError3) console.error("Matches削除エラー (user_id_jobseeker):", matchError3)
          if (matchError4) console.error("Matches削除エラー (user_id_company):", matchError4)
          if (!matchError1 && !matchError2 && !matchError3 && !matchError4) console.log("Matches削除成功")
        } catch (matchError) {
          console.error("Matches削除処理エラー:", matchError)
        }

        // 2-2. likesテーブルから削除
        try {
          const { error: likeError1 } = await supabaseAdmin.from("likes").delete().eq("liker_id", userId)
          const { error: likeError2 } = await supabaseAdmin.from("likes").delete().eq("liked_id", userId)
          const { error: likeError3 } = await supabaseAdmin.from("likes").delete().eq("liked_user_id", userId)
          const { error: likeError4 } = await supabaseAdmin.from("likes").delete().eq("sender_user_id", userId)
          const { error: likeError5 } = await supabaseAdmin.from("likes").delete().eq("receiver_user_id", userId)

          if (likeError1) console.error("Likes削除エラー (liker_id):", likeError1)
          if (likeError2) console.error("Likes削除エラー (liked_id):", likeError2)
          if (likeError3) console.error("Likes削除エラー (liked_user_id):", likeError3)
          if (likeError4) console.error("Likes削除エラー (sender_user_id):", likeError4)
          if (likeError5) console.error("Likes削除エラー (receiver_user_id):", likeError5)
          if (!likeError1 && !likeError2 && !likeError3 && !likeError4 && !likeError5) console.log("Likes削除成功")
        } catch (likeError) {
          console.error("Likes削除処理エラー:", likeError)
        }

        // 2-3. swipesテーブルから削除
        try {
          const { error: swipeError1 } = await supabaseAdmin.from("swipes").delete().eq("user_id", userId)
          const { error: swipeError2 } = await supabaseAdmin.from("swipes").delete().eq("target_user_id", userId)

          if (swipeError1) console.error("Swipes削除エラー (user_id):", swipeError1)
          if (swipeError2) console.error("Swipes削除エラー (target_user_id):", swipeError2)
          if (!swipeError1 && !swipeError2) console.log("Swipes削除成功")
        } catch (swipeError) {
          console.error("Swipes削除処理エラー:", swipeError)
        }

        // 2-4. messagesテーブルから削除
        try {
          const { error: messageError1 } = await supabaseAdmin.from("messages").delete().eq("sender_id", userId)
          const { error: messageError2 } = await supabaseAdmin.from("messages").delete().eq("receiver_id", userId)

          if (messageError1) console.error("Messages削除エラー (sender_id):", messageError1)
          if (messageError2) console.error("Messages削除エラー (receiver_id):", messageError2)
          if (!messageError1 && !messageError2) console.log("Messages削除成功")
        } catch (messageError) {
          console.error("Messages削除処理エラー:", messageError)
        }

        // 2-5. jobseeker_skillsテーブルから削除
        try {
          // まず該当するjobseeker_profileのIDを取得
          const { data: jobseekerProfile } = await supabaseAdmin
            .from("jobseeker_profiles")
            .select("id")
            .eq("user_id", userId)
            .single()

          if (jobseekerProfile) {
            const { error: skillError } = await supabaseAdmin
              .from("jobseeker_skills")
              .delete()
              .eq("jobseeker_id", jobseekerProfile.id)

            if (skillError) {
              console.error("Jobseeker skills削除エラー:", skillError)
            } else {
              console.log("Jobseeker skills削除成功")
            }
          }
        } catch (skillError) {
          console.error("Jobseeker skills削除処理エラー:", skillError)
        }

        // 3. プロフィールテーブルから削除
        console.log("3. プロフィールテーブルから削除")

        // 3-1. 求職者プロフィールを削除
        try {
          const { error: jobseekerError } = await supabaseAdmin
            .from("jobseeker_profiles")
            .delete()
            .eq("user_id", userId)

          if (jobseekerError) {
            console.error("Jobseeker profile削除エラー:", jobseekerError)
          } else {
            console.log("Jobseeker profile削除成功")
          }
        } catch (jobseekerError) {
          console.error("Jobseeker profile削除処理エラー:", jobseekerError)
        }

        // 3-2. 企業プロフィールを削除
        try {
          const { error: companyError } = await supabaseAdmin.from("company_profiles").delete().eq("user_id", userId)

          if (companyError) {
            console.error("Company profile削除エラー:", companyError)
          } else {
            console.log("Company profile削除成功")
          }
        } catch (companyError) {
          console.error("Company profile削除処理エラー:", companyError)
        }

        // 4. public_usersテーブルから削除
        console.log("4. public_usersテーブルから削除")
        try {
          const { error: publicUserError } = await supabaseAdmin.from("public_users").delete().eq("id", userId)

          if (publicUserError) {
            console.error("Public users削除エラー:", publicUserError)
          } else {
            console.log("Public users削除成功")
          }
        } catch (publicUserError) {
          console.error("Public users削除処理エラー:", publicUserError)
        }

        // 5. Supabase Authからユーザーを削除（最後に実行）
        console.log("5. Supabase Authからユーザーを削除")
        try {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

          if (deleteError) {
            console.error("Auth削除エラー:", deleteError)
            return false
          } else {
            console.log("Auth削除成功")
            return true
          }
        } catch (authDeleteError) {
          console.error("Auth削除処理エラー:", authDeleteError)
          return false
        }
      } catch (error) {
        console.error("管理者権限でのデータ削除エラー:", error)
        return false
      }
    }

    // 1. デモユーザーをチェック
    const demoUser = cookieStore.get("demo-user")?.value
    if (demoUser) {
      console.log("デモユーザーの退会処理")
      clearAllAuthCookies()
      return { success: true }
    }

    // 2. current-userからもチェック
    const currentUser = cookieStore.get("current-user")?.value
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser)
        console.log("current-userから取得したユーザー:", user.id)

        // データベースが利用可能な場合のみSupabase処理を実行
        if (await isDatabaseAvailable()) {
          // 管理者権限でデータ削除を実行
          const deleteSuccess = await deleteUserDataWithAdmin(user.id)

          if (!deleteSuccess) {
            console.log("管理者権限での削除に失敗、通常の削除処理を試行")

            // 通常のクライアントでサインアウト
            try {
              await supabase.auth.signOut()
              console.log("通常クライアントでサインアウト完了")
            } catch (signOutError) {
              console.error("サインアウトエラー:", signOutError)
            }
          }
        } else {
          console.log("データベース利用不可、Cookieのみクリア")
        }

        // すべてのCookieをクリア
        clearAllAuthCookies()
        return { success: true }
      } catch (parseError) {
        console.error("current-user Cookie解析エラー:", parseError)
      }
    }

    // 3. データベースが利用可能な場合、Supabaseセッションを直接確認
    if (await isDatabaseAvailable()) {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Supabaseセッション取得エラー:", sessionError)
      }

      if (session?.user) {
        console.log("Supabaseセッションから直接ユーザー取得:", session.user.id)

        // 管理者権限でデータ削除を実行
        const deleteSuccess = await deleteUserDataWithAdmin(session.user.id)

        if (!deleteSuccess) {
          console.log("管理者権限での削除に失敗、通常のサインアウトを実行")
          try {
            await supabase.auth.signOut()
          } catch (signOutError) {
            console.error("サインアウトエラー:", signOutError)
          }
        }
      }
    }

    // どの方法でもユーザーが見つからない場合でも、すべてのCookieをクリア
    console.log("認証情報のクリーンアップを実行")
    clearAllAuthCookies()

    console.log("退会処理完了、トップページにリダイレクト")
  } catch (error) {
    console.error("deleteUserAction エラー:", error)

    // エラーが発生してもCookieはクリアする
    const cookieStore = cookies()
    const cookiesToDelete = ["current-user", "demo-user", "supabase-auth-token", "supabase-refresh-token", "sb-user"]

    cookiesToDelete.forEach((cookieName) => {
      cookieStore.delete(cookieName)
      cookieStore.set(cookieName, "", {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
    })

    console.log("エラー時もCookieクリア完了、トップページにリダイレクト")
  }

  // 退会処理完了後は必ずトップページにリダイレクト
  redirect("/")
}

export async function updateEmailAction(formData: FormData) {
  try {
    const newEmail = formData.get("email") as string

    if (!newEmail) {
      return { error: "新しいメールアドレスを入力してください" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return { error: "有効なメールアドレスを入力してください" }
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    // デモユーザーの場合
    const demoUser = cookieStore.get("demo-user")?.value
    if (demoUser) {
      const user = JSON.parse(demoUser)
      const updatedUser = { ...user, email: newEmail }

      cookieStore.set("demo-user", JSON.stringify(updatedUser), {
        path: "/",
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      cookieStore.set("current-user", JSON.stringify(updatedUser), {
        path: "/",
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      return { success: true, message: "メールアドレスを更新しました（デモモード）" }
    }

    if (!(await isDatabaseAvailable())) {
      return { error: "データベースが利用できません" }
    }

    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    })

    if (error) {
      return { error: `メールアドレスの更新に失敗しました: ${error.message}` }
    }

    return { success: true, message: "確認メールを送信しました。新しいメールアドレスで確認してください。" }
  } catch (error) {
    return { error: "予期しないエラーが発生しました" }
  }
}

export async function resetPasswordAction(formData: FormData) {
  try {
    const email = formData.get("email") as string

    if (!email) {
      return { error: "メールアドレスを入力してください" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "有効なメールアドレスを入力してください" }
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    if (!(await isDatabaseAvailable())) {
      return { success: true, message: "パスワードリセットメールを送信しました（デモモード）" }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password/confirm`,
    })

    if (error) {
      return { error: `パスワードリセットに失敗しました: ${error.message}` }
    }

    return { success: true, message: "パスワードリセットメールを送信しました" }
  } catch (error) {
    return { error: "予期しないエラーが発生しました" }
  }
}

export async function updatePasswordAction(formData: FormData) {
  try {
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!password || !confirmPassword) {
      return { error: "すべての項目を入力してください" }
    }

    if (password.length < 8) {
      return { error: "パスワードは8文字以上で入力してください" }
    }

    if (password !== confirmPassword) {
      return { error: "パスワードが一致しません" }
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      },
    )

    // デモユーザーの場合
    const demoUser = cookieStore.get("demo-user")?.value
    if (demoUser) {
      return { success: true, message: "パスワードを更新しました（デモモード）" }
    }

    if (!(await isDatabaseAvailable())) {
      return { error: "データベースが利用できません" }
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      return { error: `パスワードの更新に失敗しました: ${error.message}` }
    }

    return { success: true, message: "パスワードを更新しました" }
  } catch (error) {
    return { error: "予期しないエラーが発生しました" }
  }
}
