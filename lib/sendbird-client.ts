import SendbirdChat from "@sendbird/chat"
import { GroupChannelModule } from "@sendbird/chat/groupChannel"

let sbInstance: SendbirdChat | null = null

export const getSendbirdClient = async (userId: string) => {
  if (sbInstance) return sbInstance

  sbInstance = await SendbirdChat.init({
    appId: process.env.NEXT_PUBLIC_SENDBIRD_APP_ID!,
    modules: [new GroupChannelModule()],
  })

  await sbInstance.connect(userId)
  return sbInstance
}
