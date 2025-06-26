"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Heart, Building2, CheckCircle, AlertCircle } from "lucide-react"
import { getSkillsAction } from "@/app/actions/profile"

export default function RegisterJobPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [availableSkills, setAvailableSkills] = useState<Array<{ id: number; name: string }>>([])

  useEffect(() => {
    // Load available skills
    const loadSkills = async () => {
      const result = await getSkillsAction()
      if (result.success) {
        setAvailableSkills(result.skills)
      }
    }
    loadSkills()
  }, [])

  const handleSkillChange = (skillName: string) => {
    setRequiredSkills((prev) => (prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // モックデータでの保存処理をシミュレート
      const formData = new FormData(e.currentTarget)

      // Add selected skills to form data
      requiredSkills.forEach((skill) => {
        formData.append("requiredSkills", skill)
      })

      console.log("Selected skills:", requiredSkills)
      console.log("Form data:", Object.fromEntries(formData.entries()))

      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess(true)
      setTimeout(() => {
        router.push("/swipe/company")
      }, 2000)
    } catch (err) {
      console.error("Job registration error:", err)
      setError("求人情報の登録に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">求人情報登録完了</CardTitle>
            <CardDescription>
              求人情報の登録が完了しました。
              <br />
              人材探しを開始できます。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
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
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">求人情報登録</CardTitle>
          <CardDescription>魅力的な求人情報を登録して、優秀な人材を見つけましょう</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">企業名</Label>
                  <Input id="company-name" name="companyName" placeholder="株式会社サンプル" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">募集職種</Label>
                  <Input id="position" name="position" placeholder="フロントエンドエンジニア" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">勤務地</Label>
                  <Select name="location" required>
                    <SelectTrigger>
                      <SelectValue placeholder="勤務地を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tokyo">東京都</SelectItem>
                      <SelectItem value="osaka">大阪府</SelectItem>
                      <SelectItem value="remote">リモート</SelectItem>
                      <SelectItem value="hybrid">ハイブリッド</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">年収</Label>
                  <Input id="salary" name="salary" placeholder="400万円〜600万円" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>必要スキル</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                  {availableSkills.map((skill) => (
                    <div key={skill.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`skill-${skill.id}`}
                        checked={requiredSkills.includes(skill.name)}
                        onCheckedChange={() => handleSkillChange(skill.name)}
                      />
                      <Label htmlFor={`skill-${skill.id}`} className="text-sm font-normal">
                        {skill.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {requiredSkills.length > 0 && (
                  <p className="text-sm text-gray-600">選択中: {requiredSkills.length}個のスキル</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-description">仕事内容</Label>
                <Textarea
                  id="job-description"
                  name="jobDescription"
                  placeholder="Webアプリケーションの開発業務をお任せします..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-description">企業について</Label>
                <Textarea
                  id="company-description"
                  name="companyDescription"
                  placeholder="弊社は革新的なテクノロジーで..."
                  rows={3}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? "登録中..." : "求人情報を登録"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
