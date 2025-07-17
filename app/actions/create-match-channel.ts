"use server"

import { supabaseAdmin } from "@/lib/supabaseClient"
import { createSendbirdChannel } from "@/lib/sendbird-api"

export type Match = {
    id: string
    user_id_company: string
    user_id_jobseeker: string
    channel_url?: string
  }

export async function createMatchAndChannel(matchId: string) {
  const { data: match, error: fetchError } = await supabaseAdmin
    .from("matches")
    .select("id, user_id_company, user_id_jobseeker, channel_url")
    .eq("id", matchId)
    .single<Match>() // ← ここで型を指定！

  if (fetchError || !match) {
    console.error("マッチ取得失敗", fetchError)
    return null
  }

  if (match.channel_url) return match.channel_url

  const channelUrl = await createSendbirdChannel([match.user_id_company, match.user_id_jobseeker])
  if (!channelUrl) {
    console.error("Sendbirdチャネル作成失敗")
    return null
  }

  const { error: updateError } = await supabaseAdmin
    .from("matches")
    .update({ channel_url: channelUrl })
    .eq("id", matchId)

  if (updateError) {
    console.error("channel_urlの保存失敗", updateError)
    return null
  }

  return channelUrl
}