"use client"

import { createClient } from "@supabase/supabase-js"

// Get environment variables from meta tags if needed
function getEnvVar(name: string): string | undefined {
  if (typeof window !== "undefined") {
    // Check for NEXT_PUBLIC_ variables first
    if (process.env[`NEXT_PUBLIC_${name}`]) {
      return process.env[`NEXT_PUBLIC_${name}`] as string
    }

    // Try to get from meta tags as fallback
    const meta = document.querySelector(`meta[name="${name.toLowerCase()}"]`)
    return meta ? meta.getAttribute("content") || undefined : undefined
  }
  return undefined
}

// Initialize the Supabase client
const supabaseUrl = getEnvVar("SUPABASE_URL") || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = getEnvVar("SUPABASE_ANON_KEY") || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

let supabase: any = null

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log("Browser Supabase client initialized successfully")
  } catch (error) {
    console.error("Failed to initialize browser Supabase client:", error)
  }
} else {
  console.warn("Supabase environment variables not found, using mock client")
}

export { supabase }
