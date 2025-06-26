import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user, access_token, refresh_token, expires_in } = body

    console.log("=== Cookie同期API開始 ===")
    console.log("ユーザーID:", user.id)
    console.log("ユーザータイプ:", user.user_metadata?.user_type)

    // Cookieに認証情報を設定
    const cookieStore = cookies()

    // アクセストークンをCookieに設定
    cookieStore.set("sb-access-token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expires_in || 3600,
      path: "/",
    })

    // リフレッシュトークンをCookieに設定
    if (refresh_token) {
      cookieStore.set("sb-refresh-token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30日
        path: "/",
      })
    }

    // ユーザー情報をCookieに設定
    cookieStore.set("sb-user", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expires_in || 3600,
      path: "/",
    })

    // Supabaseが使用する標準のCookie名も設定
    cookieStore.set("supabase-auth-token", JSON.stringify([access_token, refresh_token]), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expires_in || 3600,
      path: "/",
    })

    console.log("Cookie同期完了")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cookie同期エラー:", error)
    return NextResponse.json({ success: false, error: "Cookie同期に失敗しました" }, { status: 500 })
  }
}
