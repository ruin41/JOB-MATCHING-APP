"use client"

import { type ChatConversation, getLatestMessage, formatMessageTime, getUnreadCount } from "@/lib/chat-dummy-data"

interface ChatSidebarProps {
  conversations: ChatConversation[]
  selectedId?: string
  onSelectConversation: (conversation: ChatConversation) => void
  userType: "jobseeker" | "company"
}

export function ChatSidebar({ conversations, selectedId, onSelectConversation, userType }: ChatSidebarProps) {
  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">マッチしたユーザーがいません</div>
      ) : (
        <ul>
          {conversations.map((conversation) => {
            const latestMessage = getLatestMessage(conversation.messages)
            const unreadCount = getUnreadCount(conversation.messages)

            return (
              <li
                key={conversation.id}
                className={`border-b border-gray-100 cursor-pointer ${
                  selectedId === conversation.id ? "bg-purple-50" : "hover:bg-gray-50"
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-center p-4">
                  <div className="relative">
                    <img
                      src={conversation.user.avatarUrl || "/placeholder.svg"}
                      alt={conversation.user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conversation.user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium truncate">{conversation.user.name}</h3>
                      {latestMessage && (
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {formatMessageTime(latestMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    {userType === "jobseeker" && (
                      <p className="text-xs text-gray-500 truncate">{conversation.user.companyInfo?.position || ""}</p>
                    )}
                    {userType === "company" && (
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.user.jobseekerInfo?.jobTitle || ""}
                      </p>
                    )}
                    {latestMessage && (
                      <div className="flex items-center mt-1">
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {latestMessage.senderId === "current-user" ? "自分: " : ""}
                          {latestMessage.content}
                        </p>
                        {unreadCount > 0 && (
                          <span className="ml-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
