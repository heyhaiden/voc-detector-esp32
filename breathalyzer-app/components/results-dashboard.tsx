"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { TestResult } from "@/types/test-result"
import confetti from "canvas-confetti"

export function ResultsDashboard({
  result,
  onReset,
  previousTests = [],
  hideBackButton = false,
}: {
  result: TestResult
  onReset: () => void
  previousTests: TestResult[]
  hideBackButton?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Determine result status
  const getStatus = (gas: number) => {
    if (gas < 100) return { label: "Good", color: "text-green-500", emoji: "🎉" }
    if (gas < 150) return { label: "Elevated", color: "text-amber-500", emoji: "⚠️" }
    return { label: "High", color: "text-red-500", emoji: "⛔" }
  }

  const status = getStatus(result.gas_kOhm)

  // Calculate percentage for visualization (0-100%)
  const percentage = Math.min(100, (result.gas_kOhm / 200) * 100)

  // Compare with previous tests
  const getComparison = () => {
    if (previousTests.length === 0) return "This is your first test!"

    const lastTest = previousTests[0]
    const diff = result.gas_kOhm - lastTest.gas_kOhm

    if (Math.abs(diff) < 10) return "Similar to your last test."

    if (diff < 0) {
      return `Improved by ${Math.abs(diff).toFixed(1)} kOhm from your last test!`
    } else {
      return `Increased by ${diff.toFixed(1)} kOhm from your last test.`
    }
  }

  // Trigger confetti for good results
  useEffect(() => {
    if (result.gas_kOhm < 100) {
      const canvas = canvasRef.current
      if (canvas) {
        const myConfetti = confetti.create(canvas, {
          resize: true,
          useWorker: true,
        })

        myConfetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      }
    }
  }, [result.gas_kOhm])

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Your Results</h1>
        <p className="text-muted-foreground">{new Date(result.timestamp).toLocaleString()}</p>
      </motion.div>

      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 text-center space-y-2">
              <div className={`text-5xl font-bold ${status.color}`}>
                {status.emoji} {status.label}
              </div>
              <p className="text-muted-foreground">Gas reading: {result.gas_kOhm.toFixed(2)} kOhm</p>
            </div>

            <div className="h-4 w-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full ${
                  percentage < 50 ? "bg-green-500" : percentage < 75 ? "bg-amber-500" : "bg-red-500"
                }`}
              />
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="font-medium">{result.temperature.toFixed(1)}°C</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Humidity</p>
                  <p className="font-medium">{result.humidity.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pressure</p>
                  <p className="font-medium">{result.pressure.toFixed(0)} hPa</p>
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm">{getComparison()}</p>
                </CardContent>
              </Card>

              {!hideBackButton && (
                <Button onClick={onReset} className="w-full" size="lg" variant="default">
                  Back to Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
