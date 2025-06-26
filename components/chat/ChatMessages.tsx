"use client"

import type React from "react"

import { useRef } from "react"
import { ChatMessage } from "./ChatMessage"
import type { ChatMessage as ChatMessageType } from "@/lib/chat-dummy-data"

interface ChatMessagesProps {
  messages: ChatMessageType[]
  currentUserId: string
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export function ChatMessages({ messages, currentUserId, messagesEndRef }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 日付ごとにメッセージをグループ化
  const groupMessagesByDate = (messages: ChatMessageType[]) => {
    const groups: { [key: string]: ChatMessageType[] } = {}

    messages.forEach((message) => {
      const date = message.timestamp.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      if (!groups[date]) {
        groups[date] = []
      }

      groups[date].push(message)
    })

    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
      {Object.entries(messageGroups).map(([date, msgs]) => (
        <div key={date} className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-200 rounded-full px-3 py-1">
              <span className="text-xs text-gray-600">{date}</span>
            </div>
          </div>

          {msgs.map((message) => (
            <ChatMessage key={message.id} message={message} isOwn={message.senderId === currentUserId} />
          ))}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
