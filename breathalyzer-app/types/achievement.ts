export type AchievementType = "streak" | "frequency" | "performance" | "time" | "milestone"

export type AchievementRarity = "bronze" | "silver" | "gold" | "platinum"

export type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  type: AchievementType
  rarity: AchievementRarity
  criteria: {
    target: number
    condition?: string
  }
  unlockedAt?: string
  progress?: number
}

export type UserAchievements = {
  unlockedAchievements: string[]
  progress: Record<string, number>
  lastUpdated: string
}
