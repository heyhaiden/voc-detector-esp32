"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useWebSocket } from "@/components/websocket-provider"
import type { TestResult } from "@/types/test-result"

export function TestFlow({ onComplete }: { onComplete: (result: TestResult) => void }) {
  const [stage, setStage] = useState<"countdown" | "blow" | "processing">("countdown")
  const [countdown, setCountdown] = useState(3)
  const [blowTime, setBlowTime] = useState(3)
  const [blowProgress, setBlowProgress] = useState(0)
  const { sendMessage, lastMessage } = useWebSocket()

  // Handle countdown
  useEffect(() => {
    if (stage !== "countdown" || countdown <= 0) return

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)

      if (countdown === 1) {
        setStage("blow")
        setBlowTime(3)
        setBlowProgress(0)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, stage])

  // Handle blow stage with synchronized countdown and progress bar
  useEffect(() => {
    if (stage !== "blow") return

    // Update every 50ms for smooth progress bar animation
    const interval = 50
    const totalDuration = 3000 // 3 seconds in milliseconds
    const steps = totalDuration / interval
    const progressIncrement = 100 / steps

    const timer = setInterval(() => {
      setBlowProgress((prev) => {
        const newProgress = prev + progressIncrement

        // Update the countdown text every second (when progress hits certain thresholds)
        if (newProgress >= 33.33 && blowTime === 3) {
          setBlowTime(2)
        } else if (newProgress >= 66.66 && blowTime === 2) {
          setBlowTime(1)
        }

        // When we reach 100%, move to processing stage
        if (newProgress >= 100) {
          clearInterval(timer)
          setStage("processing")
          return 100
        }

        return newProgress
      })
    }, interval)

    return () => clearInterval(timer)
  }, [stage, blowTime])

  // Handle processing stage and wait for data
  useEffect(() => {
    if (stage !== "processing") return

    if (lastMessage) {
      console.log("Received data in processing stage:", lastMessage)
      onComplete({
        ...lastMessage,
        timestamp: new Date().toISOString(),
      })
    }
  }, [stage, lastMessage, onComplete])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <AnimatePresence mode="wait">
        {stage === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.8 }}
              className="text-8xl font-bold text-primary"
            >
              {countdown}
            </motion.div>
            <p className="text-xl mt-4">Get ready!</p>
          </motion.div>
        )}

        {stage === "blow" && (
          <motion.div
            key="blow"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 0.5,
              }}
              className="text-4xl font-bold text-primary mb-4"
            >
              Blow Now!
            </motion.div>

            <div className="relative w-64 h-8 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-50 ease-linear"
                style={{ width: `${blowProgress}%` }}
              />
            </div>

            <p className="mt-4 text-xl">{blowTime} seconds left</p>
          </motion.div>
        )}

        {stage === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 1,
                ease: "linear",
              }}
              className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"
            />
            <p className="mt-4 text-xl">Analyzing your breath...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
