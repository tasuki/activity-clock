"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus } from "lucide-react"
import type { Activity } from "./analog-clock"
import { TAB10_COLORS } from "./analog-clock"

interface ActivityManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activities: Activity[]
  onActivitiesChange: (activities: Activity[]) => void
}

export default function ActivityManager({ open, onOpenChange, activities, onActivitiesChange }: ActivityManagerProps) {
  const [editingActivity, setEditingActivity] = useState<Partial<Activity>>({
    name: "",
    color: TAB10_COLORS[0].value,
    startTime: "09:00",
    endTime: "10:00",
  })

  const handleSave = () => {
    if (!editingActivity.name || !editingActivity.color || !editingActivity.startTime || !editingActivity.endTime) {
      return
    }

    const newActivity: Activity = {
      id: editingActivity.id || Date.now().toString(),
      name: editingActivity.name,
      color: editingActivity.color,
      startTime: editingActivity.startTime,
      endTime: editingActivity.endTime,
    }

    let updatedActivities: Activity[]
    if (editingActivity.id) {
      // Update existing
      updatedActivities = activities.map((a) => (a.id === editingActivity.id ? newActivity : a))
    } else {
      // Add new
      updatedActivities = [...activities, newActivity]
    }

    onActivitiesChange(updatedActivities)
    localStorage.setItem("clock-activities", JSON.stringify(updatedActivities))

    // Reset form
    setEditingActivity({
      name: "",
      color: TAB10_COLORS[0].value,
      startTime: "09:00",
      endTime: "10:00",
    })
  }

  const handleDelete = (id: string) => {
    const updatedActivities = activities.filter((a) => a.id !== id)
    onActivitiesChange(updatedActivities)
    localStorage.setItem("clock-activities", JSON.stringify(updatedActivities))
  }

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Activities</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Activity Form */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold text-lg">{editingActivity.id ? "Edit Activity" : "Add New Activity"}</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Activity Name</Label>
              <Input
                id="name"
                value={editingActivity.name}
                onChange={(e) => setEditingActivity({ ...editingActivity, name: e.target.value })}
                placeholder="e.g., Math Homework"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {TAB10_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className="relative w-10 h-10 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color.value,
                      borderColor: editingActivity.color === color.value ? "#000" : "transparent",
                    }}
                    onClick={() => setEditingActivity({ ...editingActivity, color: color.value })}
                    title={color.name}
                  >
                    {editingActivity.color === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={editingActivity.startTime}
                  onChange={(e) => setEditingActivity({ ...editingActivity, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={editingActivity.endTime}
                  onChange={(e) => setEditingActivity({ ...editingActivity, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                {editingActivity.id ? "Update" : "Add"} Activity
              </Button>
              {editingActivity.id && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setEditingActivity({
                      name: "",
                      color: TAB10_COLORS[0].value,
                      startTime: "09:00",
                      endTime: "10:00",
                    })
                  }
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Activity List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Current Activities</h3>
            {activities.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No activities yet. Add your first activity above!
              </p>
            ) : (
              <div className="space-y-2">
                {[...activities]
                  .sort((a, b) => {
                    const timeA = a.startTime.split(":").map(Number)
                    const timeB = b.startTime.split(":").map(Number)
                    const minutesA = timeA[0] * 60 + timeA[1]
                    const minutesB = timeB[0] * 60 + timeB[1]
                    return minutesA - minutesB
                  })
                  .map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: activity.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{activity.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.startTime} - {activity.endTime}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(activity)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(activity.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
