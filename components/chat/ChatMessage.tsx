import type { ChatMessage as ChatMessageType } from "@/lib/chat-dummy-data"

interface ChatMessageProps {
  message: ChatMessageType
  isOwn: boolean
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  return (
    <div className={`flex mb-4 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2 ${
          isOwn
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
        }`}
      >
        <p>{message.content}</p>
        <div className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
          {message.timestamp.toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {isOwn && <span className="ml-1">{message.read ? "既読" : "未読"}</span>}
        </div>
      </div>
    </div>
  )
}
