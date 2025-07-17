export async function createSendbirdChannel(userIds: string[]): Promise<string | null> {
    const res = await fetch(`https://api-${process.env.NEXT_PUBLIC_SENDBIRD_APP_ID}.sendbird.com/v3/group_channels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Token": process.env.SENDBIRD_API_TOKEN!,
      },
      body: JSON.stringify({
        user_ids: userIds,
        is_distinct: true,
        name: `${userIds.join("-")}-channel`,
      }),
    })
  
    if (!res.ok) {
      console.error("Sendbird チャネル作成エラー", await res.text())
      return null
    }
  
    const data = await res.json()
    return data.channel_url
  }
  