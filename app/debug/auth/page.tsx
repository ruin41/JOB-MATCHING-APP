"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@supabase/supabase-js"

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testEmailSent, setTestEmailSent] = useState(false)

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  useEffect(() => {
    const currentOrigin = window.location.origin
    const hash = window.location.hash
    const search = window.location.search

    setDebugInfo({
      currentOrigin,
      supabaseUrl,
      hash: hash || "なし",
      search: search || "なし",
      fullUrl: window.location.href,
      expectedRedirectUrl: `${currentOrigin}/auth/confirm`,
    })
  }, [supabaseUrl])

  const sendTestEmail = async () => {
    try {
      const currentOrigin = window.location.origin
      const testEmail = "test@example.com"

      console.log("Sending test signup with redirect to:", `${currentOrigin}/auth/confirm`)

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: "testpassword123",
        options: {
          emailRedirectTo: `${currentOrigin}/auth/confirm`,
        },
      })

      if (error) {
        console.error("Test signup error:", error)
        alert(`エラー: ${error.message}`)
      } else {
        console.log("Test signup success:", data)
        setTestEmailSent(true)
        alert("テストメールを送信しました（実際には送信されません）")
      }
    } catch (error) {
      console.error("Test error:", error)
      alert("テスト中にエラーが発生しました")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">認証デバッグ情報</h1>

        <div className="grid gap-6">
          {/* 環境情報 */}
          <Card>
            <CardHeader>
              <CardTitle>環境情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                <div>
                  <strong>現在のオリジン:</strong> {debugInfo.currentOrigin}
                </div>
                <div>
                  <strong>Supabase URL:</strong> {debugInfo.supabaseUrl}
                </div>
                <div>
                  <strong>期待されるリダイレクトURL:</strong> {debugInfo.expectedRedirectUrl}
                </div>
                <div>
                  <strong>現在のURL:</strong> {debugInfo.fullUrl}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* URL情報 */}
          <Card>
            <CardHeader>
              <CardTitle>URL情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                <div>
                  <strong>URLハッシュ:</strong> {debugInfo.hash}
                </div>
                <div>
                  <strong>URLクエリ:</strong> {debugInfo.search}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supabase設定確認 */}
          <Card>
            <CardHeader>
              <CardTitle>Supabase設定確認項目</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">確認すべき設定:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>
                      <strong>Site URL:</strong> {debugInfo.currentOrigin}
                    </li>
                    <li>
                      <strong>Additional Redirect URLs:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>{debugInfo.currentOrigin}/auth/confirm</li>
                        <li>http://localhost:3000/auth/confirm</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Email Templates:</strong> デフォルトテンプレートを使用
                    </li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">設定手順:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Supabaseダッシュボード → Settings → Authentication</li>
                    <li>URL Configuration セクションを確認</li>
                    <li>Site URL を上記の値に設定</li>
                    <li>Additional Redirect URLs に上記のURLを追加</li>
                    <li>Save をクリック</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* テスト機能 */}
          <Card>
            <CardHeader>
              <CardTitle>テスト機能</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={sendTestEmail} disabled={testEmailSent}>
                  {testEmailSent ? "テスト完了" : "テストサインアップを実行"}
                </Button>
                {testEmailSent && (
                  <div className="text-sm text-green-600">
                    ✅ テストが完了しました。コンソールログを確認してください。
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
