"use client"

import { useState, useEffect } from "react"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { ChatHeader } from "@/components/chat/ChatHeader"
import { type ChatConversation, generateDummyData, generateCompanyDummyData } from "@/lib/chat-dummy-data"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { Button } from "@/components/ui/button"
import { MessageSquare, ArrowLeft } from "lucide-react"

export default function ChatPage() {
  const { isLoading, isAuthenticated } = useAuthGuard()
  const [userType, setUserType] = useState<"jobseeker" | "company">("jobseeker")
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // ユーザータイプの判定とデータ初期化
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      try {
        // URLパラメータからユーザータイプを取得
        const params = new URLSearchParams(window.location.search)
        const type = params.get("type")
        const currentUserType = type === "company" ? "company" : "jobseeker"
        setUserType(currentUserType)

        // ダミーデータの読み込み
        const data = currentUserType === "jobseeker" ? generateDummyData() : generateCompanyDummyData()
        setConversations(data)

        // 最初の会話を選択
        if (data.length > 0) {
          setSelectedConversation(data[0])
        }

        setIsInitialized(true)
      } catch (error) {
        console.error("チャット画面初期化エラー:", error)
        // エラーが発生してもデフォルト値で初期化
        const data = generateDummyData()
        setConversations(data)
        if (data.length > 0) {
          setSelectedConversation(data[0])
        }
        setIsInitialized(true)
      }
    }
  }, [isInitialized])

  // モバイル表示の場合、サイドバーを非表示に
  useEffect(() => {
    if (isMobile && selectedConversation) {
      setShowSidebar(false)
    } else if (!isMobile) {
      setShowSidebar(true)
    }
  }, [isMobile, selectedConversation])

  // 認証チェック中のローディング表示
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未認証の場合は何も表示しない（リダイレクト中）
  if (!isAuthenticated) {
    return null
  }

  // 会話を選択
  const handleSelectConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation)
    if (isMobile) {
      setShowSidebar(false)
    }
  }

  // メッセージを送信
  const handleSendMessage = (content: string) => {
    if (!selectedConversation || !content.trim()) return

    const newMessage = {
      id: `msg-new-${Date.now()}`,
      senderId: "current-user",
      content,
      timestamp: new Date(),
      read: true,
    }

    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
    }

    setSelectedConversation(updatedConversation)
    setConversations(conversations.map((conv) => (conv.id === updatedConversation.id ? updatedConversation : conv)))
  }

  // サイドバー表示切り替え
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 共通ヘッダー */}
      <ChatHeader userType={userType} />

      {/* チャットコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <div
          className={`${
            showSidebar ? "block" : "hidden"
          } md:block w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 overflow-hidden`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold">マッチ一覧</h1>
            {isMobile && selectedConversation && (
              <Button variant="ghost" size="sm" onClick={toggleSidebar} className="md:hidden">
                <MessageSquare className="h-5 w-5" />
                <span className="ml-2">チャットを表示</span>
              </Button>
            )}
          </div>
          <ChatSidebar
            conversations={conversations}
            selectedId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            userType={userType}
          />
        </div>

        {/* チャットウィンドウ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {isMobile && !showSidebar && (
                <div className="p-2 bg-white border-b border-gray-200">
                  <Button variant="ghost" size="sm" onClick={toggleSidebar} className="flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    マッチ一覧に戻る
                  </Button>
                </div>
              )}
              <ChatWindow
                conversation={selectedConversation}
                onSendMessage={handleSendMessage}
                onToggleSidebar={toggleSidebar}
                showBackButton={false}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-white">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>会話を選択してください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
