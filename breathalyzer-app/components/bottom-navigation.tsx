"use client"

import { Home, ClipboardList, User, Settings, Trophy } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/history", label: "History", icon: ClipboardList },
  { path: "/achievements", label: "Achievements", icon: Trophy },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/settings", label: "Settings", icon: Settings },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <nav className="container max-w-md mx-auto">
        <ul className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.path

            return (
              <li key={item.path} className="w-full">
                <Link
                  href={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center h-full w-full transition-colors",
                    isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("h-6 w-6 mb-1", isActive && "animate-bounce-once")} />
                  <span className="text-xs">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
