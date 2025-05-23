"use client"

import { useState, useCallback } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { TestResult } from "@/types/test-result"
import type { UserAchievements, Achievement } from "@/types/achievement"
import { ACHIEVEMENTS } from "@/data/achievements"

export function useAchievements() {
  const [userAchievements, setUserAchievements] = useLocalStorage<UserAchievements>("user-achievements", {
    unlockedAchievements: [],
    progress: {},
    lastUpdated: new Date().toISOString(),
  })

  // Track new achievements that haven't been viewed yet
  const [newAchievements, setNewAchievements] = useLocalStorage<Achievement[]>("new-achievements", [])

  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([])

  // Separate calculation from state updates
  const calculateProgressOnly = useCallback(
    (testHistory: TestResult[]) => {
      const progress: Record<string, number> = {}

      ACHIEVEMENTS.forEach((achievement) => {
        if (userAchievements.unlockedAchievements.includes(achievement.id)) {
          progress[achievement.id] = achievement.criteria.target
          return
        }

        let currentProgress = 0

        switch (achievement.type) {
          case "milestone":
            currentProgress = testHistory.length
            break

          case "streak":
            currentProgress = calculateStreak(testHistory)
            break

          case "performance":
            if (achievement.criteria.condition === "good_result") {
              currentProgress = testHistory.filter((test) => test.gas_kOhm < 100).length
            } else if (achievement.criteria.condition === "consecutive_good") {
              currentProgress = calculateConsecutiveGoodResults(testHistory)
            }
            break

          case "time":
            if (achievement.criteria.condition === "before_8am") {
              currentProgress = testHistory.filter((test) => {
                const hour = new Date(test.timestamp).getHours()
                return hour < 8
              }).length
            } else if (achievement.criteria.condition === "after_10pm") {
              currentProgress = testHistory.filter((test) => {
                const hour = new Date(test.timestamp).getHours()
                return hour >= 22
              }).length
            } else if (achievement.criteria.condition === "different_times") {
              const times = new Set()
              testHistory.forEach((test) => {
                const hour = new Date(test.timestamp).getHours()
                if (hour < 12) times.add("morning")
                else if (hour < 18) times.add("afternoon")
                else times.add("evening")
              })
              currentProgress = times.size
            }
            break

          case "frequency":
            if (achievement.criteria.condition === "same_day") {
              const dailyCounts = getDailyTestCounts(testHistory)
              currentProgress = Math.max(...Object.values(dailyCounts), 0)
            } else if (achievement.criteria.condition === "weekend") {
              const weekendDays = new Set()
              testHistory.forEach((test) => {
                const day = new Date(test.timestamp).getDay()
                if (day === 0 || day === 6) weekendDays.add(day)
              })
              currentProgress = weekendDays.size
            }
            break
        }

        progress[achievement.id] = Math.min(currentProgress, achievement.criteria.target)
      })

      return progress
    },
    [userAchievements.unlockedAchievements],
  )

  // Function that updates state based on calculated progress
  const calculateProgress = useCallback(
    (testHistory: TestResult[]) => {
      const progress = calculateProgressOnly(testHistory)
      const newUnlocked: string[] = [...userAchievements.unlockedAchievements]
      const newlyUnlockedAchievements: Achievement[] = []

      ACHIEVEMENTS.forEach((achievement) => {
        const currentProgress = progress[achievement.id] || 0

        // Check if achievement should be unlocked
        if (currentProgress >= achievement.criteria.target && !newUnlocked.includes(achievement.id)) {
          newUnlocked.push(achievement.id)
          newlyUnlockedAchievements.push(achievement)
        }
      })

      // Update user achievements if there are changes
      if (newUnlocked.length > userAchievements.unlockedAchievements.length) {
        setUserAchievements({
          unlockedAchievements: newUnlocked,
          progress,
          lastUpdated: new Date().toISOString(),
        })

        // Add newly unlocked achievements to the newAchievements array
        if (newlyUnlockedAchievements.length > 0) {
          setNewAchievements([...newAchievements, ...newlyUnlockedAchievements])
        }

        setNewlyUnlocked(newlyUnlockedAchievements)
      }

      return progress
    },
    [
      calculateProgressOnly,
      userAchievements.unlockedAchievements,
      setUserAchievements,
      newAchievements,
      setNewAchievements,
    ],
  )

  const calculateStreak = (testHistory: TestResult[]) => {
    if (testHistory.length === 0) return 0

    const sortedTests = [...testHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let streak = 0
    const currentDate = new Date(today)

    for (let i = 0; i < sortedTests.length; i++) {
      const testDate = new Date(sortedTests[i].timestamp)
      testDate.setHours(0, 0, 0, 0)

      if (testDate.getTime() === currentDate.getTime()) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (testDate.getTime() < currentDate.getTime()) {
        break
      }
    }

    return streak
  }

  const calculateConsecutiveGoodResults = (testHistory: TestResult[]) => {
    let consecutive = 0
    let maxConsecutive = 0

    for (const test of testHistory) {
      if (test.gas_kOhm < 100) {
        consecutive++
        maxConsecutive = Math.max(maxConsecutive, consecutive)
      } else {
        consecutive = 0
      }
    }

    return maxConsecutive
  }

  const getDailyTestCounts = (testHistory: TestResult[]) => {
    const counts: Record<string, number> = {}

    testHistory.forEach((test) => {
      const date = new Date(test.timestamp).toDateString()
      counts[date] = (counts[date] || 0) + 1
    })

    return counts
  }

  const clearNewAchievements = useCallback(() => {
    setNewAchievements([])
  }, [setNewAchievements])

  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([])
  }, [])

  const getAchievementById = useCallback((id: string) => {
    return ACHIEVEMENTS.find((achievement) => achievement.id === id)
  }, [])

  const getUnlockedAchievements = useCallback(() => {
    return userAchievements.unlockedAchievements.map((id) => getAchievementById(id)).filter(Boolean) as Achievement[]
  }, [userAchievements.unlockedAchievements, getAchievementById])

  const getLockedAchievements = useCallback(() => {
    return ACHIEVEMENTS.filter((achievement) => !userAchievements.unlockedAchievements.includes(achievement.id))
  }, [userAchievements.unlockedAchievements])

  const hasNewAchievements = useCallback(() => {
    return newAchievements.length > 0
  }, [newAchievements])

  return {
    userAchievements,
    newAchievements,
    newlyUnlocked,
    calculateProgress,
    calculateProgressOnly,
    clearNewAchievements,
    clearNewlyUnlocked,
    getAchievementById,
    getUnlockedAchievements,
    getLockedAchievements,
    hasNewAchievements,
    allAchievements: ACHIEVEMENTS,
  }
}
