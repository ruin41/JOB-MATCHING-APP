import { supabase } from "@/lib/supabase"

// Define the result type for image upload
export type UploadResult = {
  success: boolean
  url?: string
  error?: string
}

// Define the result type for image validation
export type ValidationResult = {
  valid: boolean
  error?: string
}

/**
 * Validates an image file for upload
 * @param file The image file to validate
 * @returns An object with validation status and error message if invalid
 */
export function validateImageFile(file: File): ValidationResult {
  // Check if file exists
  if (!file) {
    return { valid: false, error: "ファイルが選択されていません" }
  }

  // Check file size (empty file)
  if (file.size === 0) {
    return { valid: false, error: "ファイルが空です" }
  }

  // Validate file type
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "JPG、PNG、またはWEBP形式の画像のみアップロード可能です",
    }
  }

  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "画像サイズは2MB以下にしてください",
    }
  }

  return { valid: true }
}

/**
 * Uploads a profile image to Supabase Storage
 * @param file The image file to upload
 * @param userId The user ID to associate with the image
 * @returns An object with success status, URL (if successful), and error (if failed)
 */
export async function uploadProfileImage(file: File, userId: string): Promise<UploadResult> {
  // Validate the file first
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  // Check if Supabase is available
  if (!supabase) {
    console.warn("Supabase is not available, returning mock URL")
    return {
      success: true,
      url: `/placeholder.svg?height=120&width=120&text=${encodeURIComponent(userId)}`,
    }
  }

  try {
    // Generate a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}/profile.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true, contentType: file.type })

    if (error) {
      console.error("Error uploading image:", error)
      return { success: false, error: "画像のアップロードに失敗しました" }
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(data.path)

    return {
      success: true,
      url: publicUrlData.publicUrl,
    }
  } catch (error) {
    console.error("Error in uploadProfileImage:", error)
    return { success: false, error: "画像のアップロード中にエラーが発生しました" }
  }
}

/**
 * Generic image upload function (alias for uploadProfileImage)
 * @param file The image file to upload
 * @param userId The user ID to associate with the image
 * @param type Optional type identifier for the image
 * @returns Promise with upload result
 */
export async function uploadImage(file: File, userId: string, type?: string): Promise<string> {
  const result = await uploadProfileImage(file, userId)
  if (result.success && result.url) {
    return result.url
  }
  throw new Error(result.error || "画像のアップロードに失敗しました")
}

/**
 * Formats file size for display
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Gets the file extension from a filename
 * @param filename The filename to extract extension from
 * @returns The file extension (without dot)
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || ""
}

/**
 * Checks if a file type is a supported image format
 * @param fileType The MIME type of the file
 * @returns True if the file type is supported
 */
export function isSupportedImageType(fileType: string): boolean {
  const supportedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  return supportedTypes.includes(fileType)
}
