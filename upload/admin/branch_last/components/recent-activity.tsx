"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Brain, Database, Server, User } from "lucide-react"

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: "model",
      title: "Mistral model started",
      description: "Model successfully loaded and ready for requests",
      timestamp: "2 minutes ago",
      icon: Brain,
      color: "blue",
    },
    {
      id: 2,
      type: "database",
      title: "Database backup completed",
      description: "Automated backup of modelsraver1 database",
      timestamp: "15 minutes ago",
      icon: Database,
      color: "green",
    },
    {
      id: 3,
      type: "server",
      title: "Server health check passed",
      description: "All system components are functioning normally",
      timestamp: "30 minutes ago",
      icon: Server,
      color: "purple",
    },
    {
      id: 4,
      type: "user",
      title: "New user session started",
      description: "User connected to AI chat interface",
      timestamp: "45 minutes ago",
      icon: User,
      color: "orange",
    },
    {
      id: 5,
      type: "model",
      title: "DeepSeek model updated",
      description: "Model configuration updated successfully",
      timestamp: "1 hour ago",
      icon: Brain,
      color: "blue",
    },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case "model":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "database":
        return "bg-green-100 text-green-800 border-green-200"
      case "server":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "user":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest system events and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div
                className={`bg-${activity.color}-100 text-${activity.color}-800 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0`}
              >
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm">{activity.title}</h4>
                  <Badge variant="outline" className={getTypeColor(activity.type)}>
                    {activity.type}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mb-2">{activity.description}</p>
                <p className="text-xs text-slate-500">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
