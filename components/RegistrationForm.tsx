"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { handleRegister } from "@/app/actions/registration"

export default function RegistrationForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState<"jobseeker" | "company">("jobseeker")

  const onSubmit = async (formData: FormData) => {
    setIsLoading(true)

    try {
      // userType をフォームデータに追加
      formData.append("userType", userType)

      const result = await handleRegister(formData)

      if (result.success) {
        toast.success("登録が完了しました！")

        // 登録成功時のリダイレクト
        if (userType === "jobseeker") {
          router.push("/profile/jobseeker")
        } else {
          router.push("/profile/company")
        }
      } else {
        toast.error(result.error || "登録に失敗しました")
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error("予期しないエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your-email@example.com"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">パスワード</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="8文字以上で入力してください"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="userType">ユーザータイプ</Label>
        <Select value={userType} onValueChange={(value: "jobseeker" | "company") => setUserType(value)}>
          <SelectTrigger>
            <SelectValue placeholder="ユーザータイプを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jobseeker">求職者</SelectItem>
            <SelectItem value="company">企業</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "登録中..." : "登録する"}
      </Button>
    </form>
  )
}
