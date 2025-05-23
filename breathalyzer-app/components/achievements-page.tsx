"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AchievementCard } from "@/components/achievement-card"
import { AchievementNotification } from "@/components/achievement-notification"
import { useAchievements } from "@/hooks/use-achievements"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { TestResult } from "@/types/test-result"

export function AchievementsPage() {
  const [testHistory] = useLocalStorage<TestResult[]>("test-history", [])
  const {
    userAchievements,
    calculateProgressOnly,
    getUnlockedAchievements,
    getLockedAchievements,
    allAchievements,
    newAchievements,
    clearNewAchievements,
  } = useAchievements()

  const [progress, setProgress] = useState<Record<string, number>>({})
  const [showNotification, setShowNotification] = useState(false)

  // Fix: Use calculateProgressOnly instead of calculateProgress to avoid state updates
  // and only run this effect when testHistory or the function reference changes
  useEffect(() => {
    const newProgress = calculateProgressOnly(testHistory)
    setProgress(newProgress)
  }, [testHistory, calculateProgressOnly])

  // Show achievement notification when the page loads if there are new achievements
  useEffect(() => {
    if (newAchievements.length > 0) {
      setShowNotification(true)
    }
  }, [newAchievements])

  const handleDismissNotification = () => {
    setShowNotification(false)
    clearNewAchievements()
  }

  const unlockedAchievements = getUnlockedAchievements()
  const lockedAchievements = getLockedAchievements()

  const getAchievementsByType = (achievements: typeof allAchievements) => {
    return {
      milestone: achievements.filter((a) => a.type === "milestone"),
      streak: achievements.filter((a) => a.type === "streak"),
      performance: achievements.filter((a) => a.type === "performance"),
      time: achievements.filter((a) => a.type === "time"),
      frequency: achievements.filter((a) => a.type === "frequency"),
    }
  }

  const unlockedByType = getAchievementsByType(unlockedAchievements)
  const lockedByType = getAchievementsByType(lockedAchievements)

  const completionPercentage = (unlockedAchievements.length / allAchievements.length) * 100

  return (
    <div className="py-6 space-y-6">
      {showNotification && (
        <AchievementNotification achievements={newAchievements} onDismiss={handleDismissNotification} />
      )}

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">Track your testing milestones and unlock rewards</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-sm text-muted-foreground">
                  {unlockedAchievements.length}/{allAchievements.length}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-primary h-3 rounded-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{unlockedAchievements.length}</div>
                  <div className="text-xs text-muted-foreground">Unlocked</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{Math.round(completionPercentage)}%</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked ({unlockedAchievements.length})</TabsTrigger>
          <TabsTrigger value="locked">Locked ({lockedAchievements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {Object.entries({
            Milestones: [...unlockedByType.milestone, ...lockedByType.milestone],
            Streaks: [...unlockedByType.streak, ...lockedByType.streak],
            Performance: [...unlockedByType.performance, ...lockedByType.performance],
            "Time-based": [...unlockedByType.time, ...lockedByType.time],
            Frequency: [...unlockedByType.frequency, ...lockedByType.frequency],
          }).map(
            ([category, achievements]) =>
              achievements.length > 0 && (
                <div key={category} className="space-y-3">
                  <h2 className="text-xl font-semibold">{category}</h2>
                  <div className="grid gap-3">
                    {achievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        progress={progress[achievement.id] || 0}
                        isUnlocked={userAchievements.unlockedAchievements.includes(achievement.id)}
                      />
                    ))}
                  </div>
                </div>
              ),
          )}
        </TabsContent>

        <TabsContent value="unlocked" className="space-y-3">
          {unlockedAchievements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No achievements unlocked yet</p>
              <p className="text-sm mt-2">Complete your first test to start earning achievements!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {unlockedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} isUnlocked={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="locked" className="space-y-3">
          {lockedAchievements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">🎉 All achievements unlocked!</p>
              <p className="text-sm mt-2">You're a true BreathBuddy master!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {lockedAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  progress={progress[achievement.id] || 0}
                  isUnlocked={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
