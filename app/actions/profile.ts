"use server"

import { cookies } from "next/headers"
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseClient"

// カテゴリ別スキルデータ
const SKILLS_BY_CATEGORY = {
  フロントエンド: ["JavaScript", "React", "TypeScript", "HTML", "CSS", "Angular", "Vue.js", "Next.js"],
  バックエンド: ["Python", "Java", "Node.js", "Ruby", "Go", "C#", "PHP", "SQL", "GraphQL", "MongoDB", "NoSQL"],
  データエンジニア: [
    "Python",
    "R",
    "SQL",
    "TensorFlow",
    "PyTorch",
    "Keras",
    "Scikit-learn",
    "Spark",
    "Hadoop",
    "BigQuery",
    "Pandas",
    "NumPy",
    "ETL Tools (Airflow, Apache NiFi)",
    "Natural Language Processing (NLP)",
  ],
  モバイルアプリ開発: ["Swift", "Kotlin", "Objective-C", "Dart"],
  インフラ: ["Docker", "Kubernetes", "Terraform", "Jenkins", "Shell Scripting", "Bash"],
  DevOps: ["Go", "Docker", "Kubernetes", "Terraform", "Jenkins", "Bash"],
  その他: ["C++", "Rust", "Figma", "Sketch", "Adobe XD", "JIRA", "Trello", "Confluence", "Appium", "Spark"],
}

// 共通のユーザーID取得関数
async function getUserIdFromAuth(): Promise<string | null> {
  const cookieStore = cookies()

  // 複数のCookie名を試行
  const cookieNames = [
    "sb-user",
    "current-user",
    "demo-user",
    "jobmatch-auth.0",
    "jobmatch-auth.1",
    "sb-access-token",
    "sb-refresh-token",
    "supabase-auth-token",
  ]

  for (const cookieName of cookieNames) {
    const cookie = cookieStore.get(cookieName)
    if (cookie) {
      try {
        const userData = JSON.parse(cookie.value)
        if (userData.id) {
          console.log(`ユーザーID取得成功 (${cookieName}):`, userData.id)
          return userData.id
        }
      } catch (parseError) {
        console.error(`Cookie解析エラー (${cookieName}):`, parseError)
        continue
      }
    }
  }

  console.error("有効なユーザーセッションが見つかりません")
  return null
}

export async function getSkillsAction() {
  try {
    // カテゴリ別スキルデータを返す
    const skillsWithCategories = Object.entries(SKILLS_BY_CATEGORY).map(([category, skills]) => ({
      category,
      skills: skills.map((skill, index) => ({
        id: `${category}-${index}`,
        name: skill,
        category,
      })),
    }))

    // フラットなスキルリストも作成（後方互換性のため）
    const flatSkills = skillsWithCategories.flatMap((categoryData) =>
      categoryData.skills.map((skill, globalIndex) => ({
        id: globalIndex + 1,
        name: skill.name,
      })),
    )

    return {
      success: true,
      skills: flatSkills,
      skillsByCategory: skillsWithCategories,
    }
  } catch (error) {
    console.error("スキル取得エラー:", error)
    return {
      success: false,
      error: "スキルの取得に失敗しました",
      skills: [],
      skillsByCategory: [],
    }
  }
}

export async function createJobseekerProfileAction(formData: FormData) {
  try {
    console.log("=== 求職者プロフィール作成開始 ===")

    if (!isSupabaseAdminConfigured()) {
      return { error: "データベース設定が不完全です" }
    }

    const userId = await getUserIdFromAuth()
    if (!userId) {
      return { error: "認証が必要です" }
    }

    console.log("ユーザーID:", userId)

    // フォームデータを取得
    const name = formData.get("name") as string
    const birthdate = formData.get("birthDate") as string
    const gender = formData.get("gender") as string
    const location = formData.get("location") as string
    const occupation = formData.get("jobType") as string
    const experienceYears = Number.parseInt(formData.get("experienceYears") as string) || 0
    const preferredLocation = formData.get("preferredLocation") as string
    const desiredAnnualIncome = formData.get("desiredAnnualIncome")
      ? Number.parseInt(formData.get("desiredAnnualIncome") as string)
      : null
    const bio = formData.get("bio") as string
    const license = formData.get("license") as string
    const currentStatus = formData.get("currentStatus") as string
    const desiredTransferTiming = formData.get("desiredTransferTiming") as string
    const desiredJobType = formData.get("desiredJobType") as string

    // スキルを取得（複数選択対応）- 空配列対応
    const skills = formData.getAll("skills") as string[]
    const skillsArray = skills.filter((skill) => skill.trim() !== "")

    console.log("フォームデータ:", {
      name,
      birthdate,
      gender,
      location,
      occupation,
      experienceYears,
      preferredLocation,
      desiredAnnualIncome,
      bio,
      license,
      currentStatus,
      desiredTransferTiming,
      desiredJobType,
      skills: skillsArray,
    })

    // プロフィール画像の処理
    let photoUrl = null
    const profileImage = formData.get("profileImage") as File
    if (profileImage && profileImage.size > 0) {
      console.log("プロフィール画像アップロード開始:", profileImage.name, profileImage.size)

      const timestamp = Date.now()
      const fileExtension = profileImage.name.split(".").pop() || "png"
      const filePath = `jobseekers/${userId}/profile_${timestamp}.${fileExtension}`

      const { error: uploadError } = await supabaseAdmin!.storage.from("avatars").upload(filePath, profileImage, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("画像アップロードエラー:", uploadError)
        return { error: "画像のアップロードに失敗しました" }
      }

      const { data: urlData } = supabaseAdmin!.storage.from("avatars").getPublicUrl(filePath)
      photoUrl = urlData.publicUrl
      console.log("画像アップロード成功:", photoUrl)
    }

    // データベースに保存
    const profileData = {
      user_id: userId,
      name,
      birthdate: birthdate || null,
      gender: gender || null,
      location,
      occupation,
      experience_years: experienceYears,
      preferred_location: preferredLocation || null,
      desired_annual_income: desiredAnnualIncome,
      skills: skillsArray.join(", "), // カンマ区切り文字列として保存
      bio,
      license: license || null,
      current_status: currentStatus,
      desired_transfer_timing: desiredTransferTiming,
      desired_job_type: desiredJobType,
      photo_url: photoUrl,
    }

    console.log("データベース保存データ:", profileData)

    const { error: insertError } = await supabaseAdmin!.from("jobseeker_profiles").insert(profileData)

    if (insertError) {
      console.error("プロフィール保存エラー:", insertError)
      return { error: "プロフィールの保存に失敗しました" }
    }

    console.log("プロフィール作成成功")
    return { success: true }
  } catch (error) {
    console.error("プロフィール作成エラー:", error)
    return { error: "予期しないエラーが発生しました" }
  }
}

export async function createCompanyProfileAction(formData: FormData) {
  try {
    console.log("=== 企業プロフィール作成開始 ===")

    if (!isSupabaseAdminConfigured()) {
      return { error: "データベース設定が不完全です" }
    }

    const userId = await getUserIdFromAuth()
    if (!userId) {
      return { error: "認証が必要です" }
    }

    console.log("ユーザーID:", userId)

    // フォームデータを取得
    const companyName = formData.get("companyName") as string
    const jobType = formData.get("jobType") as string
    const location = formData.get("location") as string
    const annualIncome = formData.get("annualIncome") as string
    const companyBio = formData.get("companyBio") as string
    const requiredLicense = formData.get("requiredLicense") as string

    // 必須スキルを取得（複数選択対応）- 空配列対応
    const requiredSkills = formData.getAll("requiredSkills") as string[]
    const requiredSkillsArray = requiredSkills.filter((skill) => skill.trim() !== "")

    console.log("フォームデータ:", {
      companyName,
      jobType,
      location,
      annualIncome,
      companyBio,
      requiredLicense,
      requiredSkills: requiredSkillsArray,
    })

    // 企業ロゴの処理
    let companyLogoUrl = null
    const companyLogo = formData.get("companyLogo") as File
    if (companyLogo && companyLogo.size > 0) {
      console.log("企業ロゴアップロード開始:", companyLogo.name, companyLogo.size)

      const timestamp = Date.now()
      const fileExtension = companyLogo.name.split(".").pop() || "png"
      const filePath = `companies/${userId}/logo_${timestamp}.${fileExtension}`

      const { error: uploadError } = await supabaseAdmin!.storage.from("avatars").upload(filePath, companyLogo, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("ロゴアップロードエラー:", uploadError)
        return { error: "ロゴのアップロードに失敗しました" }
      }

      const { data: urlData } = supabaseAdmin!.storage.from("avatars").getPublicUrl(filePath)
      companyLogoUrl = urlData.publicUrl
      console.log("ロゴアップロード成功:", companyLogoUrl)
    }

    // データベースに保存
    const profileData = {
      user_id: userId,
      company_name: companyName,
      job_type: jobType,
      location,
      annual_income: annualIncome ? Number.parseInt(annualIncome) : null,
      required_skills: requiredSkillsArray.join(", "), // カンマ区切り文字列として保存
      required_license: requiredLicense || null,
      company_bio: companyBio,
      company_logo: companyLogoUrl,
    }

    console.log("データベース保存データ:", profileData)

    const { error: insertError } = await supabaseAdmin!.from("company_profiles").insert(profileData)

    if (insertError) {
      console.error("企業プロフィール保存エラー:", insertError)
      return { error: "企業プロフィールの保存に失敗しました" }
    }

    console.log("企業プロフィール作成成功")
    return { success: true }
  } catch (error) {
    console.error("企業プロフィール作成エラー:", error)
    return { error: "予期しないエラーが発生しました" }
  }
}

export async function getJobseekerProfileAction() {
  try {
    if (!isSupabaseAdminConfigured()) {
      return { error: "データベース設定が不完全です" }
    }

    const userId = await getUserIdFromAuth()
    if (!userId) {
      return { error: "認証が必要です" }
    }

    const { data: profile, error } = await supabaseAdmin!
      .from("jobseeker_profiles")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("プロフィール取得エラー:", error)
      return { error: "プロフィールの取得に失敗しました" }
    }

    return { success: true, profile }
  } catch (error) {
    console.error("プロフィール取得エラー:", error)
    return { error: "予期しないエラーが発生しました" }
  }
}

export async function getCompanyProfileAction() {
  try {
    if (!isSupabaseAdminConfigured()) {
      return { error: "データベース設定が不完全です" }
    }

    const userId = await getUserIdFromAuth()
    if (!userId) {
      return { error: "認証が必要です" }
    }

    const { data: profile, error } = await supabaseAdmin!
      .from("company_profiles")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("企業プロフィール取得エラー:", error)
      return { error: "企業プロフィールの取得に失敗しました" }
    }

    return { success: true, profile }
  } catch (error) {
    console.error("企業プロフィール取得エラー:", error)
    return { error: "予期しないエラーが発生しました" }
  }
}

export async function updateCompanyProfileAction(formData: FormData) {
  try {
    console.log("=== 企業プロフィール更新開始 ===")

    if (!isSupabaseAdminConfigured()) {
      return { error: "データベース設定が不完全です" }
    }

    const userId = await getUserIdFromAuth()
    if (!userId) {
      return { error: "認証が必要です" }
    }

    console.log("ユーザーID:", userId)

    // フォームデータを取得
    const companyName = formData.get("companyName") as string
    const jobType = formData.get("jobType") as string
    const location = formData.get("location") as string
    const annualIncome = formData.get("annualIncome") as string
    const companyBio = formData.get("companyBio") as string
    const requiredLicense = formData.get("requiredLicense") as string

    // 必須スキルを取得（複数選択対応）- 空配列対応
    const requiredSkills = formData.getAll("requiredSkills") as string[]
    const requiredSkillsArray = requiredSkills.filter((skill) => skill.trim() !== "")

    console.log("更新フォームデータ:", {
      companyName,
      jobType,
      location,
      annualIncome,
      companyBio,
      requiredLicense,
      requiredSkills: requiredSkillsArray,
    })

    // 企業ロゴの処理
    let companyLogoUrl = null
    const companyLogo = formData.get("companyLogo") as File
    if (companyLogo && companyLogo.size > 0) {
      console.log("企業ロゴ更新アップロード開始:", companyLogo.name, companyLogo.size)

      // 既存のロゴファイルを削除
      try {
        const { data: existingFiles } = await supabaseAdmin!.storage.from("avatars").list(`companies/${userId}`)

        if (existingFiles && existingFiles.length > 0) {
          const filesToDelete = existingFiles.map((file) => `companies/${userId}/${file.name}`)
          const { error: removeError } = await supabaseAdmin!.storage.from("avatars").remove(filesToDelete)

          if (removeError) {
            console.warn("既存ロゴファイル削除時の警告:", removeError)
          } else {
            console.log("既存ロゴファイル削除成功:", filesToDelete)
          }
        }
      } catch (removeErr) {
        console.warn("既存ロゴファイル削除処理エラー:", removeErr)
      }

      const timestamp = Date.now()
      const fileExtension = companyLogo.name.split(".").pop() || "png"
      const filePath = `companies/${userId}/logo_${timestamp}.${fileExtension}`

      const { error: uploadError } = await supabaseAdmin!.storage.from("avatars").upload(filePath, companyLogo, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("ロゴアップロードエラー:", uploadError)
        return { error: "ロゴのアップロードに失敗しました" }
      }

      const { data: urlData } = supabaseAdmin!.storage.from("avatars").getPublicUrl(filePath)
      companyLogoUrl = urlData.publicUrl
      console.log("ロゴアップロード成功:", companyLogoUrl)
    }

    // 更新データを構築
    const updateData: any = {
      company_name: companyName,
      job_type: jobType,
      location,
      annual_income: annualIncome ? Number.parseInt(annualIncome) : null,
      required_skills: requiredSkillsArray.join(", "), // カンマ区切り文字列として保存
      required_license: requiredLicense || null,
      company_bio: companyBio,
    }

    // ロゴが更新された場合のみ追加
    if (companyLogoUrl) {
      updateData.company_logo = companyLogoUrl
    }

    console.log("データベース更新データ:", updateData)

    const { error: updateError } = await supabaseAdmin!
      .from("company_profiles")
      .update(updateData)
      .eq("user_id", userId)

    if (updateError) {
      console.error("企業プロフィール更新エラー:", updateError)
      return { error: "企業プロフィールの更新に失敗しました" }
    }

    console.log("企業プロフィール更新成功")
    return { success: true }
  } catch (error) {
    console.error("企業プロフィール更新エラー:", error)
    return { error: "予期しないエラーが発生しました" }
  }
}

export async function getLikesReceivedCountAction() {
  try {
    console.log("いいね受信数取得開始...")

    if (!isSupabaseAdminConfigured()) {
      return { error: "データベース設定が不完全です", count: 0 }
    }

    const userId = await getUserIdFromAuth()
    if (!userId) {
      return { error: "認証が必要です", count: 0 }
    }

    console.log("ユーザーID:", userId)

    // いいね数を取得（求職者が企業から受け取ったいいね）
    const { count, error } = await supabaseAdmin!
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("liked_user_id", userId)
      .eq("user_type", "jobseeker")

    if (error) {
      console.error("いいね数取得エラー:", error)
      return { error: "いいね数の取得に失敗しました", count: 0 }
    }

    console.log("いいね受信数:", count)
    return { success: true, count: count || 0 }
  } catch (error) {
    console.error("いいね数取得エラー:", error)
    return { error: "予期しないエラーが発生しました", count: 0 }
  }
}

export async function getCompaniesWhoLikedUserAction() {
  try {
    console.log("いいねした企業一覧取得開始...")

    if (!isSupabaseAdminConfigured()) {
      return { error: "データベース設定が不完全です", companies: [] }
    }

    const userId = await getUserIdFromAuth()
    if (!userId) {
      return { error: "認証が必要です", companies: [] }
    }

    console.log("ユーザーID:", userId)

    // まず、このユーザーが受け取ったいいねがあるかチェック
    const { data: likesCheck, error: likesCheckError } = await supabaseAdmin!
      .from("likes")
      .select("id")
      .eq("liked_user_id", userId)
      .eq("user_type", "jobseeker")
      .limit(1)

    if (likesCheckError) {
      console.error("いいねチェックエラー:", likesCheckError)
      return { error: "いいね情報の確認に失敗しました", companies: [] }
    }

    if (!likesCheck || likesCheck.length === 0) {
      console.log("受け取ったいいねがありません")
      return { success: true, companies: [] }
    }

    // いいねした企業の情報を取得
    const { data: likes, error: likesError } = await supabaseAdmin!
      .from("likes")
      .select(`
        liker_user_id,
        created_at,
        company_profiles!inner(
          company_name,
          job_type,
          location,
          annual_income,
          company_bio,
          company_logo
        )
      `)
      .eq("liked_user_id", userId)
      .eq("user_type", "jobseeker")
      .order("created_at", { ascending: false })

    if (likesError) {
      console.error("いいねした企業取得エラー:", likesError)
      return { success: true, companies: [], warning: "企業情報の取得中にエラーが発生しましたが、処理を続行します" }
    }

    // データを整形
    const companies =
      likes?.map((like: any) => ({
        id: like.liker_user_id,
        company_name: like.company_profiles?.company_name || "企業名不明",
        job_type: like.company_profiles?.job_type || "職種不明",
        location: like.company_profiles?.location || "場所不明",
        annual_income: like.company_profiles?.annual_income || null,
        company_bio: like.company_profiles?.company_bio || "",
        company_logo: like.company_profiles?.company_logo || "/placeholder.svg?height=80&width=80",
        liked_at: like.created_at,
      })) || []

    console.log("いいねした企業数:", companies.length)
    return { success: true, companies }
  } catch (error) {
    console.error("いいねした企業取得エラー:", error)
    return { success: true, companies: [], warning: "予期しないエラーが発生しましたが、処理を続行します" }
  }
}

export async function updateJobseekerProfileAction(formData: FormData) {
  try {
    console.log("=== 求職者プロフィール更新開始 ===")

    if (!isSupabaseAdminConfigured()) {
      return { error: "データベース設定が不完全です" }
    }

    const userId = await getUserIdFromAuth()
    if (!userId) {
      return { error: "認証が必要です" }
    }

    console.log("ユーザーID:", userId)

    // フォームデータを取得
    const name = formData.get("name") as string
    const birthdate = formData.get("birthDate") as string
    const gender = formData.get("gender") as string
    const location = formData.get("location") as string
    const occupation = formData.get("jobType") as string
    const experienceYears = Number.parseInt(formData.get("experienceYears") as string) || 0
    const preferredLocation = formData.get("preferredLocation") as string
    const desiredAnnualIncome = formData.get("desiredAnnualIncome")
      ? Number.parseInt(formData.get("desiredAnnualIncome") as string)
      : null
    const bio = formData.get("bio") as string
    const license = formData.get("license") as string
    const currentStatus = formData.get("currentStatus") as string
    const desiredTransferTiming = formData.get("desiredTransferTiming") as string
    const desiredJobType = formData.get("desiredJobType") as string

    // スキルを取得（複数選択対応）- 空配列対応
    const skills = formData.getAll("skills") as string[]
    const skillsArray = skills.filter((skill) => skill.trim() !== "")

    console.log("更新フォームデータ:", {
      name,
      birthdate,
      gender,
      location,
      occupation,
      experienceYears,
      preferredLocation,
      desiredAnnualIncome,
      bio,
      license,
      currentStatus,
      desiredTransferTiming,
      desiredJobType,
      skills: skillsArray,
    })

    // プロフィール画像の処理
    let photoUrl = null
    const profileImage = formData.get("profileImage") as File
    if (profileImage && profileImage.size > 0) {
      console.log("プロフィール画像更新アップロード開始:", profileImage.name, profileImage.size)

      // 既存の画像ファイルを削除
      try {
        const { data: existingFiles } = await supabaseAdmin!.storage.from("avatars").list(`jobseekers/${userId}`)

        if (existingFiles && existingFiles.length > 0) {
          const filesToDelete = existingFiles.map((file) => `jobseekers/${userId}/${file.name}`)
          const { error: removeError } = await supabaseAdmin!.storage.from("avatars").remove(filesToDelete)

          if (removeError) {
            console.warn("既存画像ファイル削除時の警告:", removeError)
          } else {
            console.log("既存画像ファイル削除成功:", filesToDelete)
          }
        }
      } catch (removeErr) {
        console.warn("既存画像ファイル削除処理エラー:", removeErr)
      }

      const timestamp = Date.now()
      const fileExtension = profileImage.name.split(".").pop() || "png"
      const filePath = `jobseekers/${userId}/profile_${timestamp}.${fileExtension}`

      const { error: uploadError } = await supabaseAdmin!.storage.from("avatars").upload(filePath, profileImage, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("画像アップロードエラー:", uploadError)
        return { error: "画像のアップロードに失敗しました" }
      }

      const { data: urlData } = supabaseAdmin!.storage.from("avatars").getPublicUrl(filePath)
      photoUrl = urlData.publicUrl
      console.log("画像アップロード成功:", photoUrl)
    }

    // 更新データを構築
    const updateData: any = {
      name,
      birthdate: birthdate || null,
      gender: gender || null,
      location,
      occupation,
      experience_years: experienceYears,
      preferred_location: preferredLocation || null,
      desired_annual_income: desiredAnnualIncome,
      skills: skillsArray.join(", "), // カンマ区切り文字列として保存
      bio,
      license: license || null,
      current_status: currentStatus,
      desired_transfer_timing: desiredTransferTiming,
      desired_job_type: desiredJobType,
    }

    // 画像が更新された場合のみ追加
    if (photoUrl) {
      updateData.photo_url = photoUrl
    }

    console.log("データベース更新データ:", updateData)

    const { error: updateError } = await supabaseAdmin!
      .from("jobseeker_profiles")
      .update(updateData)
      .eq("user_id", userId)

    if (updateError) {
      console.error("求職者プロフィール更新エラー:", updateError)
      return { error: "プロフィールの更新に失敗しました" }
    }

    console.log("求職者プロフィール更新成功")
    return { success: true }
  } catch (error) {
    console.error("求職者プロフィール更新エラー:", error)
    return { error: "予期しないエラーが発生しました" }
  }
}

// 名前付きエクスポートを追加（後方互換性のため）
export const updateJobseekerProfile = updateJobseekerProfileAction
export const getJobseekerProfile = getJobseekerProfileAction
export const createJobseekerProfile = createJobseekerProfileAction
