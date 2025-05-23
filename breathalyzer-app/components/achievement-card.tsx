"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Achievement } from "@/types/achievement"

export function AchievementCard({
  achievement,
  progress = 0,
  isUnlocked = false,
}: {
  achievement: Achievement
  progress?: number
  isUnlocked?: boolean
}) {
  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "bronze":
        return "border-amber-500 bg-amber-50"
      case "silver":
        return "border-gray-400 bg-gray-50"
      case "gold":
        return "border-yellow-500 bg-yellow-50"
      case "platinum":
        return "border-purple-500 bg-purple-50"
      default:
        return "border-gray-300 bg-gray-50"
    }
  }

  const getRarityBadgeColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "bronze":
        return "bg-amber-500 text-white"
      case "silver":
        return "bg-gray-400 text-white"
      case "gold":
        return "bg-yellow-500 text-white"
      case "platinum":
        return "bg-purple-500 text-white"
      default:
        return "bg-gray-400 text-white"
    }
  }

  const progressPercentage = (progress / achievement.criteria.target) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`relative overflow-hidden ${isUnlocked ? getRarityColor(achievement.rarity) : "opacity-60"}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className={`text-2xl ${isUnlocked ? "" : "grayscale"}`}>{achievement.icon}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-semibold ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                  {achievement.title}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full capitalize ${getRarityBadgeColor(achievement.rarity)}`}
                >
                  {achievement.rarity}
                </span>
              </div>

              <p className={`text-sm mb-3 ${isUnlocked ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                {achievement.description}
              </p>

              {!isUnlocked && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>
                      {progress}/{achievement.criteria.target}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}

              {isUnlocked && (
                <div className="flex items-center text-xs text-green-600">
                  <span className="mr-1">✓</span>
                  Unlocked
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
