"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Heart, AlertTriangle } from "lucide-react"
import { deleteUserAction } from "@/app/actions/auth"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { supabase } from "@/lib/supabaseClient"
import CancelButton from "@/components/CancelButton"

const WITHDRAWAL_REASONS = [
  { value: "found-job", label: "転職先が決まった" },
  { value: "not-matching", label: "希望に合う企業/人材が見つからない" },
  { value: "too-busy", label: "忙しくて利用する時間がない" },
  { value: "privacy-concern", label: "プライバシーが心配" },
  { value: "other-service", label: "他のサービスを利用することにした" },
  { value: "other", label: "その他" },
]

export default function WithdrawPage() {
  const router = useRouter()
  const { isLoading: authLoading, isAuthenticated } = useAuthGuard()
  const [selectedReason, setSelectedReason] = useState("")
  const [otherReason, setOtherReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!isAuthenticated) return

      try {
        // Supabaseから直接ユーザー情報を取得
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error("Failed to load user:", userError)
          return
        }

        console.log("User found:", user)
        setCurrentUser(user)
      } catch (error) {
        console.error("Failed to load user:", error)
      }
    }

    if (isAuthenticated) {
      loadCurrentUser()
    }
  }, [isAuthenticated])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Link href="/" className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">JobMatch</span>
        </Link>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">認証状態を確認中...</CardTitle>
            <CardDescription>しばらくお待ちください</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // useAuthGuardがリダイレクト処理を行う
  }

  // 🔹 退会処理（修正版 - Server Actionを使用し、確実にリダイレクト）
  const handleWithdraw = async () => {
    console.log("=== 退会処理開始 ===")
    console.log("currentUser:", currentUser)

    setIsLoading(true)

    try {
      // 🔹 1. Supabase Storageからプロフィール画像を削除（currentUserがある場合のみ）
      if (currentUser) {
        try {
          console.log("Deleting profile image from Storage...")
          const imagePath = `${currentUser.id}/profile.jpg`

          const { error: storageError } = await supabase.storage.from("avatars").remove([imagePath])

          if (storageError) {
            console.log("Storage deletion error (may not exist):", storageError)
          } else {
            console.log("Profile image deleted successfully:", imagePath)
          }
        } catch (storageError) {
          console.log("Storage deletion error:", storageError)
        }
      }

      // 🔹 2. Server Actionでユーザー削除処理
      console.log("Calling deleteUserAction...")
      const result = await deleteUserAction()

      if (result.success) {
        // 🔹 3. クライアント側でもCookieを確実にクリア
        const cookiesToClear = ["current-user", "demo-user", "supabase-auth-token", "supabase-refresh-token", "sb-user"]

        cookiesToClear.forEach((cookieName) => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        })

        console.log("クライアント側Cookie削除完了")

        alert("退会処理が完了しました。ご利用ありがとうございました。")

        // 🔹 4. 少し待ってからトップページにリダイレクト
        setTimeout(() => {
          window.location.href = "/"
        }, 100)
      } else {
        console.error("Delete error:", result.error)
        alert(result.error || "退会処理に失敗しました")
      }
    } catch (error) {
      console.error("Withdrawal error:", error)
      alert("退会処理に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirmDialog(true)
  }

  const handleConfirmWithdraw = () => {
    setShowConfirmDialog(false)
    handleWithdraw()
  }

  const handleCancelWithdraw = () => {
    setShowConfirmDialog(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center space-x-2 mb-8">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">JobMatch</span>
      </Link>

      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-end mb-4">
            <CancelButton />
          </div>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">退会手続き</CardTitle>
          <CardDescription>
            退会される前に、以下の内容をご確認ください。
            <br />
            退会すると、すべてのデータが削除され、復元することはできません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-800 mb-2">退会時の注意事項</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• プロフィール情報がすべて削除されます</li>
              <li>• マッチング履歴が削除されます</li>
              <li>• アップロードした画像が削除されます</li>
              <li>• アカウント情報が完全に削除されます</li>
              <li>• 退会後のデータ復元はできません</li>
            </ul>
          </div>

          {currentUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-800 mb-2">現在のアカウント情報</h3>
              <p className="text-sm text-blue-700">メールアドレス: {currentUser.email}</p>
              <p className="text-sm text-blue-700">ユーザーID: {currentUser.id}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">退会理由をお聞かせください（任意）</Label>
              <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                {WITHDRAWAL_REASONS.map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {selectedReason === "other" && (
              <div className="space-y-2">
                <Label htmlFor="other-reason">詳細をお聞かせください</Label>
                <Textarea
                  id="other-reason"
                  placeholder="退会理由の詳細を入力してください"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowConfirmDialog(false)}>
                キャンセル
              </Button>
              <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700" disabled={isLoading}>
                {isLoading ? "退会処理中..." : "退会する"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 🔹 退会確認ダイアログ */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg text-red-600">退会の確認</CardTitle>
              <CardDescription>
                本当に退会しますか？
                <br />
                この操作は取り消すことができません。
                <br />
                すべてのデータが完全に削除されます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-3">
                <Button onClick={handleCancelWithdraw} variant="outline" className="flex-1">
                  キャンセル
                </Button>
                <Button
                  onClick={handleConfirmWithdraw}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  {isLoading ? "削除中..." : "退会する"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
