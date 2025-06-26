// マッチングロジック関連のユーティリティ関数

export interface MatchingResult {
  isMatch: boolean
  reason: string
}

// スキル配列をフォーマット
export function formatSkillsArray(skillsData: any[]): string[] {
  if (!skillsData || !Array.isArray(skillsData)) return []
  return skillsData.map((item) => item?.skills?.name).filter(Boolean)
}

// 求職者→企業のマッチング判定（スキル・資格の自動判定）
export function checkJobseekerToCompanyMatch(
  jobseekerSkills: string[],
  jobseekerQualifications: string[],
  companyRequiredSkills: string[],
  companyRequiredQualifications: string[],
): MatchingResult {
  // スキルの一致をチェック
  const hasMatchingSkills = jobseekerSkills.some((skill) =>
    companyRequiredSkills.some((required) => skill.toLowerCase() === required.toLowerCase()),
  )

  // 資格の一致をチェック（現在は常にtrue、将来の拡張用）
  const hasMatchingQualifications = true

  const isMatch = hasMatchingSkills && hasMatchingQualifications

  return {
    isMatch,
    reason: isMatch ? "スキルと資格の条件を満たしています" : "条件を満たしていないため、企業の判断を待ちます",
  }
}

// 企業→求職者のマッチング判定（常に受け取ったいいね欄に追加）
export function checkCompanyToJobseekerMatch(): MatchingResult {
  return {
    isMatch: false, // 企業→求職者は常に受け取ったいいね欄に追加
    reason: "求職者の受け取ったいいね欄に追加されました",
  }
}

// 相互いいねのチェック（実際の実装ではデータベースから確認）
export function checkMutualLike(userId1: string, userId2: string): boolean {
  // デモ用：ランダムでマッチング成立を判定
  return Math.random() > 0.7 // 30%の確率でマッチ
}

// マッチング成立時のユーザー情報を生成（デモ用）
export function generateMatchedUserInfo(
  userId: string | number,
  userType: "jobseeker" | "company",
): {
  id: string | number
  name?: string
  company_name?: string
  avatar_url?: string
  logo_url?: string
  position_title?: string
  job_title?: string
} {
  if (userType === "jobseeker") {
    // 企業情報を返す
    return {
      id: userId,
      company_name: "テックスタート株式会社",
      logo_url: "/placeholder.svg?height=80&width=80",
      position_title: "フロントエンドエンジニア",
    }
  } else {
    // 求職者情報を返す
    return {
      id: userId,
      name: "田中 太郎",
      avatar_url: "/placeholder.svg?height=80&width=80",
      job_title: "フロントエンドエンジニア",
    }
  }
}
