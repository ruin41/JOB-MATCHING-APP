"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Initialize Supabase on the server side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("Auth - Supabase URL:", supabaseUrl ? "Found" : "Not found")
console.log("Auth - Supabase Anon Key:", supabaseAnonKey ? "Found" : "Not found")

let supabase: any = null

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
      },
    })
    console.log("Auth - Supabase client initialized successfully")
  } else {
    console.warn("Auth - Supabase environment variables not found. Running in demo mode.")
  }
} catch (error) {
  console.warn("Auth - Failed to initialize Supabase client:", error)
}

function isDatabaseAvailable(): boolean {
  return supabase !== null
}

// 🔹 Create（ユーザー新規登録）- usersテーブルへの直接操作
export async function createUserAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // バリデーション
  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください" }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: "有効なメールアドレスを入力してください" }
  }

  if (password.length < 8) {
    return { error: "パスワードは8文字以上で入力してください" }
  }

  if (!isDatabaseAvailable()) {
    console.log("Database not available, creating mock user")
    // モックユーザーを作成
    const mockUser = {
      id: `user_${Date.now()}`,
      email,
      password: "***", // パスワードは表示しない
    }

    cookies().set("demo-user", JSON.stringify(mockUser), {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
    })

    return { success: true, user: mockUser }
  }

  try {
    // Supabaseのusersテーブルに直接insert
    const { data, error } = await supabase.from("users").insert({ email, password }).select().single()

    if (error) {
      console.error("User creation error:", error)
      return { error: "ユーザー登録に失敗しました" }
    }

    if (data) {
      // セッション情報をCookieに保存
      cookies().set("current-user", JSON.stringify({ id: data.id, email: data.email }), {
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
        httpOnly: true,
      })

      return { success: true, user: { id: data.id, email: data.email } }
    }

    return { error: "予期しないエラーが発生しました" }
  } catch (err) {
    console.error("User creation error:", err)
    return { error: "ユーザー登録に失敗しました" }
  }
}

export async function signUpJobseekerAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Validation
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

  if (!isDatabaseAvailable()) {
    console.log("Database not available, creating mock user")
    // Create a mock user for demo purposes
    const mockUser = {
      id: `jobseeker_${Date.now()}`,
      email,
      user_metadata: { user_type: "jobseeker" },
    }

    // Store in cookies for demo
    cookies().set("demo-user", JSON.stringify(mockUser), {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
    })

    return { success: true, user: mockUser, session: null }
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: "jobseeker",
        },
      },
    })

    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "このメールアドレス���既に登録されています" }
      } else if (error.message.includes("Password should be")) {
        return { error: "パスワードは8文字以上で、英数字を含めてください" }
      } else {
        return { error: "登録に失敗しました: " + error.message }
      }
    }

    if (data.user) {
      return { success: true, user: data.user, session: data.session }
    }

    return { error: "予期しないエラーが発生しました" }
  } catch (err) {
    console.error("Registration error:", err)
    return { error: "予期しないエラーが発生しました" }
  }
}

export async function signUpCompanyAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Validation
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

  if (!isDatabaseAvailable()) {
    console.log("Database not available, creating mock user")
    // Create a mock user for demo purposes
    const mockUser = {
      id: `company_${Date.now()}`,
      email,
      user_metadata: { user_type: "company" },
    }

    // Store in cookies for demo
    cookies().set("demo-user", JSON.stringify(mockUser), {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
    })

    return { success: true, user: mockUser, session: null }
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: "company",
        },
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
      return { success: true, user: data.user, session: data.session }
    }

    return { error: "予期しないエラーが発生しました" }
  } catch (err) {
    console.error("Registration error:", err)
    return { error: "予期しないエラーが発生しました" }
  }
}

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const userType = formData.get("userType") as string

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください" }
  }

  if (!isDatabaseAvailable()) {
    console.log("Database not available, creating mock login")
    // Create a mock user for demo purposes
    const mockUser = {
      id: `${userType}_${Date.now()}`,
      email,
      user_metadata: { user_type: userType },
    }

    // Store in cookies for demo
    cookies().set("demo-user", JSON.stringify(mockUser), {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
    })

    return {
      success: true,
      user: mockUser,
      session: null,
      userType,
    }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { error: "メールアドレスまたはパスワードが正しくありません" }
      } else if (error.message.includes("Email not confirmed")) {
        return { error: "メールアドレスの確認が完了していません。確認メールをご確認ください。" }
      } else {
        return { error: "ログインに失敗しました: " + error.message }
      }
    }

    if (data.user) {
      // Store session in cookies
      const session = data.session
      if (session) {
        cookies().set("supabase-auth-token", session.access_token, {
          path: "/",
          maxAge: session.expires_in,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        })
      }

      // Determine redirect path based on user type
      const userMetadata = data.user.user_metadata
      const storedUserType = userMetadata?.user_type
      const effectiveUserType = storedUserType || userType

      return {
        success: true,
        user: data.user,
        session: data.session,
        userType: effectiveUserType,
      }
    }

    return { error: "予期しないエラーが発生しました" }
  } catch (err) {
    console.error("Login error:", err)
    return { error: "予期しないエラーが発生しました" }
  }
}

export async function signOutAction() {
  try {
    if (isDatabaseAvailable()) {
      await supabase.auth.signOut()
    }

    cookies().delete("supabase-auth-token")
    cookies().delete("demo-user")
    cookies().delete("current-user")
    return { success: true }
  } catch (error) {
    console.error("Sign out error:", error)
    return { error: "ログアウトに失敗しました" }
  }
}

export async function getCurrentUserAction() {
  try {
    // Check for demo user first
    const demoUser = cookies().get("demo-user")?.value
    if (demoUser) {
      console.log("Found demo user in cookies")
      return { user: JSON.parse(demoUser) }
    }

    // Check for current user
    const currentUser = cookies().get("current-user")?.value
    if (currentUser) {
      console.log("Found current user in cookies")
      return { user: JSON.parse(currentUser) }
    }

    if (!isDatabaseAvailable()) {
      console.log("No database available and no user found")
      return { user: null }
    }

    const authToken = cookies().get("supabase-auth-token")?.value

    if (!authToken) {
      console.log("No auth token found")
      return { user: null }
    }

    // For now, we'll create a mock user based on the token
    // In a real implementation, you'd verify the token with Supabase
    return {
      user: {
        id: "mock-user-id",
        email: "user@example.com",
        user_metadata: { user_type: "jobseeker" },
      },
    }
  } catch (error) {
    console.error("Get user error:", error)
    return { user: null }
  }
}

// --- GUEST MODE START ---
export async function signInAsGuestAction() {
  console.log("Guest login attempt started")

  // ゲスト機能は常にモックデータを使用（Supabaseにゲストアカウントが存在しないため）
  const mockGuestUser = {
    id: "guest_user_demo",
    email: "guest@example.com",
    user_metadata: { user_type: "jobseeker", is_guest: true },
  }

  try {
    // Store in cookies for demo
    cookies().set("demo-user", JSON.stringify(mockGuestUser), {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
    })

    console.log("Guest user created successfully")

    return {
      success: true,
      user: mockGuestUser,
      session: null,
      userType: "jobseeker",
    }
  } catch (err) {
    console.error("Guest login error:", err)
    return { error: "ゲストログインに失敗しました" }
  }
}

// メール認証画面用のゲストログイン機能
export async function signInAsGuestFromVerifyPage(userType: "jobseeker" | "company") {
  console.log(`Guest login from verify page started for ${userType}`)

  const guestCredentials = {
    jobseeker: {
      email: "guest_jobseeker@example.com",
      password: "guest_password",
    },
    company: {
      email: "guest_company@example.com",
      password: "guest_password",
    },
  }

  const credentials = guestCredentials[userType]

  if (!isDatabaseAvailable()) {
    console.log("Database not available, creating mock guest user")
    // モックゲストユーザーを作成
    const mockGuestUser = {
      id: `guest_${userType}_demo`,
      email: credentials.email,
      user_metadata: { user_type: userType, is_guest: true },
    }

    // Store in cookies for demo
    cookies().set("demo-user", JSON.stringify(mockGuestUser), {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
    })

    return {
      success: true,
      user: mockGuestUser,
      session: null,
      userType,
    }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      console.error("Guest login error:", error)
      // エラーが発生してもモックユーザーで続行
      const mockGuestUser = {
        id: `guest_${userType}_demo`,
        email: credentials.email,
        user_metadata: { user_type: userType, is_guest: true },
      }

      cookies().set("demo-user", JSON.stringify(mockGuestUser), {
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
        httpOnly: true,
      })

      return {
        success: true,
        user: mockGuestUser,
        session: null,
        userType,
      }
    }

    if (data.user) {
      // Store session in cookies
      const session = data.session
      if (session) {
        cookies().set("supabase-auth-token", session.access_token, {
          path: "/",
          maxAge: session.expires_in,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        })
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        userType,
      }
    }

    return { error: "ゲストログインに失敗しました" }
  } catch (err) {
    console.error("Guest login error:", err)
    return { error: "ゲストログインに失敗しました" }
  }
}
// --- GUEST MODE END ---
