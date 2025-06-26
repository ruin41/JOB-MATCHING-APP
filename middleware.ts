import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 認証が必要なパス
const protectedPaths = ["/profile", "/create-profile"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // セッション確認処理を改善
  const sessionToken = request.cookies.get("supabase-auth-token")?.value
  const currentUser = request.cookies.get("current-user")?.value
  const demoUser = request.cookies.get("demo-user")?.value

  // デモユーザーまたは認証済みユーザーの場合は通す
  if (demoUser || currentUser || sessionToken) {
    console.log("Middleware: 認証済みユーザー", {
      hasDemo: !!demoUser,
      hasCurrentUser: !!currentUser,
      hasToken: !!sessionToken,
    })
    return NextResponse.next()
  }

  // 認証が必要なパスの場合はログイン画面にリダイレクト
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    console.log("Middleware: 未認証ユーザーをリダイレクト", pathname)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

// どのパスでmiddlewareを動かすかを設定
export const config = {
  matcher: ["/profile/:path*", "/create-profile/:path*"],
}
