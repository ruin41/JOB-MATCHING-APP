import { getSendbirdClient } from "./sendbird-client"

// メッセージ取得（履歴読み込み）
export async function fetchMessages(channelUrl: string, userId: string) {
  const sb = await getSendbirdClient(userId)
  const channel = await sb.groupChannel.getChannel(channelUrl)

  const messages = await channel.getMessagesByTimestamp(Date.now(), {
    prevResultSize: 30,
    nextResultSize: 0,
    includeMetaArray: true,
    includeReactions: true,
    reverse: true, // 最新→過去にするならtrue（必要に応じて）
  })

  return messages
    .filter((msg) => msg.isUserMessage?.()) // テキストメッセージのみ取得
    .map((msg) => ({
      id: String(msg.messageId),
      senderId: msg.sender?.userId || "",
      content: msg.message,
      timestamp: new Date(msg.createdAt),
      read: true, // ※将来的に未読判定を追加する場合は調整可能
    }))
}

// メッセージ送信（テキスト）
export async function sendMessageToChannel(channelUrl: string, content: string, userId: string) {
  const sb = await getSendbirdClient(userId)
  const channel = await sb.groupChannel.getChannel(channelUrl)

  const params = {
    message: content,
  }

  const message = await channel.sendUserMessage(params)

  return {
    id: String(message.messageId),
    senderId: message.sender?.userId || "",
    content: message.message,
    timestamp: new Date(message.createdAt),
    read: true,
  }
}
