import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getCurrentUser() {
  try {
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting current user:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return null
  }
}

// Export for compatibility
export const currentUser = getCurrentUser
