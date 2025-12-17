"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import ActivityManager from "./activity-manager"

export interface Activity {
  id: string
  name: string
  color: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
}

// Tab10 color palette
export const TAB10_COLORS = [
  { name: "Blue", value: "#1f77b4" },
  { name: "Orange", value: "#ff7f0e" },
  { name: "Green", value: "#2ca02c" },
  { name: "Red", value: "#d62728" },
  { name: "Purple", value: "#9467bd" },
  { name: "Brown", value: "#8c564b" },
  { name: "Pink", value: "#e377c2" },
  { name: "Gray", value: "#7f7f7f" },
  { name: "Yellow", value: "#bcbd22" },
  { name: "Cyan", value: "#17becf" },
]

// Convert hex to pastel
function hexToPastel(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)

  // Blend with white to create pastel
  const pastelR = Math.round(r + (255 - r) * 0.7)
  const pastelG = Math.round(g + (255 - g) * 0.7)
  const pastelB = Math.round(b + (255 - b) * 0.7)

  return `rgb(${pastelR}, ${pastelG}, ${pastelB})`
}

export default function AnalogClock() {
  const [time, setTime] = useState(new Date())
  const [showManager, setShowManager] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])

  // Load activities from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("clock-activities")
    if (stored) {
      setActivities(JSON.parse(stored))
    }
  }, [])

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate hand angles
  const seconds = time.getSeconds()
  const minutes = time.getMinutes()
  const hours = time.getHours() % 12

  const secondAngle = seconds * 6 // 360/60
  const minuteAngle = minutes * 6 + seconds * 0.1 // Smooth minute hand
  const hourAngle = hours * 30 + minutes * 0.5 // Smooth hour hand

  // Convert time string to angle (0-360 degrees, starting from 12 o'clock)
  function timeToAngle(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number)
    const totalMinutes = (hours % 12) * 60 + minutes
    return (totalMinutes / 720) * 360 // 720 minutes in 12 hours
  }

  // Get current active activities
  function getCurrentActivities(): Activity[] {
    const now = time
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    return activities.filter((activity) => {
      const [startH, startM] = activity.startTime.split(":").map(Number)
      const [endH, endM] = activity.endTime.split(":").map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      // Handle activities that span midnight
      if (endMinutes < startMinutes) {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes
      }
      return currentMinutes >= startMinutes && currentMinutes < endMinutes
    })
  }

  const currentActivities = getCurrentActivities()

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      <div className="relative w-full aspect-square max-w-2xl">
        {/* SVG Clock */}
        <svg viewBox="0 0 400 400" className="w-full h-full">
          {/* Activity backgrounds */}
          {activities.map((activity) => {
            const startAngle = timeToAngle(activity.startTime) - 90
            const endAngle = timeToAngle(activity.endTime) - 90

            // Calculate arc path
            const radius = 180
            const centerX = 200
            const centerY = 200

            let angle = endAngle - startAngle
            if (angle < 0) angle += 360

            const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
            const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
            const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
            const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

            const largeArcFlag = angle > 180 ? 1 : 0

            return (
              <path
                key={activity.id}
                d={`M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                fill={hexToPastel(activity.color)}
                opacity="0.5"
              />
            )
          })}

          {/* Clock face */}
          <circle
            cx="200"
            cy="200"
            r="190"
            fill="white"
            stroke="currentColor"
            strokeWidth="4"
            className="text-foreground"
          />

          {/* Hour markers and numbers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180)
            const numberRadius = 150
            const markerRadius = 180
            const markerInnerRadius = 165

            return (
              <g key={i}>
                {/* Hour marker line */}
                <line
                  x1={200 + markerInnerRadius * Math.cos(angle)}
                  y1={200 + markerInnerRadius * Math.sin(angle)}
                  x2={200 + markerRadius * Math.cos(angle)}
                  y2={200 + markerRadius * Math.sin(angle)}
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-foreground"
                />
                {/* Hour number */}
                <text
                  x={200 + numberRadius * Math.cos(angle)}
                  y={200 + numberRadius * Math.sin(angle)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl font-bold fill-foreground font-sans"
                >
                  {i === 0 ? 12 : i}
                </text>
              </g>
            )
          })}

          {/* Minute markers */}
          {[...Array(60)].map((_, i) => {
            if (i % 5 === 0) return null // Skip hour positions
            const angle = (i * 6 - 90) * (Math.PI / 180)
            const outerRadius = 180
            const innerRadius = 172

            return (
              <line
                key={`min-${i}`}
                x1={200 + innerRadius * Math.cos(angle)}
                y1={200 + innerRadius * Math.sin(angle)}
                x2={200 + outerRadius * Math.cos(angle)}
                y2={200 + outerRadius * Math.sin(angle)}
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted-foreground"
              />
            )
          })}

          {/* Clock hands */}
          {/* Hour hand */}
          <line
            x1="200"
            y1="200"
            x2="200"
            y2="90"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            transform={`rotate(${hourAngle} 200 200)`}
            className="text-foreground transition-transform duration-300 ease-linear"
            style={{ transform: `rotate(${hourAngle}deg)`, transformOrigin: "200px 200px" }}
          />

          {/* Minute hand */}
          <line
            x1="200"
            y1="200"
            x2="200"
            y2="60"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-foreground transition-transform duration-300 ease-linear"
            style={{ transform: `rotate(${minuteAngle}deg)`, transformOrigin: "200px 200px" }}
          />

          {/* Second hand - no transition for jumpy effect */}
          <line
            x1="200"
            y1="200"
            x2="200"
            y2="50"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transform: `rotate(${secondAngle}deg)`, transformOrigin: "200px 200px" }}
          />

          {/* Center dot */}
          <circle cx="200" cy="200" r="8" fill="currentColor" className="text-foreground" />
          <circle cx="200" cy="200" r="4" fill="#ef4444" />
        </svg>

        {/* Manage button */}
        <Button
          size="lg"
          className="absolute bottom-4 right-4 rounded-full h-14 w-14 shadow-lg"
          onClick={() => setShowManager(true)}
        >
          <Settings className="h-6 w-6" />
        </Button>
      </div>

      {/* Current activities display */}
      {currentActivities.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {currentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm"
              style={{ backgroundColor: hexToPastel(activity.color) }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activity.color }} />
              <span className="font-medium text-sm">{activity.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Activity Manager Modal */}
      <ActivityManager
        open={showManager}
        onOpenChange={setShowManager}
        activities={activities}
        onActivitiesChange={setActivities}
      />
    </div>
  )
}
