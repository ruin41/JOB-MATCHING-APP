"use server"

import { supabase } from "@/lib/supabase"

export interface LikeActionResult {
  success: boolean
  isMatch: boolean
  matchType?: "auto" | "company_reply"
  matchedUser?: any
  error?: string
}

// いいねを送信し、マッチング判定を行う
export async function sendLikeAction(
  senderId: string,
  receiverId: string,
  senderType: "jobseeker" | "company",
): Promise<LikeActionResult> {
  try {
    console.log(`=== いいね送信開始 ===`)
    console.log(`送信者: ${senderId} (${senderType})`)
    console.log(`受信者: ${receiverId}`)

    // 1. いいねを作成
    const { data: like, error: likeError } = await supabase
      .from("likes")
      .insert({
        sender_user_id: senderId,
        receiver_user_id: receiverId,
        sender_type: senderType, // ★ この行を追加
      })
      .select()
      .single()

    if (likeError) {
      console.error("いいね作成エラー:", likeError)
      return {
        success: false,
        isMatch: false,
        error: "いいねの送信に失敗しました",
      }
    }

    console.log("いいね作成成功:", like)

    // 2. マッチング判定
    const matchResult = await checkAndCreateMatch(senderId, receiverId, senderType)

    if (matchResult.isMatch) {
      console.log(`マッチ成立: ${matchResult.matchType}`)
      return {
        success: true,
        isMatch: true,
        matchType: matchResult.matchType,
        matchedUser: matchResult.matchedUser,
      }
    }

    return {
      success: true,
      isMatch: false,
    }
  } catch (error) {
    console.error("Error in sendLikeAction:", error)
    return {
      success: false,
      isMatch: false,
      error: "いいねの送信中にエラーが発生しました",
    }
  }
}

// マッチング判定とマッチ作成
async function checkAndCreateMatch(
  senderId: string,
  receiverId: string,
  senderType: "jobseeker" | "company",
): Promise<{ isMatch: boolean; matchType?: "auto" | "company_reply"; matchedUser?: any }> {
  try {
    console.log(`=== マッチング判定開始 ===`)

    if (senderType === "jobseeker") {
      // 求職者→企業の場合
      // まず企業からのいいねに対する返答かチェック
      const replyResult = await handleJobseekerReplyToCompany(senderId, receiverId)
      if (replyResult.isMatch) {
        return replyResult
      }

      // 通常の求職者→企業マッチング処理
      return await handleJobseekerToCompanyMatch(senderId, receiverId)
    } else {
      // 企業→求職者の場合
      return await handleCompanyToJobseekerMatch(senderId, receiverId)
    }
  } catch (error) {
    console.error("マッチング判定エラー:", error)
    return { isMatch: false }
  }
}

// 求職者が企業からのいいねに返答する場合の処理
async function handleJobseekerReplyToCompany(
  jobseekerId: string,
  companyId: string,
): Promise<{ isMatch: boolean; matchType?: "auto" | "company_reply"; matchedUser?: any }> {
  console.log("求職者が企業からのいいねに返答")

  // 1. 既存のマッチをチェック
  const existingMatch = await checkExistingMatch(companyId, jobseekerId)
  if (existingMatch) {
    console.log("既にマッチ済み")
    return { isMatch: false }
  }

  // 2. 企業からの既存のいいねをチェック
  const { data: existingCompanyLike } = await supabase
    .from("likes")
    .select("*")
    .eq("sender_user_id", companyId)
    .eq("receiver_user_id", jobseekerId)
    .eq("sender_type", "company")
    .single()

  if (existingCompanyLike) {
    // 相互いいね成立
    console.log("相互いいね成立（求職者が企業のいいねに返答）")
    const match = await createMatch(companyId, jobseekerId, "company_reply")
    if (match) {
      const matchedUser = await getMatchedUserInfo(companyId, "company")
      return { isMatch: true, matchType: "company_reply", matchedUser }
    }
  }

  return { isMatch: false }
}

// 求職者→企業のマッチング処理
async function handleJobseekerToCompanyMatch(
  jobseekerId: string,
  companyId: string,
): Promise<{ isMatch: boolean; matchType?: "auto" | "company_reply"; matchedUser?: any }> {
  console.log("求職者→企業のマッチング判定")

  // 1. 既存のマッチをチェック
  const existingMatch = await checkExistingMatch(companyId, jobseekerId)
  if (existingMatch) {
    console.log("既にマッチ済み")
    return { isMatch: false }
  }

  // 2. 求職者のプロフィールを取得
  const { data: jobseekerProfile } = await supabase
    .from("jobseeker_profiles")
    .select("*")
    .eq("user_id", jobseekerId)
    .single()

  // 3. 企業のプロフィールを取得
  const { data: companyProfile } = await supabase.from("company_profiles").select("*").eq("user_id", companyId).single()

  if (!jobseekerProfile || !companyProfile) {
    console.log("プロフィール情報が不足")
    return { isMatch: false }
  }

  // 4. スキル・資格マッチング判定
  const isAutoMatch = checkSkillsAndQualifications(jobseekerProfile, companyProfile)

  if (isAutoMatch) {
    // 自動マッチ成立
    console.log("スキル・資格条件を満たすため自動マッチ")
    const match = await createMatch(companyId, jobseekerId, "auto")
    if (match) {
      const matchedUser = await getMatchedUserInfo(companyId, "company")
      return { isMatch: true, matchType: "auto", matchedUser }
    }
  } else {
    console.log("スキル・資格条件を満たさないため、企業の判断待ち")
  }

  return { isMatch: false }
}

// 企業→求職者のマッチング処理
async function handleCompanyToJobseekerMatch(
  companyId: string,
  jobseekerId: string,
): Promise<{ isMatch: boolean; matchType?: "auto" | "company_reply"; matchedUser?: any }> {
  console.log("企業→求職者のマッチング判定")

  // 1. 既存のマッチをチェック
  const existingMatch = await checkExistingMatch(companyId, jobseekerId)
  if (existingMatch) {
    console.log("既にマッチ済み")
    return { isMatch: false }
  }

  // 2. 求職者からの既存のいいねをチェック
  const { data: existingLike } = await supabase
    .from("likes")
    .select("*")
    .eq("sender_user_id", jobseekerId)
    .eq("receiver_user_id", companyId)
    .eq("sender_type", "jobseeker")
    .single()

  if (existingLike) {
    // 相互いいね成立
    console.log("相互いいね成立")
    const match = await createMatch(companyId, jobseekerId, "company_reply")
    if (match) {
      const matchedUser = await getMatchedUserInfo(jobseekerId, "jobseeker")
      return { isMatch: true, matchType: "company_reply", matchedUser }
    }
  }

  return { isMatch: false }
}

// スキル・資格マッチング判定
function checkSkillsAndQualifications(jobseekerProfile: any, companyProfile: any): boolean {
  try {
    // 求職者のスキル（カンマ区切り文字列を配列に変換）
    const jobseekerSkillsRaw = jobseekerProfile.skills || ""
    const jobseekerSkills = jobseekerSkillsRaw
      .split(",")
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean)

    // 企業の必須スキル（カンマ区切り文字列を配列に変換）
    const requiredSkillsRaw = companyProfile.required_skills || ""
    const requiredSkills = requiredSkillsRaw
      .split(",")
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean)

    console.log("=== スキルマッチング詳細 ===")
    console.log("求職者スキル:", jobseekerSkills)
    console.log("企業必須スキル:", requiredSkills)
    console.log("求職者スキル（元データ）:", jobseekerProfile.skills)
    console.log("企業必須スキル（元データ）:", companyProfile.required_skills)

    // 必須スキルがない場合は自動マッチ
    if (!requiredSkills || requiredSkills.length === 0) {
      console.log("企業の必須スキルが設定されていないため自動マッチ")
      return true
    }

    // 全ての必須スキルを求職者が持っているかチェック
    const hasAllRequiredSkills = requiredSkills.every((required: string) => jobseekerSkills.includes(required))

    console.log("必須スキル個別チェック:")
    requiredSkills.forEach((required: string) => {
      const hasSkill = jobseekerSkills.includes(required)
      console.log(`  - ${required}: ${hasSkill ? "✓" : "✗"}`)
    })

    console.log("全必須スキル保有判定:", hasAllRequiredSkills)
    console.log("=== スキルマッチング詳細終了 ===")

    return hasAllRequiredSkills
  } catch (error) {
    console.error("スキルマッチング判定エラー:", error)
    return false
  }
}

// 既存のマッチをチェック
async function checkExistingMatch(companyId: string, jobseekerId: string): Promise<boolean> {
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("id")
    .eq("user_id_company", companyId)
    .eq("user_id_jobseeker", jobseekerId)
    .single()

  return !!existingMatch
}

// マッチを作成
async function createMatch(
  companyId: string,
  jobseekerId: string,
  matchedBy: "auto" | "company_reply",
): Promise<boolean> {
  try {
    const { data: match, error } = await supabase
      .from("matches")
      .insert({
        user_id_company: companyId,
        user_id_jobseeker: jobseekerId,
        matched_by: matchedBy,
      })
      .select()
      .single()

    if (error) {
      console.error("マッチ作成エラー:", error)
      return false
    }

    console.log("マッチ作成成功:", match)
    return true
  } catch (error) {
    console.error("マッチ作成エラー:", error)
    return false
  }
}

// マッチした相手の情報を取得
async function getMatchedUserInfo(userId: string, userType: "company" | "jobseeker"): Promise<any> {
  try {
    if (userType === "company") {
      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      return {
        id: userId,
        company_name: companyProfile?.company_name || "企業",
        logo_url: companyProfile?.company_logo || "/placeholder.svg?height=80&width=80",
        position_title: companyProfile?.job_type || "募集職種",
      }
    } else {
      const { data: jobseekerProfile } = await supabase
        .from("jobseeker_profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      return {
        id: userId,
        name: jobseekerProfile?.name || "求職者",
        avatar_url: jobseekerProfile?.photo_url || "/placeholder.svg?height=80&width=80",
        job_title: jobseekerProfile?.job_type || "職種",
      }
    }
  } catch (error) {
    console.error("マッチ相手情報取得エラー:", error)
    return null
  }
}

// ユーザーのマッチ一覧を取得
export async function getUserMatchesAction(userId: string) {
  try {
    const { data: matches, error } = await supabase
      .from("matches")
      .select(`
        *,
        company_profiles!matches_user_id_company_fkey (
          company_name,
          company_logo,
          job_type
        ),
        jobseeker_profiles!matches_user_id_jobseeker_fkey (
          name,
          photo_url,
          job_type
        )
      `)
      .or(`user_id_company.eq.${userId},user_id_jobseeker.eq.${userId}`)
      .order("matched_at", { ascending: false })

    if (error) {
      console.error("マッチ一覧取得エラー:", error)
      return { success: false, matches: [], error: error.message }
    }

    return { success: true, matches: matches || [] }
  } catch (error) {
    console.error("Error in getUserMatchesAction:", error)
    return { success: false, matches: [], error: "マッチ一覧の取得に失敗しました" }
  }
}
