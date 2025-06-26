import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { checkUsersMatched } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { partnerId } = await request.json()

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 })
    }

    // Get current user
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if users are matched
    const isMatched = await checkUsersMatched(user.id, partnerId)

    if (!isMatched) {
      return NextResponse.json({ error: "Users are not matched" }, { status: 403 })
    }

    // Create or get Sendbird channel
    const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID
    const apiToken = process.env.SENDBIRD_API_TOKEN

    if (!appId || !apiToken) {
      console.error("Sendbird configuration missing")
      return NextResponse.json({ error: "Chat service not configured" }, { status: 500 })
    }

    // Create channel ID based on user IDs (sorted for consistency)
    const channelId = [user.id, partnerId].sort().join("_")

    // Try to get existing channel first
    const channelUrl = `${channelId}`

    try {
      const getChannelResponse = await fetch(`https://api-${appId}.sendbird.com/v3/group_channels/${channelId}`, {
        method: "GET",
        headers: {
          "Api-Token": apiToken,
          "Content-Type": "application/json",
        },
      })

      if (getChannelResponse.ok) {
        const channelData = await getChannelResponse.json()
        return NextResponse.json({
          channelUrl: channelData.channel_url,
          isNewChannel: false,
        })
      }
    } catch (error) {
      console.log("Channel does not exist, will create new one")
    }

    // Create new channel if it doesn't exist
    const createChannelResponse = await fetch(`https://api-${appId}.sendbird.com/v3/group_channels`, {
      method: "POST",
      headers: {
        "Api-Token": apiToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel_url: channelId,
        name: "Chat",
        user_ids: [user.id, partnerId],
        is_distinct: true,
      }),
    })

    if (!createChannelResponse.ok) {
      const errorData = await createChannelResponse.text()
      console.error("Failed to create Sendbird channel:", errorData)
      return NextResponse.json({ error: "Failed to create chat channel" }, { status: 500 })
    }

    const channelData = await createChannelResponse.json()

    return NextResponse.json({
      channelUrl: channelData.channel_url,
      isNewChannel: true,
    })
  } catch (error) {
    console.error("Error in sendbird-channel API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
