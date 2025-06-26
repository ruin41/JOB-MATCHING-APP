"use client"

import { useState, useRef, useEffect } from "react"
import { ChatMessages } from "./ChatMessages"
import { ChatInput } from "./ChatInput"
import { type ChatConversation, currentUserId } from "@/lib/chat-dummy-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, User } from "lucide-react"

interface ChatWindowProps {
  conversation: ChatConversation
  onSendMessage: (content: string) => void
  onToggleSidebar: () => void
  showBackButton: boolean
}

export function ChatWindow({ conversation, onSendMessage, onToggleSidebar, showBackButton }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // メッセージが追加されたらスクロールを一番下に移動
  useEffect(() => {
    scrollToBottom()
  }, [conversation.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue)
      setInputValue("")
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* チャット相手情報 */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.user.avatarUrl || "/placeholder.svg"} alt={conversation.user.name} />
            <AvatarFallback>
              {conversation.user.companyInfo ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          {conversation.user.isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
          )}
        </div>
        <div className="ml-3">
          <h2 className="font-medium">{conversation.user.name}</h2>
          {conversation.user.companyInfo && (
            <p className="text-xs text-gray-500">{conversation.user.companyInfo.position}</p>
          )}
          {conversation.user.jobseekerInfo && (
            <p className="text-xs text-gray-500">{conversation.user.jobseekerInfo.jobTitle}</p>
          )}
        </div>
      </div>

      <ChatMessages messages={conversation.messages} currentUserId={currentUserId} messagesEndRef={messagesEndRef} />
      <ChatInput value={inputValue} onChange={setInputValue} onSend={handleSendMessage} />
    </div>
  )
}
