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

  // Determine result status based on IAQ
  const getStatus = (iaq: number) => {
    if (iaq < 50) return { label: "Excellent", color: "text-green-500", emoji: "🎉" }
    if (iaq < 100) return { label: "Good", color: "text-green-500", emoji: "👍" }
    if (iaq < 150) return { label: "Moderate", color: "text-amber-500", emoji: "⚠️" }
    if (iaq < 200) return { label: "Poor", color: "text-orange-500", emoji: "😷" }
    return { label: "Very Poor", color: "text-red-500", emoji: "⛔" }
  }

  const status = getStatus(result.iaq)

  // Calculate percentage for visualization (0-100%)
  const percentage = Math.min(100, (result.iaq / 300) * 100)

  // Compare with previous tests
  const getComparison = () => {
    if (previousTests.length === 0) return "This is your first test!"

    const lastTest = previousTests[0]
    const diff = result.iaq - lastTest.iaq

    if (Math.abs(diff) < 10) return "Similar to your last test."

    if (diff < 0) {
      return `Improved by ${Math.abs(diff).toFixed(1)} points from your last test!`
    } else {
      return `Increased by ${diff.toFixed(1)} points from your last test.`
    }
  }

  // Trigger confetti for excellent results
  useEffect(() => {
    if (result.iaq < 50) {
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
  }, [result.iaq])

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
              <p className="text-muted-foreground">IAQ: {result.iaq.toFixed(0)}</p>
            </div>

            <div className="h-4 w-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full ${
                  percentage < 33 ? "bg-green-500" : percentage < 66 ? "bg-amber-500" : "bg-red-500"
                }`}
              />
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">CO₂ Equivalent</p>
                  <p className="font-medium">{result.co2_eq.toFixed(0)} ppm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">VOC Equivalent</p>
                  <p className="font-medium">{result.voc_eq.toFixed(0)} ppm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gas Resistance</p>
                  <p className="font-medium">{result.gas_kOhm.toFixed(1)} kOhm</p>
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
