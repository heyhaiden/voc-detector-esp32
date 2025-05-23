"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Check } from "lucide-react"
import { useAchievements } from "@/hooks/use-achievements"

type UserProfile = {
  name: string
  units: "metric" | "imperial"
  timezone: string
  avatarUrl?: string
}

export function ProfilePage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>("user-profile", {
    name: "",
    units: "metric",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<UserProfile>(profile)
  const [isSaved, setIsSaved] = useState(false)

  // Reset form data when profile changes
  useEffect(() => {
    setFormData(profile)
  }, [profile])

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setProfile(formData)
    setIsEditing(false)

    // Show saved indicator
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const getInitials = (name: string) => {
    return (
      name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2) || "?"
    )
  }

  const { getUnlockedAchievements } = useAchievements()
  const unlockedAchievements = getUnlockedAchievements()

  return (
    <div className="py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your personal settings</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>

              {isEditing && (
                <Button variant="outline" size="sm" className="relative">
                  <Camera className="w-4 h-4 mr-2" />
                  Change Photo
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        // In a real app, you'd upload this to a server
                        // For demo, we'll use a data URL
                        const reader = new FileReader()
                        reader.onload = (e) => {
                          setFormData((prev) => ({
                            ...prev,
                            avatarUrl: e.target?.result as string,
                          }))
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="units">Preferred Units</Label>
                  <Select value={formData.units} onValueChange={(value) => handleChange("units", value)}>
                    <SelectTrigger id="units">
                      <SelectValue placeholder="Select units" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (°C, hPa)</SelectItem>
                      <SelectItem value="imperial">Imperial (°F, inHg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={formData.timezone} onValueChange={(value) => handleChange("timezone", value)}>
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData(profile)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Display Name</p>
                  <p className="font-medium">{profile.name || "Not set"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Preferred Units</p>
                  <p className="font-medium">
                    {profile.units === "metric" ? "Metric (°C, hPa)" : "Imperial (°F, inHg)"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Timezone</p>
                  <p className="font-medium">{profile.timezone}</p>
                </div>

                <div className="pt-2">
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>

                  {isSaved && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 text-sm text-green-500 flex items-center"
                    >
                      <Check className="w-4 h-4 mr-1" /> Profile saved successfully
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {unlockedAchievements.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No achievements yet. Start testing to earn your first badge!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {unlockedAchievements.slice(0, 6).map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-2 bg-muted rounded-full px-3 py-1">
                    <span className="text-sm">{achievement.icon}</span>
                    <span className="text-xs font-medium">{achievement.title}</span>
                  </div>
                ))}
                {unlockedAchievements.length > 6 && (
                  <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full px-3 py-1">
                    <span className="text-xs font-medium">+{unlockedAchievements.length - 6} more</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
