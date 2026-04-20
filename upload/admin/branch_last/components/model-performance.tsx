"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export function ModelPerformance() {
  const models = [
    {
      name: "Mistral",
      requests: 342,
      avgResponse: 0.8,
      accuracy: 94,
      trend: "up",
      change: "+12%",
    },
    {
      name: "DeepSeek",
      requests: 189,
      avgResponse: 1.2,
      accuracy: 91,
      trend: "up",
      change: "+8%",
    },
    {
      name: "Phi",
      requests: 67,
      avgResponse: 0.6,
      accuracy: 88,
      trend: "down",
      change: "-3%",
    },
    {
      name: "Gemma",
      requests: 156,
      avgResponse: 0.4,
      accuracy: 92,
      trend: "stable",
      change: "0%",
    },
  ]

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return <Minus className="h-3 w-3 text-slate-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-slate-600"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Model Performance
        </CardTitle>
        <CardDescription>Performance metrics for active AI models</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {models.map((model, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{model.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {model.requests} requests
                  </Badge>
                </div>
                <div className={`flex items-center gap-1 text-sm ${getTrendColor(model.trend)}`}>
                  {getTrendIcon(model.trend)}
                  <span>{model.change}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Response Time</span>
                    <span className="font-medium">{model.avgResponse}s</span>
                  </div>
                  <Progress value={(model.avgResponse / 2) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Accuracy</span>
                    <span className="font-medium">{model.accuracy}%</span>
                  </div>
                  <Progress value={model.accuracy} className="h-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
