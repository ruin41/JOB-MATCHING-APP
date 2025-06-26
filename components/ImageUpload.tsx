"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X } from "lucide-react"
import { validateImageFile } from "@/lib/image-upload"

interface ImageUploadProps {
  currentImageUrl?: string
  onImageSelect: (file: File | null) => void
  disabled?: boolean
}

export function ImageUpload({ currentImageUrl, onImageSelect, disabled }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setError(null)

    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(currentImageUrl || null)
      onImageSelect(null)
      return
    }

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || "ファイルが無効です")
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setSelectedFile(file)
    onImageSelect(file)
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    onImageSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-4">
        {/* Image Preview */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="プロフィール画像"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-8 h-8 text-gray-400" />
            )}
          </div>

          {previewUrl && !disabled && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Upload Button */}
        {!disabled && (
          <Button type="button" variant="outline" onClick={handleButtonClick} className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>{previewUrl ? "画像を変更" : "画像をアップロード"}</span>
          </Button>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {/* Error Message */}
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {/* Help Text */}
        <p className="text-xs text-gray-500 text-center">JPG、PNG、WebP形式（最大2MB）</p>
      </div>
    </div>
  )
}

// デフォルトエクスポートを追加
export default ImageUpload
