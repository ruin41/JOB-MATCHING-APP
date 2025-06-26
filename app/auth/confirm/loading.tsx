import { Heart, Loader2 } from "lucide-react"

export default function AuthConfirmLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center space-x-2 mb-8">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">JobMatch</span>
      </div>

      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 border border-blue-200 rounded-full p-4 mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">認証ページを読み込み中</h2>
        <p className="text-gray-600">しばらくお待ちください...</p>
      </div>
    </div>
  )
}
