"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface CancelButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}

export default function CancelButton({
  variant = "outline",
  size = "sm",
  className = "",
  children = "キャンセル",
}: CancelButtonProps) {
  const router = useRouter()

  const handleCancelClick = () => {
    router.back()
  }

  return (
    <Button onClick={handleCancelClick} variant={variant} size={size} className={className}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      {children}
    </Button>
  )
}

// 名前付きエクスポートも追加
export { CancelButton }
