"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard"

const JobseekerProfilePage = () => {
  const { isLoading, isAuthenticated } = useAuthGuard()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // リダイレクト中
  }

  return (
    <div>
      <h1>Jobseeker Profile Page</h1>
      <p>Welcome to your profile!</p>
    </div>
  )
}

export default JobseekerProfilePage
