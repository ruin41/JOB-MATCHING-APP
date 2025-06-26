"use client"

import type { KeyboardEvent } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
}

export function ChatInput({ value, onChange, onSend }: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-end">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          className="flex-1 border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[40px] max-h-[120px]"
          rows={1}
        />
        <Button
          onClick={onSend}
          disabled={!value.trim()}
          className={`ml-2 p-2 rounded-full ${
            value.trim()
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          aria-label="送信"
        >
          <Send size={20} />
        </Button>
      </div>
    </div>
  )
}
