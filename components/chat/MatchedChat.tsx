"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"

// Sendbird UIKit types (will be loaded dynamically)
declare global {
  interface Window {
    SendbirdUIKit: any
  }
}

interface MatchedChatProps {
  partnerId: string
  partnerName?: string
}

export default function MatchedChat({ partnerId, partnerName }: MatchedChatProps) {
  const { user } = useAuth()
  const [channelUrl, setChannelUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uikitLoaded, setUikitLoaded] = useState(false)

  // Load Sendbird UIKit
  useEffect(() => {
    const loadUIKit = async () => {
      if (window.SendbirdUIKit) {
        setUikitLoaded(true)
        return
      }

      try {
        // Load Sendbird UIKit CSS
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://uikit.sendbird.com/dist/index.css"
        document.head.appendChild(link)

        // Load Sendbird UIKit JS
        const script = document.createElement("script")
        script.src = "https://uikit.sendbird.com/dist/index.js"
        script.onload = () => {
          setUikitLoaded(true)
        }
        script.onerror = () => {
          setError("Failed to load chat interface")
        }
        document.head.appendChild(script)
      } catch (err) {
        setError("Failed to initialize chat")
      }
    }

    loadUIKit()
  }, [])

  // Get or create channel
  useEffect(() => {
    const initializeChannel = async () => {
      if (!user || !uikitLoaded) return

      try {
        setLoading(true)

        const response = await fetch("/api/sendbird-channel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ partnerId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to initialize chat")
        }

        const { channelUrl: url } = await response.json()
        setChannelUrl(url)
      } catch (err) {
        console.error("Error initializing channel:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize chat")
      } finally {
        setLoading(false)
      }
    }

    initializeChannel()
  }, [user, partnerId, uikitLoaded])

  // Initialize Sendbird UIKit
  useEffect(() => {
    if (!uikitLoaded || !channelUrl || !user) return

    const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID
    if (!appId) {
      setError("Chat service not configured")
      return
    }

    try {
      // Initialize UIKit
      window.SendbirdUIKit.init({
        appId,
        userId: user.id,
        nickname: user.email?.split("@")[0] || "User",
      })

      // Render channel component
      const channelElement = window.SendbirdUIKit.renderChannelByUrl(
        document.getElementById("sendbird-channel"),
        channelUrl,
      )

      return () => {
        // Cleanup
        if (channelElement && channelElement.unmount) {
          channelElement.unmount()
        }
      }
    } catch (err) {
      console.error("Error initializing Sendbird UIKit:", err)
      setError("Failed to initialize chat interface")
    }
  }, [uikitLoaded, channelUrl, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">チャットを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">チャットエラー</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="border-b border-gray-200 p-4 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">
          {partnerName ? `${partnerName}とのチャット` : "チャット"}
        </h2>
      </div>
      <div id="sendbird-channel" className="h-full" style={{ minHeight: "500px" }} />
    </div>
  )
}
