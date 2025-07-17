import { supabase } from "@/lib/supabaseClient"

export type MatchConversation = {
  id: string
  name: string
  channel_url: string
}

export async function getMatchedConversations(userId: string): Promise<MatchConversation[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("id, user_id_company, user_id_jobseeker, channel_url")
    .or(`user_id_company.eq.${userId},user_id_jobseeker.eq.${userId}`)

  if (error || !data) {
    console.error("マッチ情報の取得に失敗", error)
    return []
  }

  return data
    .filter((m) => m.channel_url)
    .map((m) => ({
      id: m.channel_url, // Sendbird channel_url
      name: m.id,        // 表示名にしたい項目があれば変更可
      channel_url: m.channel_url,
    }))
}