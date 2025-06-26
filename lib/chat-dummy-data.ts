import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

// 現在のユーザーID（自分）
export const currentUserId = "current-user"

// 企業情報の型定義
export interface CompanyInfo {
  position: string
  industry?: string
}

// 求職者情報の型定義
export interface JobseekerInfo {
  jobTitle: string
  experience?: string
  skills?: string[]
}

// チャットユーザーの型定義
export interface ChatUser {
  id: string
  name: string
  avatarUrl: string
  lastSeen?: Date
  isOnline?: boolean
  companyInfo?: CompanyInfo
  jobseekerInfo?: JobseekerInfo
}

// メッセージの型定義
export interface ChatMessage {
  id: string
  senderId: string
  content: string
  timestamp: Date
  read?: boolean
}

// チャット会話の型定義
export interface ChatConversation {
  id: string
  user: ChatUser
  messages: ChatMessage[]
}

// 求職者向けダミーデータ生成（空の配列を返す）
export const generateDummyData = (): ChatConversation[] => {
  return []
}

// 企業向けダミーデータ生成（空の配列を返す）
export const generateCompanyDummyData = (): ChatConversation[] => {
  return []
}

// 時間表示のフォーマット
export function formatMessageTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: ja })
}

// 最新メッセージを取得
export function getLatestMessage(messages: ChatMessage[]): ChatMessage | undefined {
  if (messages.length === 0) return undefined
  return messages.reduce((latest, message) => (message.timestamp > latest.timestamp ? message : latest))
}

// 未読メッセージ数を取得
export function getUnreadCount(messages: ChatMessage[]): number {
  return messages.filter((msg) => msg.senderId !== currentUserId && !msg.read).length
}
