"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Achievement } from "@/types/achievement"
import confetti from "canvas-confetti"

export function AchievementNotification({
  achievements,
  onDismiss,
}: {
  achievements: Achievement[]
  onDismiss: () => void
}) {
  useEffect(() => {
    if (achievements.length > 0) {
      // Trigger confetti for achievement unlock
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#FF6347"],
      })
    }
  }, [achievements])

  if (achievements.length === 0) return null

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "bronze":
        return "from-amber-600 to-amber-800"
      case "silver":
        return "from-gray-400 to-gray-600"
      case "gold":
        return "from-yellow-400 to-yellow-600"
      case "platinum":
        return "from-purple-400 to-purple-600"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <Card className="w-full max-w-sm overflow-hidden">
            <CardContent className="p-0">
              <div className={`bg-gradient-to-r ${getRarityColor(achievements[0].rarity)} p-6 text-white text-center`}>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: 2,
                  }}
                  className="text-4xl mb-2"
                >
                  {achievements[0].icon}
                </motion.div>
                <h2 className="text-xl font-bold">Achievement Unlocked!</h2>
                <p className="text-sm opacity-90 capitalize">{achievements[0].rarity} Achievement</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold">{achievements[0].title}</h3>
                  <p className="text-muted-foreground text-sm">{achievements[0].description}</p>
                </div>

                {achievements.length > 1 && (
                  <div className="text-center text-sm text-muted-foreground">
                    +{achievements.length - 1} more achievement{achievements.length > 2 ? "s" : ""} unlocked!
                  </div>
                )}

                <Button onClick={onDismiss} className="w-full">
                  Awesome!
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
