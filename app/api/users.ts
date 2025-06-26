// Types for user profiles
export interface UserProfile {
  id: string
  email: string
  created_at: string
  updated_at?: string
}

export interface JobseekerProfile extends UserProfile {
  name: string
  age: number
  location: string
  skills: string[]
  experience_years: number
  bio: string
  photo_url?: string
}

export interface CompanyProfile extends UserProfile {
  company_name: string
  industry: string
  location: string
  required_skills: string[]
  required_qualifications: string[]
  description: string
  logo_url?: string
}

// Mock API implementation for demo purposes
class UsersAPI {
  async getProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    try {
      // Mock implementation - in real app, this would query Supabase
      console.log("Getting profile for user:", userId)

      const mockProfile: UserProfile = {
        id: userId,
        email: "demo@example.com",
        created_at: new Date().toISOString(),
      }

      return { data: mockProfile, error: null }
    } catch (error) {
      console.error("Error getting profile:", error)
      return { data: null, error }
    }
  }

  async getJobseekerProfile(userId: string): Promise<{ data: JobseekerProfile | null; error: any }> {
    try {
      console.log("Getting jobseeker profile for user:", userId)

      const mockProfile: JobseekerProfile = {
        id: userId,
        email: "jobseeker@example.com",
        name: "田中太郎",
        age: 28,
        location: "東京都",
        skills: ["JavaScript", "React", "Node.js"],
        experience_years: 3,
        bio: "フロントエンド開発を得意とするエンジニアです。",
        created_at: new Date().toISOString(),
      }

      return { data: mockProfile, error: null }
    } catch (error) {
      console.error("Error getting jobseeker profile:", error)
      return { data: null, error }
    }
  }

  async getCompanyProfile(userId: string): Promise<{ data: CompanyProfile | null; error: any }> {
    try {
      console.log("Getting company profile for user:", userId)

      const mockProfile: CompanyProfile = {
        id: userId,
        email: "company@example.com",
        company_name: "株式会社テックイノベーション",
        industry: "IT・ソフトウェア",
        location: "東京都渋谷区",
        required_skills: ["JavaScript", "React", "TypeScript"],
        required_qualifications: ["基本情報技術者試験"],
        description: "最新技術を活用したWebサービスを開発している会社です。",
        created_at: new Date().toISOString(),
      }

      return { data: mockProfile, error: null }
    } catch (error) {
      console.error("Error getting company profile:", error)
      return { data: null, error }
    }
  }

  async getSwipeUsers(userId: string, userType: "jobseeker" | "company"): Promise<{ data: any[]; error: any }> {
    try {
      console.log("Getting swipe users for:", userId, userType)

      // マッチング機能テスト用にモックデータを無効化
      const mockUsers: any[] = []

      return { data: mockUsers, error: null }
    } catch (error) {
      console.error("Error getting swipe users:", error)
      return { data: [], error }
    }
  }

  async updateProfile(userId: string, profileData: any): Promise<{ data: any; error: any }> {
    try {
      console.log("Updating profile for user:", userId, profileData)

      // Mock implementation
      const updatedProfile = {
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      }

      return { data: updatedProfile, error: null }
    } catch (error) {
      console.error("Error updating profile:", error)
      return { data: null, error }
    }
  }

  async getMatches(userId: string): Promise<{ data: any[]; error: any }> {
    try {
      console.log("Getting matches for user:", userId)

      // マッチング機能テスト用にモックデータを無効化
      const mockMatches: any[] = []

      return { data: mockMatches, error: null }
    } catch (error) {
      console.error("Error getting matches:", error)
      return { data: [], error }
    }
  }

  async deleteAccount(userId: string): Promise<{ data: any; error: any }> {
    try {
      console.log("Deleting account for user:", userId)

      // Mock implementation
      return { data: { id: userId, deleted: true }, error: null }
    } catch (error) {
      console.error("Error deleting account:", error)
      return { data: null, error }
    }
  }

  async create(userData: { email: string; password: string }): Promise<{ data: any; error: any }> {
    try {
      console.log("Creating user:", userData.email)

      // Mock implementation
      const newUser = {
        id: `user_${Date.now()}`,
        email: userData.email,
        created_at: new Date().toISOString(),
      }

      return { data: newUser, error: null }
    } catch (error) {
      console.error("Error creating user:", error)
      return { data: null, error }
    }
  }
}

// Export the API instance
export const usersAPI = new UsersAPI()
