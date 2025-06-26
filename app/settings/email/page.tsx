"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, AlertCircle, CheckCircle } from "lucide-react"
import { resendConfirmationEmailAction, updateEmailAction } from "@/app/actions/email"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { supabase } from "@/lib/supabaseClient"
import CancelButton from "@/components/CancelButton"

interface User {
  email: string
  email_confirmed_at: string | null
}

export default function EmailSettingsPage() {
  const router = useRouter()
  const { isLoading: authLoading, isAuthenticated } = useAuthGuard()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [resendLoading, setResendLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated) return

      try {
        // Supabaseから直接ユーザー情報を取得
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !currentUser) {
          setError("ユーザー情報の取得に失敗しました")
          return
        }

        setUser({
          email: currentUser.email || "",
          email_confirmed_at: currentUser.email_confirmed_at,
        })
      } catch (err) {
        console.error("Failed to load user data:", err)
        setError("ユーザー情報の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      loadUserData()
    }
  }, [isAuthenticated])

  const handleResendConfirmation = async () => {
    setResendLoading(true)
    setMessage("")
    setError("")

    try {
      const result = await resendConfirmationEmailAction()

      if (result.error) {
        setError(result.error)
      } else {
        setMessage(result.message || "認証メールを再送信しました")
      }
    } catch (err) {
      setError("認証メールの再送信に失敗しました")
    } finally {
      setResendLoading(false)
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateLoading(true)
    setMessage("")
    setError("")

    const formData = new FormData()
    formData.append("email", newEmail)

    try {
      const result = await updateEmailAction(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setMessage(result.message || "メールアドレスを変更しました")
        setNewEmail("")
        // ユーザー情報を再読み込み
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !currentUser) {
          setError("ユーザー情報の取得に失敗しました")
          return
        }

        setUser({
          email: currentUser.email || "",
          email_confirmed_at: currentUser.email_confirmed_at,
        })
      }
    } catch (err) {
      setError("メールアドレスの変更に失敗しました")
    } finally {
      setUpdateLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // useAuthGuardがリダイレクト処理を行う
  }

  const isEmailConfirmed = user?.email_confirmed_at !== null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">メールアドレス設定</h1>
            <CancelButton />
          </div>
          <p className="text-gray-600 mt-1">メールアドレスの確認・変更ができます</p>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700">{message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* 現在のメールアドレス */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                現在のメールアドレス
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current-email">メールアドレス</Label>
                <Input id="current-email" type="email" value={user?.email || ""} disabled className="mt-1 bg-gray-50" />
              </div>

              {/* 認証ステータス */}
              <div>
                <Label>認証ステータス</Label>
                <div className="mt-1">
                  {isEmailConfirmed ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">認証済み</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">未認証です。認証メールを確認してください。</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* メール認証の再送信 */}
          {!isEmailConfirmed && (
            <Card>
              <CardHeader>
                <CardTitle>メール認証の再送信</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">認証メールが届いていない場合は、再送信できます。</p>
                <Button onClick={handleResendConfirmation} disabled={resendLoading} className="w-full sm:w-auto">
                  {resendLoading ? "送信中..." : "認証メールを再送信する"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* メールアドレスの変更 */}
          <Card>
            <CardHeader>
              <CardTitle>メールアドレスの変更</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div>
                  <Label htmlFor="new-email">新しいメールアドレス</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@example.com"
                    className="mt-1"
                    required
                  />
                </div>
                <p className="text-sm text-gray-600">変更後は新しいメールアドレスに認証メールが送信されます。</p>
                <Button type="submit" disabled={updateLoading || !newEmail.trim()} className="w-full sm:w-auto">
                  {updateLoading ? "変更中..." : "変更する"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
