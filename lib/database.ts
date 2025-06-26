import { supabase } from "./supabase"

// Default skills to use if database is not set up
const DEFAULT_SKILLS = [
  { id: 1, name: "JavaScript" },
  { id: 2, name: "TypeScript" },
  { id: 3, name: "React" },
  { id: 4, name: "Next.js" },
  { id: 5, name: "Node.js" },
  { id: 6, name: "Python" },
  { id: 7, name: "Java" },
  { id: 8, name: "C#" },
  { id: 9, name: "PHP" },
  { id: 10, name: "Ruby" },
]

// Helper function to check if Supabase is available
export const isDatabaseAvailable = () => {
  return !!supabase
}

// Development logging helper
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(...args)
  }
}

const devError = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.error(...args)
  }
}

const devWarn = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.warn(...args)
  }
}

// Types
export interface JobseekerProfile {
  name: string
  gender?: string
  birth_date?: string
  experience_years?: string
  job_type?: string
  preferred_location?: string
  preferred_salary_min?: number
  preferred_salary_max?: number
  bio?: string
  skills: string[]
}

export interface CompanyProfile {
  company_name: string
  job_type: string
  location: string
  required_skills: string[]
  annual_income?: number
  required_license?: string
  company_bio: string
  company_logo?: string
}

// いいね済みユーザーIDを取得する関数（修正版）
async function getLikedUserIds(currentUserId: string): Promise<string[]> {
  try {
    devLog("=== いいね済みユーザーID取得開始 ===")
    devLog("現在のユーザーID:", currentUserId)

    if (!currentUserId) {
      devError("currentUserIdが無効です:", currentUserId)
      return []
    }

    const { data: likes, error } = await supabase
      .from("likes")
      .select("receiver_user_id")
      .eq("sender_user_id", currentUserId)

    devLog("Supabaseクエリ結果:", { data: likes, error })

    if (error) {
      devError("いいね済みユーザーID取得エラー:", error)
      return []
    }

    const likedUserIds = likes?.map((like) => like.receiver_user_id).filter(Boolean) || []
    devLog("除外対象ユーザーID:", likedUserIds)
    devLog("除外対象数:", likedUserIds.length)
    devLog("=== いいね済みユーザーID取得終了 ===")

    return likedUserIds
  } catch (error) {
    devError("Error in getLikedUserIds:", error)
    return []
  }
}

// マッチ済みユーザーIDを取得する関数
async function getMatchedUserIds(currentUserId: string): Promise<string[]> {
  try {
    devLog("=== マッチ済みユーザーID取得開始 ===")
    devLog("現在のユーザーID:", currentUserId)

    if (!currentUserId) {
      devError("currentUserIdが無効です:", currentUserId)
      return []
    }

    const { data: matches, error } = await supabase
      .from("matches")
      .select("user_id_company, user_id_jobseeker")
      .or(`user_id_company.eq.${currentUserId},user_id_jobseeker.eq.${currentUserId}`)

    devLog("マッチクエリ結果:", { data: matches, error })

    if (error) {
      devError("マッチ済みユーザーID取得エラー:", error)
      return []
    }

    const matchedUserIds =
      matches
        ?.map((match) => {
          return match.user_id_company === currentUserId ? match.user_id_jobseeker : match.user_id_company
        })
        .filter(Boolean) || []

    devLog("マッチ済みユーザーID:", matchedUserIds)
    devLog("マッチ済み数:", matchedUserIds.length)
    devLog("=== マッチ済みユーザーID取得終了 ===")

    return matchedUserIds
  } catch (error) {
    devError("Error in getMatchedUserIds:", error)
    return []
  }
}

// Create jobseeker profile
export async function createJobseekerProfile(userId: string, profileData: any) {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning mock data")
    return { ...profileData, id: userId }
  }

  try {
    const { data, error } = await supabase
      .from("jobseeker_profiles")
      .upsert({ user_id: userId, ...profileData })
      .select()
      .single()

    if (error) {
      devError("Error creating jobseeker profile:", error)
      throw error
    }

    return data
  } catch (error) {
    devError("Error in createJobseekerProfile:", error)
    throw error
  }
}

// Create company profile
export async function createCompanyProfile(userId: string, profileData: CompanyProfile) {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning mock data")
    return { ...profileData, id: userId }
  }

  try {
    devLog("Creating company profile for user:", userId)
    devLog("Profile data:", profileData)

    const { data, error } = await supabase
      .from("company_profiles")
      .upsert({
        user_id: userId,
        company_name: profileData.company_name,
        job_type: profileData.job_type,
        location: profileData.location,
        required_skills: profileData.required_skills,
        annual_income: profileData.annual_income,
        required_license: profileData.required_license,
        company_bio: profileData.company_bio,
        company_logo: profileData.company_logo,
      })
      .select()
      .single()

    if (error) {
      devError("Error creating company profile:", error)
      throw error
    }

    devLog("Company profile created successfully:", data)
    return data
  } catch (error) {
    devError("Error in createCompanyProfile:", error)
    throw error
  }
}

// Update company profile
export async function updateCompanyProfile(userId: string, profileData: CompanyProfile) {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning mock data")
    return { ...profileData, id: userId }
  }

  try {
    devLog("Updating company profile for user:", userId)
    devLog("Profile data:", profileData)

    const { data, error } = await supabase
      .from("company_profiles")
      .update({
        company_name: profileData.company_name,
        job_type: profileData.job_type,
        location: profileData.location,
        required_skills: profileData.required_skills,
        annual_income: profileData.annual_income,
        required_license: profileData.required_license,
        company_bio: profileData.company_bio,
        company_logo: profileData.company_logo,
      })
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      devError("Error updating company profile:", error)
      throw error
    }

    devLog("Company profile updated successfully:", data)
    return data
  } catch (error) {
    devError("Error in updateCompanyProfile:", error)
    throw error
  }
}

// Get all skills
export async function getAllSkills() {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning default skills")
    return DEFAULT_SKILLS
  }

  try {
    const { data, error } = await supabase.from("skills").select("*")

    if (error) {
      devError("Error fetching skills:", error)
      return DEFAULT_SKILLS
    }

    return data.length > 0 ? data : DEFAULT_SKILLS
  } catch (error) {
    devError("Error in getAllSkills:", error)
    return DEFAULT_SKILLS
  }
}

// Get jobseeker profile with skills
export async function getJobseekerProfile(userId: string) {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, cannot fetch jobseeker profile")
    return null
  }

  try {
    const { data: profile, error } = await supabase
      .from("jobseeker_profiles")
      .select(`
        *,
        jobseeker_skills (
          skills (
            id,
            name
          )
        )
      `)
      .eq("user_id", userId)
      .single()

    if (error) {
      devError("Error fetching jobseeker profile:", error)
      return null
    }

    return profile
  } catch (error) {
    devError("Error in getJobseekerProfile:", error)
    return null
  }
}

// Get company profile
export async function getCompanyProfile(userId: string) {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, cannot fetch company profile")
    return null
  }

  try {
    devLog("Fetching company profile for user:", userId)

    const { data: profile, error } = await supabase.from("company_profiles").select("*").eq("user_id", userId).single()

    if (error) {
      devError("Error fetching company profile:", error)
      if (error.code === "PGRST116") {
        devLog("Company profile not found for user:", userId)
        return null
      }
      throw error
    }

    devLog("Company profile fetched successfully:", profile)
    return profile
  } catch (error) {
    devError("Error in getCompanyProfile:", error)
    return null
  }
}

// Create a like
export async function createLike(likerId: string, likedId: string) {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning mock like")
    return { id: Math.floor(Math.random() * 1000), liker_id: likerId, liked_id: likedId }
  }

  try {
    const { data, error } = await supabase
      .from("likes")
      .insert({
        sender_user_id: likerId,
        receiver_user_id: likedId,
      })
      .select()
      .single()

    if (error) {
      devError("Error creating like:", error)
      return null
    }

    return data
  } catch (error) {
    devError("Error in createLike:", error)
    return null
  }
}

// Get matches for a user
export async function getUserMatches(userId: string) {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning empty matches")
    return []
  }

  try {
    const { data: matches, error } = await supabase
      .from("matches")
      .select(`
        *,
        company_profiles!matches_user_id_company_fkey (
          company_name,
          company_logo,
          job_type,
          location
        ),
        jobseeker_profiles!matches_user_id_jobseeker_fkey (
          name,
          photo_url,
          job_type,
          preferred_location
        )
      `)
      .or(`user_id_company.eq.${userId},user_id_jobseeker.eq.${userId}`)
      .order("matched_at", { ascending: false })

    if (error) {
      devError("Error fetching matches:", error)
      return []
    }

    return matches || []
  } catch (error) {
    devError("Error in getUserMatches:", error)
    return []
  }
}

// Get potential matches for jobseekers (companies) - 修正版
export async function getCompaniesForJobseeker(userId: string, limit = 10) {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning empty companies list")
    return []
  }

  try {
    devLog("=== getCompaniesForJobseeker Debug ===")
    devLog("Current user ID:", userId)
    devLog("Limit:", limit)

    // 1. 全ての企業プロフィールを取得（自分以外）
    devLog("--- 全企業プロフィール取得 ---")
    const { data: allCompanies, error: allCompaniesError } = await supabase
      .from("company_profiles")
      .select("*")
      .neq("user_id", userId)
      .limit(limit * 2) // 除外を考慮して多めに取得

    devLog("全企業プロフィール取得結果:", { count: allCompanies?.length, error: allCompaniesError })

    if (allCompaniesError) {
      devError("Error fetching all companies:", allCompaniesError)
      return []
    }

    if (!allCompanies || allCompanies.length === 0) {
      devLog("企業プロフィールが見つかりません")
      return []
    }

    // 2. いいね済みユーザーIDを取得
    const likedUserIds = await getLikedUserIds(userId)
    devLog("いいね済みユーザーID:", likedUserIds)

    // 3. マッチ済みユーザーIDを取得
    const matchedUserIds = await getMatchedUserIds(userId)
    devLog("マッチ済みユーザーID:", matchedUserIds)

    // 4. 除外対象をセットに変換
    const excludeUserIds = new Set([...likedUserIds, ...matchedUserIds])
    devLog("除外対象ユーザーID（統合）:", Array.from(excludeUserIds))

    // 5. フィルタリング
    const filteredCompanies = allCompanies.filter((company) => {
      const shouldExclude = excludeUserIds.has(company.user_id)
      devLog(`企業 ${company.company_name} (${company.user_id}): ${shouldExclude ? "除外" : "表示"}`)
      return !shouldExclude
    })

    // 6. 制限数まで切り詰め
    const finalCompanies = filteredCompanies.slice(0, limit)

    devLog("=== 最終結果 ===")
    devLog("取得した企業数:", finalCompanies.length)
    devLog(
      "企業一覧:",
      finalCompanies.map((c) => ({ name: c.company_name, user_id: c.user_id })),
    )
    devLog("=== End getCompaniesForJobseeker Debug ===")

    return finalCompanies
  } catch (error) {
    devError("Error in getCompaniesForJobseeker:", error)
    return []
  }
}

// Get potential matches for companies (jobseekers) - 修正版
export async function getJobseekersForCompany(userId: string, limit = 10) {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning empty jobseekers list")
    return []
  }

  try {
    devLog("=== getJobseekersForCompany Debug ===")
    devLog("Current user ID:", userId)
    devLog("Limit:", limit)

    // 1. 全ての求職者プロフィールを取得（自分以外）
    devLog("--- 全求職者プロフィール取得 ---")
    const { data: allJobseekers, error: allJobseekersError } = await supabase
      .from("jobseeker_profiles")
      .select("*")
      .neq("user_id", userId)
      .limit(limit * 2) // 除外を考慮して多めに取得

    devLog("全求職者プロフィール取得結果:", { count: allJobseekers?.length, error: allJobseekersError })

    if (allJobseekersError) {
      devError("Error fetching all jobseekers:", allJobseekersError)
      return []
    }

    if (!allJobseekers || allJobseekers.length === 0) {
      devLog("求職者プロフィールが見つかりません")
      return []
    }

    // 2. いいね済みユーザーIDを取得
    const likedUserIds = await getLikedUserIds(userId)
    devLog("いいね済みユーザーID:", likedUserIds)

    // 3. マッチ済みユーザーIDを取得
    const matchedUserIds = await getMatchedUserIds(userId)
    devLog("マッチ済みユーザーID:", matchedUserIds)

    // 4. 除外対象をセットに変換
    const excludeUserIds = new Set([...likedUserIds, ...matchedUserIds])
    devLog("除外対象ユーザーID（統合）:", Array.from(excludeUserIds))

    // 5. フィルタリング
    const filteredJobseekers = allJobseekers.filter((jobseeker) => {
      const shouldExclude = excludeUserIds.has(jobseeker.user_id)
      devLog(`求職者 ${jobseeker.name} (${jobseeker.user_id}): ${shouldExclude ? "除外" : "表示"}`)
      return !shouldExclude
    })

    // 6. 制限数まで切り詰め
    const finalJobseekers = filteredJobseekers.slice(0, limit)

    devLog("=== 最終結果 ===")
    devLog("取得した求職者数:", finalJobseekers.length)
    devLog(
      "求職者一覧:",
      finalJobseekers.map((j) => ({ name: j.name, user_id: j.user_id })),
    )
    devLog("=== End getJobseekersForCompany Debug ===")

    return finalJobseekers
  } catch (error) {
    devError("Error in getJobseekersForCompany:", error)
    return []
  }
}

// Get likes received count
export async function getLikesReceivedCount(userId: string) {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning 0 for testing")
    return 0
  }

  try {
    const { count, error } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("receiver_user_id", userId)

    if (error) {
      devError("Error fetching likes count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    devError("Error in getLikesReceivedCount:", error)
    return 0
  }
}

// Get received likes with sender profiles - 企業向け専用版（いいね返し済み除外なし）
export async function getReceivedLikes(userId: string) {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning empty array for testing")
    return []
  }

  try {
    devLog("=== 受信いいね取得開始（企業向け） ===")
    devLog("受信者ID:", userId)

    if (!userId || userId === null || userId === undefined) {
      devError("userIdが無効です:", userId)
      return []
    }

    // 1. 受信いいねを取得（いいね返し済み除外なし）
    devLog("--- likesテーブルからの基本データ取得 ---")
    const { data: basicLikes, error: basicError } = await supabase
      .from("likes")
      .select("*")
      .eq("receiver_user_id", userId)
      .order("created_at", { ascending: false })

    devLog("取得したいいねデータ:", basicLikes?.length || 0, "件")

    if (basicError) {
      devError("likesテーブル取得エラー:", basicError)
      return []
    }

    if (!basicLikes || basicLikes.length === 0) {
      devWarn("受信いいねが見つかりません")
      return []
    }

    devLog("基本いいねデータ取得成功:", basicLikes.length, "件")
    devLog("最初のいいねレコード構造:", basicLikes[0])

    // 2. 既にマッチ済みのユーザーIDを取得
    const matchedUserIds = await getMatchedUserIds(userId)
    const matchedUserIdSet = new Set(matchedUserIds)
    devLog("マッチ済みユーザーID:", matchedUserIds)

    devLog("--- プロフィール情報の取得 ---")
    const results = []

    for (let i = 0; i < basicLikes.length; i++) {
      const like = basicLikes[i]
      const senderId = like.sender_user_id

      devLog(`いいね ${i + 1}/${basicLikes.length} の処理`)
      devLog("送信者ID:", senderId)
      devLog("sender_type:", like.sender_type)

      if (!senderId) {
        devWarn("sender_user_idが無効:", senderId)
        continue
      }

      // マッチ済みユーザーは除外
      if (matchedUserIdSet.has(senderId)) {
        devLog("マッチ済みユーザーのため除外:", senderId)
        continue
      }

      let profileData = null
      let profileType = null

      // sender_typeが設定されている場合はそれを優先
      if (like.sender_type === "jobseeker") {
        devLog("--- 求職者プロフィール取得（sender_type指定） ---")
        const { data: jobseekerProfile, error: jobseekerError } = await supabase
          .from("jobseeker_profiles")
          .select("*")
          .eq("user_id", senderId)
          .maybeSingle()

        if (jobseekerProfile && !jobseekerError) {
          profileData = jobseekerProfile
          profileType = "jobseeker"
          devLog("求職者プロフィール取得成功:", jobseekerProfile.name)
        }
      } else if (like.sender_type === "company") {
        devLog("--- 企業プロフィール取得（sender_type指定） ---")
        const { data: companyProfile, error: companyError } = await supabase
          .from("company_profiles")
          .select("*")
          .eq("user_id", senderId)
          .maybeSingle()

        if (companyProfile && !companyError) {
          profileData = companyProfile
          profileType = "company"
          devLog("企業プロフィール取得成功:", companyProfile.company_name)
        }
      } else {
        // sender_typeが未設定の場合は両方チェック
        devLog("--- sender_type未設定のため両方チェック ---")

        const { data: jobseekerProfile, error: jobseekerError } = await supabase
          .from("jobseeker_profiles")
          .select("*")
          .eq("user_id", senderId)
          .maybeSingle()

        if (jobseekerProfile && !jobseekerError) {
          profileData = jobseekerProfile
          profileType = "jobseeker"
          devLog("求職者プロフィール取得成功:", jobseekerProfile.name)
        } else {
          const { data: companyProfile, error: companyError } = await supabase
            .from("company_profiles")
            .select("*")
            .eq("user_id", senderId)
            .maybeSingle()

          if (companyProfile && !companyError) {
            profileData = companyProfile
            profileType = "company"
            devLog("企業プロフィール取得成功:", companyProfile.company_name)
          }
        }
      }

      if (profileData && profileType) {
        const resultItem = {
          ...like,
          sender_type: profileType,
          [`${profileType}_profiles`]: profileData,
          jobseeker_profiles: profileType === "jobseeker" ? profileData : null,
          company_profiles: profileType === "company" ? profileData : null,
        }

        results.push(resultItem)
        devLog("結果に追加:", profileType, profileData.name || profileData.company_name)
      } else {
        devWarn("プロフィールが見つからないため除外:", senderId)
      }
    }

    devLog("--- 最終結果 ---")
    devLog("最終的に表示するいいね:", results.length, "件")
    devLog(
      "結果サマリー:",
      results.map((r) => ({
        sender_type: r.sender_type,
        name: r.jobseeker_profiles?.name || r.company_profiles?.company_name,
        created_at: r.created_at,
      })),
    )

    devLog("=== 受信いいね取得終了（企業向け） ===")
    return results
  } catch (error) {
    devError("getReceivedLikes 処理中エラー:", error)
    return []
  }
}

// Get companies who liked user
export async function getCompaniesWhoLikedUser(userId: string) {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning empty array for testing")
    return []
  }

  try {
    const receivedLikes = await getReceivedLikes(userId)

    return receivedLikes
      .filter((like: any) => like.sender_type === "company" && like.company_profiles)
      .map((like: any) => like.company_profiles)
  } catch (error) {
    devError("Error in getCompaniesWhoLikedUser:", error)
    return []
  }
}

// Check if company profile exists
export async function checkCompanyProfileExists(userId: string): Promise<boolean> {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning false")
    return false
  }

  try {
    devLog("Checking if company profile exists for user:", userId)

    const { data, error } = await supabase.from("company_profiles").select("id").eq("user_id", userId).single()

    if (error) {
      if (error.code === "PGRST116") {
        devLog("Company profile does not exist for user:", userId)
        return false
      }
      devError("Error checking company profile existence:", error)
      return false
    }

    devLog("Company profile exists for user:", userId)
    return !!data
  } catch (error) {
    devError("Error in checkCompanyProfileExists:", error)
    return false
  }
}

// デバッグ用: データベースの状態を確認する関数（開発環境のみ）
export async function debugDatabaseState() {
  if (!isDatabaseAvailable() || process.env.NODE_ENV !== "development") {
    return {
      users: [],
      companies: [],
      jobseekers: [],
      likes: [],
      tablesInfo: "Debug info only available in development",
    }
  }

  try {
    devLog("=== Database Debug Info ===")

    let users = []
    const userTableNames = ["users", "auth.users", "public.users"]
    for (const tableName of userTableNames) {
      try {
        const { data, error } = await supabase.from(tableName).select("id, email").limit(5)
        if (!error && data) {
          devLog(`${tableName} テーブル:`, data.length, "件")
          users = data
          break
        }
      } catch (e) {
        devLog(`${tableName} テーブルアクセス不可`)
      }
    }

    const { data: companies, error: companiesError } = await supabase
      .from("company_profiles")
      .select("user_id, company_name")
      .limit(10)

    devLog("Company profiles:", companies?.length || 0, "件")
    if (companiesError) devError("Company profiles error:", companiesError)
    if (companies && companies.length > 0) {
      devLog("Company sample:", companies[0])
    }

    const { data: jobseekers, error: jobseekersError } = await supabase
      .from("jobseeker_profiles")
      .select("user_id, name")
      .limit(10)

    devLog("Jobseeker profiles:", jobseekers?.length || 0, "件")
    if (jobseekersError) devError("Jobseeker profiles error:", jobseekersError)
    if (jobseekers && jobseekers.length > 0) {
      devLog("Jobseeker sample:", jobseekers[0])
    }

    const { data: likes, error: likesError } = await supabase.from("likes").select("*").limit(20)

    devLog("Likes:", likes?.length || 0, "件")
    if (likesError) {
      devError("Likes error:", likesError)
    } else if (likes && likes.length > 0) {
      devLog("Likes sample:", likes[0])
      devLog("Likes columns:", Object.keys(likes[0]))

      likes.forEach((like, index) => {
        devLog(`Like ${index + 1}:`, {
          id: like.id,
          sender_user_id: like.sender_user_id,
          receiver_user_id: like.receiver_user_id,
          sender_type: like.sender_type,
          created_at: like.created_at,
        })
      })

      const receiverCounts = likes.reduce((acc: any, like) => {
        const receiverId = like.receiver_user_id
        acc[receiverId] = (acc[receiverId] || 0) + 1
        return acc
      }, {})
      devLog("--- Receiver Counts ---")
      Object.entries(receiverCounts).forEach(([receiverId, count]) => {
        devLog(`Receiver ${receiverId}: ${count} likes`)
      })
    }

    devLog("=== End Database Debug Info ===")

    return {
      users: users || [],
      companies: companies || [],
      jobseekers: jobseekers || [],
      likes: likes || [],
      tablesInfo: {
        usersCount: users?.length || 0,
        companiesCount: companies?.length || 0,
        jobseekersCount: jobseekers?.length || 0,
        likesCount: likes?.length || 0,
        likesStructure: likes?.[0] ? Object.keys(likes[0]) : [],
        receiverCounts: likes
          ? likes.reduce((acc: any, like) => {
              const receiverId = like.receiver_user_id
              acc[receiverId] = (acc[receiverId] || 0) + 1
              return acc
            }, {})
          : {},
      },
    }
  } catch (error) {
    devError("Error in debugDatabaseState:", error)
    return {
      users: [],
      companies: [],
      jobseekers: [],
      likes: [],
      error: error.message,
    }
  }
}

// Check if two users are matched
export async function checkUsersMatched(userId1: string, userId2: string): Promise<boolean> {
  if (!isDatabaseAvailable()) {
    devLog("Database not available, returning false for match check")
    return false
  }

  try {
    devLog("Checking if users are matched:", userId1, "and", userId2)

    const { data: match, error } = await supabase
      .from("matches")
      .select("*")
      .eq("is_matched", true)
      .or(
        `and(user_id_company.eq.${userId1},user_id_jobseeker.eq.${userId2}),and(user_id_company.eq.${userId2},user_id_jobseeker.eq.${userId1})`,
      )
      .maybeSingle()

    if (error) {
      devError("Error checking match status:", error)
      return false
    }

    const isMatched = !!match
    devLog("Match status:", isMatched)
    return isMatched
  } catch (error) {
    devError("Error in checkUsersMatched:", error)
    return false
  }
}
