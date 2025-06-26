"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateJobseekerProfileAction, getJobseekerProfileAction, getSkillsAction } from "@/app/actions/profile"
import { ImageUpload } from "@/components/ImageUpload"
import SimpleLocationSelect from "@/components/SimpleLocationSelect"
import CancelButton from "@/components/CancelButton"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

// 職種選択肢（企業側と統一 + 未経験を追加）
const JOB_TYPE_OPTIONS = [
  { value: "inexperienced", label: "未経験" },
  { value: "frontend", label: "フロントエンドエンジニア" },
  { value: "backend", label: "バックエンドエンジニア" },
  { value: "fullstack", label: "フルスタックエンジニア" },
  { value: "mobile", label: "モバイルアプリエンジニア" },
  { value: "data", label: "データエンジニア" },
  { value: "ml", label: "機械学習エンジニア" },
  { value: "ai", label: "AIエンジニア" },
  { value: "devops", label: "DevOpsエンジニア" },
  { value: "security", label: "セキュリティエンジニア" },
  { value: "qa", label: "テストエンジニア / QAエンジニア" },
  { value: "pm", label: "プロダクトマネージャー" },
  { value: "infra", label: "インフラエンジニア" },
  { value: "designer", label: "UI/UXデザイナー" },
  { value: "support", label: "サポートエンジニア" },
  { value: "tech_support", label: "テクニカルサポートエンジニア" },
  { value: "lead", label: "リードエンジニア / エンジニアリングマネージャー" },
]

const EXPERIENCE_YEARS_OPTIONS = [
  { value: "0", label: "未経験" },
  { value: "1", label: "1年未満" },
  { value: "1-3", label: "1〜3年" },
  { value: "3-5", label: "3〜5年" },
  { value: "5-10", label: "5〜10年" },
  { value: "10+", label: "10年以上" },
]

const CURRENT_STATUS_OPTIONS = [
  { value: "employed", label: "現職中" },
  { value: "unemployed", label: "離職中" },
  { value: "student", label: "学生" },
  { value: "freelance", label: "フリーランス" },
]

const DESIRED_TRANSFER_TIMING_OPTIONS = [
  { value: "immediately", label: "すぐにでも" },
  { value: "within_1_month", label: "1ヶ月以内" },
  { value: "within_3_months", label: "3ヶ月以内" },
  { value: "within_6_months", label: "6ヶ月以内" },
  { value: "within_1_year", label: "1年以内" },
  { value: "good_opportunity", label: "良い機会があれば" },
]

const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "prefer_not_to_say", label: "回答しない" },
]

// 資格・免許の選択肢
const LICENSE_OPTIONS = [
  "基本情報技術者試験",
  "応用情報技術者試験",
  "ITパスポート試験",
  "情報処理安全確保支援士試験",
  "CompTIA Security+",
  "AWS認定ソリューションアーキテクト – アソシエイト",
  "Microsoft Certified: Azure Fundamentals",
  "LPI認定 Linux技術者（LPIC）",
  "Cisco Certified Network Associate（CCNA）",
  "なし",
]

export default function EditJobseekerProfilePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [skills, setSkills] = useState<any[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [location, setLocation] = useState("")
  const [preferredLocation, setPreferredLocation] = useState("")

  // フォームの初期値
  const [formData, setFormData] = useState({
    name: "",
    birthdate: "",
    gender: "",
    jobType: "",
    experienceYears: "",
    desiredAnnualIncome: "",
    bio: "",
    license: "",
    currentStatus: "",
    desiredTransferTiming: "",
    photoUrl: "",
  })

  // プロフィールデータとスキル一覧を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // プロフィールデータを取得
        const profileResult = await getJobseekerProfileAction()
        if (profileResult.success && profileResult.profile) {
          const profile = profileResult.profile
          setFormData({
            name: profile.name || "",
            birthdate: profile.birthdate || "",
            gender: profile.gender || "",
            jobType: profile.occupation || "",
            experienceYears: profile.experience_years?.toString() || "",
            desiredAnnualIncome: profile.desired_annual_income?.toString() || "",
            bio: profile.bio || "",
            license: profile.license || "",
            currentStatus: profile.current_status || "",
            desiredTransferTiming: profile.desired_transfer_timing || "",
            photoUrl: profile.photo_url || "",
          })

          setLocation(profile.location || "")
          setPreferredLocation(profile.preferred_location || "")

          // スキルを配列に変換
          if (profile.skills) {
            if (typeof profile.skills === "string") {
              setSelectedSkills(profile.skills.split(", ").filter(Boolean))
            }
          }
        }

        // スキル一覧を取得
        const skillsResult = await getSkillsAction()
        if (skillsResult.success && skillsResult.skillsByCategory) {
          // カテゴリ別のスキルをフラットな配列に変換
          const allSkills: string[] = []
          skillsResult.skillsByCategory.forEach((category) => {
            category.skills.forEach((skill) => {
              allSkills.push(skill.name)
            })
          })
          setSkills(allSkills)
        }
      } catch (error) {
        console.error("データ取得エラー:", error)
        alert("データの取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSkillAdd = (skillName: string) => {
    if (skillName && !selectedSkills.includes(skillName)) {
      setSelectedSkills([...selectedSkills, skillName])
    }
  }

  const handleSkillRemove = (skillName: string) => {
    setSelectedSkills(selectedSkills.filter((skill) => skill !== skillName))
  }

  const handleSubmit = async (formDataObj: FormData) => {
    startTransition(async () => {
      // 選択されたスキルをカンマ区切り文字列としてフォームデータに追加
      formDataObj.append("skills", selectedSkills.join(", "))

      // プロフィール画像をフォームデータに追加
      if (profileImage) {
        formDataObj.append("profileImage", profileImage)
      }

      // 地域情報を追加
      formDataObj.append("location", location)
      formDataObj.append("preferredLocation", preferredLocation)

      const result = await updateJobseekerProfileAction(formDataObj)

      if (result.error) {
        alert(`エラー: ${result.error}`)
      } else {
        alert("プロフィールが更新されました！")
        router.push("/mypage/jobseeker")
      }
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">プロフィールを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>求職者プロフィール編集</CardTitle>
                <CardDescription>プロフィール情報を更新してください</CardDescription>
              </div>
              <CancelButton />
            </div>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-6">
              {/* プロフィール画像 */}
              <div>
                <Label>プロフィール画像</Label>
                <ImageUpload onImageSelect={setProfileImage} currentImageUrl={formData.photoUrl} />
              </div>

              {/* 基本情報 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">
                    氏名 <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" name="name" defaultValue={formData.name} required />
                </div>

                <div>
                  <Label htmlFor="birthDate">生年月日</Label>
                  <Input id="birthDate" name="birthDate" type="date" defaultValue={formData.birthdate} />
                </div>
              </div>

              <div>
                <Label htmlFor="gender">性別</Label>
                <Select name="gender" defaultValue={formData.gender}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 居住地 */}
              <SimpleLocationSelect
                label="居住地"
                value={location}
                onChange={setLocation}
                required
                placeholder="居住地を選択してください"
              />

              {/* 職歴情報 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobType">
                    経験職種 <span className="text-red-500">*</span>
                  </Label>
                  <Select name="jobType" defaultValue={formData.jobType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="experienceYears">
                    経験年数 <span className="text-red-500">*</span>
                  </Label>
                  <Select name="experienceYears" defaultValue={formData.experienceYears} required>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_YEARS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 希望条件 */}
              <SimpleLocationSelect
                label="希望勤務地"
                value={preferredLocation}
                onChange={setPreferredLocation}
                placeholder="希望勤務地を選択してください"
              />

              <div>
                <Label htmlFor="desiredAnnualIncome">希望年収（万円）</Label>
                <Input
                  id="desiredAnnualIncome"
                  name="desiredAnnualIncome"
                  type="number"
                  placeholder="例: 500"
                  defaultValue={formData.desiredAnnualIncome}
                />
              </div>

              {/* スキル選択 */}
              <div>
                <Label>スキル</Label>
                <div className="space-y-3">
                  <Select onValueChange={handleSkillAdd}>
                    <SelectTrigger>
                      <SelectValue placeholder="スキルを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {skills
                        .filter((skill) => !selectedSkills.includes(skill))
                        .map((skill) => (
                          <SelectItem key={skill} value={skill}>
                            {skill}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {/* 選択されたスキルを表示 */}
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => handleSkillRemove(skill)} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 自己紹介 */}
              <div>
                <Label htmlFor="bio">
                  自己紹介 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="あなたの経験やスキル、転職への想いなどを記入してください"
                  defaultValue={formData.bio}
                  required
                />
              </div>

              {/* 資格・免許 */}
              <div>
                <Label htmlFor="license">資格・免許</Label>
                <Select name="license" defaultValue={formData.license}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_OPTIONS.map((license) => (
                      <SelectItem key={license} value={license}>
                        {license}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 現在の状況 */}
              <div>
                <Label htmlFor="currentStatus">
                  現在の状況 <span className="text-red-500">*</span>
                </Label>
                <Select name="currentStatus" defaultValue={formData.currentStatus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 転職希望時期 */}
              <div>
                <Label htmlFor="desiredTransferTiming">
                  転職希望時期 <span className="text-red-500">*</span>
                </Label>
                <Select name="desiredTransferTiming" defaultValue={formData.desiredTransferTiming} required>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIRED_TRANSFER_TIMING_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "更新中..." : "プロフィールを更新"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
