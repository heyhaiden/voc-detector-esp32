"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { TestResult } from "@/types/test-result"
import { ResultsDashboard } from "@/components/results-dashboard"

export function HistoryPage() {
  const [testHistory] = useLocalStorage<TestResult[]>("test-history", [])
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null)

  // Get status color based on gas reading
  const getStatusColor = (gas: number) => {
    if (gas < 100) return "bg-green-500"
    if (gas < 150) return "bg-amber-500"
    return "bg-red-500"
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  if (selectedTest) {
    return (
      <div className="py-6">
        <Button variant="ghost" onClick={() => setSelectedTest(null)} className="mb-4">
          ← Back to History
        </Button>
        <ResultsDashboard
          result={selectedTest}
          onReset={() => setSelectedTest(null)}
          previousTests={testHistory.filter((t) => t.timestamp !== selectedTest.timestamp)}
          hideBackButton={true}
        />
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Test History</h1>
        <p className="text-muted-foreground">View your previous test results</p>
      </div>

      {testHistory.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No test history yet</p>
          <p className="text-sm mt-2">Complete your first test to see results here</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <AnimatePresence>
            {testHistory.map((test, index) => {
              const { date, time } = formatDate(test.timestamp)
              return (
                <motion.div
                  key={test.timestamp}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTest(test)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        <div className={`w-2 ${getStatusColor(test.gas_kOhm)}`} />
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{date}</p>
                              <p className="text-sm text-muted-foreground">{time}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{test.gas_kOhm.toFixed(1)} kOhm</p>
                              <p className="text-xs text-muted-foreground">
                                {test.temperature.toFixed(1)}°C / {test.humidity.toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
