"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useWebSocket } from "@/components/websocket-provider"
import { TestFlow } from "@/components/test-flow"
import { ResultsDashboard } from "@/components/results-dashboard"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { TestResult } from "@/types/test-result"
import { Wind } from "lucide-react"
import { useAchievements } from "@/hooks/use-achievements"

export function DashboardPage() {
  const [testState, setTestState] = useState<"idle" | "testing" | "results">("idle")
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null)
  const { isConnected, connect, sendMessage, lastMessage } = useWebSocket()
  const [testHistory, setTestHistory] = useLocalStorage<TestResult[]>("test-history", [])

  const { calculateProgress } = useAchievements()

  const startTest = () => {
    if (!isConnected) {
      connect()
    }
    sendMessage("start")
    setTestState("testing")
  }

  const handleTestComplete = (result: TestResult) => {
    setCurrentResult(result)
    setTestState("results")

    // Save to history
    const newHistory = [result, ...testHistory]
    setTestHistory(newHistory)

    // Check for new achievements but don't show popup here
    calculateProgress(newHistory)
  }

  const resetTest = () => {
    setTestState("idle")
    setCurrentResult(null)
  }

  // Get status based on IAQ
  const getStatus = (iaq: number) => {
    if (iaq < 50) return { label: "Excellent", color: "text-green-500", emoji: "🎉" }
    if (iaq < 100) return { label: "Good", color: "text-green-500", emoji: "👍" }
    if (iaq < 150) return { label: "Moderate", color: "text-amber-500", emoji: "⚠️" }
    if (iaq < 200) return { label: "Poor", color: "text-orange-500", emoji: "😷" }
    return { label: "Very Poor", color: "text-red-500", emoji: "⛔" }
  }

  return (
    <div className="py-6 space-y-6">
      <AnimatePresence mode="wait">
        {testState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">BreathBuddy</h1>
              <p className="text-muted-foreground">Your personal breathalyzer companion</p>
            </div>

            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                  >
                    <Wind className="w-16 h-16 text-primary" />
                  </motion.div>
                </div>

                <div>
                  <h2 className="text-xl font-bold">Ready to Test?</h2>
                  <p className="text-muted-foreground mt-1">Make sure your device is connected and ready</p>
                </div>

                <Button size="lg" className="w-full text-lg font-bold py-6" onClick={startTest}>
                  Start Test
                </Button>

                <div className="text-xs text-muted-foreground">
                  {isConnected ? (
                    <span className="text-green-500">Device connected ✓</span>
                  ) : (
                    <span>Device not connected. Will attempt to connect when test starts.</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {testHistory.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold">Recent Test</h2>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{new Date(testHistory[0].timestamp).toLocaleString()}</p>
                        <p className="text-muted-foreground text-sm">
                          CO₂: {testHistory[0].co2_eq.toFixed(0)} / VOC: {testHistory[0].voc_eq.toFixed(0)} / Gas: {testHistory[0].gas_kOhm.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {getStatus(testHistory[0].iaq).emoji} {getStatus(testHistory[0].iaq).label}
                        </div>
                        <p className="text-sm text-muted-foreground">IAQ: {testHistory[0].iaq.toFixed(0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        )}

        {testState === "testing" && <TestFlow key="testing" onComplete={handleTestComplete} />}

        {testState === "results" && currentResult && (
          <ResultsDashboard
            key="results"
            result={currentResult}
            onReset={resetTest}
            previousTests={testHistory.slice(1)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
