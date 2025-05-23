"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWebSocket } from "@/components/websocket-provider"
import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Wifi, WifiOff, Trash2, RefreshCw } from "lucide-react"

export function SettingsPage() {
  const { isConnected, connect, disconnect } = useWebSocket()
  const [, setTestHistory] = useLocalStorage<any[]>("test-history", [])
  const [, setUserProfile] = useLocalStorage<any>("user-profile", {})
  const [isClearing, setIsClearing] = useState(false)

  const handleClearData = () => {
    setIsClearing(true)

    // Simulate a delay for better UX
    setTimeout(() => {
      setTestHistory([])
      setIsClearing(false)
    }, 1000)
  }

  const handleResetProfile = () => {
    setUserProfile({
      name: "",
      units: "metric",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  }

  return (
    <div className="py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your app preferences</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Device Connection</CardTitle>
            <CardDescription>Manage your breathalyzer device connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Connection Status</div>
                <div className="text-sm text-muted-foreground">
                  {isConnected ? "Connected to device" : "Not connected"}
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            </div>

            <Button
              onClick={isConnected ? disconnect : connect}
              variant={isConnected ? "outline" : "default"}
              className="w-full"
            >
              {isConnected ? (
                <>
                  <WifiOff className="w-4 h-4 mr-2" /> Disconnect
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-2" /> Connect
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage your test data and profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear Test History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your test history data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData}>
                    {isClearing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      "Clear Data"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" /> Reset Profile
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset your profile?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset your profile settings to default values. Your test history will not be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetProfile}>Reset Profile</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>BreathBuddy v1.0.0</p>
          <p>© 2023 BreathBuddy Inc.</p>
        </div>
      </motion.div>
    </div>
  )
}
