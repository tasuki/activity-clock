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
  const [time, setTime] = useState<Date | null>(null)
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
    setTime(new Date())
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) {
    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
        <div className="relative w-full aspect-square max-w-2xl">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle
              cx="200"
              cy="200"
              r="190"
              fill="white"
              stroke="currentColor"
              strokeWidth="4"
              className="text-foreground"
            />
          </svg>
        </div>
      </div>
    )
  }

  // Calculate hand angles
  const seconds = time.getSeconds()
  const minutes = time.getMinutes()
  const hours = time.getHours() % 12

  const secondAngle = seconds * 6 // 360/60
  const minuteAngle = minutes * 6 + seconds * 0.1 // 6 degrees per minute + 0.1 degrees per second
  const hourAngle = hours * 30 + minutes * 0.5 // Smooth hour hand

  // Convert time string to angle (0-360 degrees, starting from 12 o'clock)
  function timeToAngle(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number)
    // Minute hand position: 6 degrees per minute
    return minutes * 6
  }

  // Get activities for the next hour
  function getNextHourActivities(): Array<Activity & { startAngle: number; endAngle: number }> {
    const currentMinutes = time.getHours() * 60 + time.getMinutes() + time.getSeconds() / 60
    const oneHourLater = currentMinutes + 60

    return activities
      .map((activity) => {
        const [startH, startM] = activity.startTime.split(":").map(Number)
        const [endH, endM] = activity.endTime.split(":").map(Number)
        let startMinutes = startH * 60 + startM
        let endMinutes = endH * 60 + endM

        // Handle midnight wraparound
        if (endMinutes < startMinutes) {
          endMinutes += 24 * 60
        }
        if (startMinutes < currentMinutes && endMinutes < currentMinutes) {
          startMinutes += 24 * 60
          endMinutes += 24 * 60
        }

        // Check if activity overlaps with next hour window
        if (endMinutes <= currentMinutes || startMinutes >= oneHourLater) {
          return null
        }

        // Calculate visible portion within the next hour
        const visibleStart = Math.max(startMinutes, currentMinutes)
        const visibleEnd = Math.min(endMinutes, oneHourLater)

        // Convert to angles relative to current minute hand position
        // 0 degrees = current minute hand position, 360 degrees = one hour later
        const startAngle = ((visibleStart - currentMinutes) / 60) * 360
        const endAngle = ((visibleEnd - currentMinutes) / 60) * 360

        return { ...activity, startAngle, endAngle }
      })
      .filter(Boolean) as Array<Activity & { startAngle: number; endAngle: number }>
  }

  const nextHourActivities = getNextHourActivities()

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      <div className="relative w-full aspect-square max-w-2xl">
        {/* SVG Clock */}
        <svg viewBox="0 0 400 400" className="w-full h-full">
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

          {nextHourActivities.map((activity) => {
            // Current minute hand is at 0°, one hour later is at 360°
            // Adjust to SVG coordinates (0° at top = -90°)
            const currentAngle = minuteAngle - 90
            const startAngle = currentAngle + activity.startAngle
            const endAngle = currentAngle + activity.endAngle

            const radius = 170
            const centerX = 200
            const centerY = 200
            
            // Fade zone is last 10 minutes = 60 degrees
            const fadeZoneDegrees = 60
            const fadeStartAngle = activity.startAngle
            const activitySpan = activity.endAngle - activity.startAngle
            
            // If activity is longer than fade zone, draw solid part + fade part
            // Otherwise, the whole thing fades
            const hasSolidPart = activitySpan > fadeZoneDegrees
            
            const paths = []
            
            if (hasSolidPart) {
              // Solid part: from start to (end - fadeZone)
              const solidEndAngle = currentAngle + activity.endAngle - fadeZoneDegrees
              const solidStartAngle = currentAngle + activity.startAngle
              
              const solidStartX = centerX + radius * Math.cos((solidStartAngle * Math.PI) / 180)
              const solidStartY = centerY + radius * Math.sin((solidStartAngle * Math.PI) / 180)
              const solidEndX = centerX + radius * Math.cos((solidEndAngle * Math.PI) / 180)
              const solidEndY = centerY + radius * Math.sin((solidEndAngle * Math.PI) / 180)
              
              const solidSpan = activitySpan - fadeZoneDegrees
              const solidLargeArc = solidSpan > 180 ? 1 : 0
              
              paths.push(
                <path
                  key={`${activity.id}-solid`}
                  d={`M ${centerX} ${centerY} L ${solidStartX} ${solidStartY} A ${radius} ${radius} 0 ${solidLargeArc} 1 ${solidEndX} ${solidEndY} Z`}
                  fill={hexToPastel(activity.color)}
                  opacity="0.5"
                />
              )
              
              // Fade part: last fadeZoneDegrees before minute hand
              const fadeStartAngleSvg = currentAngle + activity.endAngle - fadeZoneDegrees
              const fadeEndAngleSvg = currentAngle + activity.endAngle
              
              // Draw fade segments
              const fadeSegments = 10
              for (let i = 0; i < fadeSegments; i++) {
                const segStart = fadeStartAngleSvg + (i / fadeSegments) * fadeZoneDegrees
                const segEnd = fadeStartAngleSvg + ((i + 1) / fadeSegments) * fadeZoneDegrees
                const opacity = 0.5 * (1 - (i + 1) / fadeSegments)
                
                const segStartX = centerX + radius * Math.cos((segStart * Math.PI) / 180)
                const segStartY = centerY + radius * Math.sin((segStart * Math.PI) / 180)
                const segEndX = centerX + radius * Math.cos((segEnd * Math.PI) / 180)
                const segEndY = centerY + radius * Math.sin((segEnd * Math.PI) / 180)
                
                paths.push(
                  <path
                    key={`${activity.id}-fade-${i}`}
                    d={`M ${centerX} ${centerY} L ${segStartX} ${segStartY} A ${radius} ${radius} 0 0 1 ${segEndX} ${segEndY} Z`}
                    fill={hexToPastel(activity.color)}
                    opacity={opacity}
                  />
                )
              }
            } else {
              // Whole activity is within fade zone - fade the entire thing
              const fadeSegments = 10
              for (let i = 0; i < fadeSegments; i++) {
                const segStartRatio = i / fadeSegments
                const segEndRatio = (i + 1) / fadeSegments
                const segStart = currentAngle + activity.startAngle + segStartRatio * activitySpan
                const segEnd = currentAngle + activity.startAngle + segEndRatio * activitySpan
                // Fade based on position within the 60-degree zone before minute hand
                const distFromMinuteHand = activity.endAngle - segEndRatio * activitySpan
                const opacity = 0.5 * Math.min(1, distFromMinuteHand / fadeZoneDegrees)
                
                const segStartX = centerX + radius * Math.cos((segStart * Math.PI) / 180)
                const segStartY = centerY + radius * Math.sin((segStart * Math.PI) / 180)
                const segEndX = centerX + radius * Math.cos((segEnd * Math.PI) / 180)
                const segEndY = centerY + radius * Math.sin((segEnd * Math.PI) / 180)
                
                paths.push(
                  <path
                    key={`${activity.id}-fade-${i}`}
                    d={`M ${centerX} ${centerY} L ${segStartX} ${segStartY} A ${radius} ${radius} 0 0 1 ${segEndX} ${segEndY} Z`}
                    fill={hexToPastel(activity.color)}
                    opacity={opacity}
                  />
                )
              }
            }
            
            return <g key={activity.id}>{paths}</g>
          })}

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

      {nextHourActivities.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {nextHourActivities.map((activity) => (
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
