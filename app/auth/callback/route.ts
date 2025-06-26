import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("=== Auth Callback Handler ===")
  console.log("Request URL:", request.url)

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")

  // URLフラグメントからトークンを取得する場合の処理
  const fragment = requestUrl.hash
  let accessToken = null
  let refreshToken = null

  if (fragment) {
    const params = new URLSearchParams(fragment.substring(1))
    accessToken = params.get("access_token")
    refreshToken = params.get("refresh_token")
    console.log("Fragment params:", { accessToken: !!accessToken, refreshToken: !!refreshToken })
  }

  console.log("Callback params:", {
    code: !!code,
    next,
    error,
    errorDescription,
    origin: requestUrl.origin,
    hasFragment: !!fragment,
  })

  // エラーがある場合
  if (error) {
    console.error("Auth callback error:", error, errorDescription)
    return NextResponse.redirect(new URL(`/signup?error=${error}`, request.url))
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  try {
    let sessionData = null

    // 認証コードがある場合
    if (code) {
      console.log("Processing auth code...")
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("Code exchange error:", exchangeError)
        return NextResponse.redirect(new URL("/signup?error=auth_failed", request.url))
      }

      sessionData = data
    }
    // フラグメントからトークンを取得した場合
    else if (accessToken) {
      console.log("Processing access token from fragment...")
      const { data, error: userError } = await supabase.auth.getUser(accessToken)

      if (userError || !data.user) {
        console.error("Token validation error:", userError)
        return NextResponse.redirect(new URL("/signup?error=token_invalid", request.url))
      }

      sessionData = {
        user: data.user,
        session: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 3600, // デフォルト値
        },
      }
    }

    if (sessionData?.session && sessionData?.user) {
      console.log("Authentication successful:", {
        userId: sessionData.user.id,
        email: sessionData.user.email,
        emailVerified: sessionData.user.email_confirmed_at,
        userType: sessionData.user.user_metadata?.user_type,
      })

      // セッション情報をCookieに保存
      const cookieStore = cookies()

      cookieStore.set("supabase-auth-token", sessionData.session.access_token, {
        path: "/",
        maxAge: sessionData.session.expires_in || 3600,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      // リフレッシュトークンを保存
      if (sessionData.session.refresh_token) {
        cookieStore.set("supabase-refresh-token", sessionData.session.refresh_token, {
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
          id: sessionData.user.id,
          email: sessionData.user.email,
          user_metadata: sessionData.user.user_metadata,
          email_confirmed_at: sessionData.user.email_confirmed_at,
        }),
        {
          path: "/",
          maxAge: 60 * 60 * 24, // 24時間
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        },
      )

      // ユーザーのロール状態に応じてリダイレクト先を決定
      const userType = sessionData.user.user_metadata?.user_type

      let redirectPath = "/signup/role" // デフォルトはロール選択

      if (userType) {
        // 既にロールが設定されている場合は適切なプロフィール画面へ
        redirectPath = userType === "company" ? "/signup/company-profile" : "/signup/jobseeker-profile"
      } else if (next) {
        // nextパラメータが指定されている場合はそちらを優先
        redirectPath = next
      }

      console.log("Redirecting to:", redirectPath)
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    // セッションデータが取得できない場合
    console.log("No session data available")
    return NextResponse.redirect(new URL("/signup?error=no_session", request.url))
  } catch (error) {
    console.error("Authentication callback error:", error)
    return NextResponse.redirect(new URL("/signup?error=callback_failed", request.url))
  }
}
