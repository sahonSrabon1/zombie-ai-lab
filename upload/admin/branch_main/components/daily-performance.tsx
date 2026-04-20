"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Clock, Zap, Brain } from "lucide-react"

export function DailyPerformance() {
  const performanceData = [
    {
      time: "00:00",
      requests: 45,
      responseTime: 0.8,
      accuracy: 94,
    },
    {
      time: "04:00",
      requests: 23,
      responseTime: 0.6,
      accuracy: 96,
    },
    {
      time: "08:00",
      requests: 156,
      responseTime: 1.2,
      accuracy: 92,
    },
    {
      time: "12:00",
      requests: 234,
      responseTime: 1.4,
      accuracy: 91,
    },
    {
      time: "16:00",
      requests: 189,
      responseTime: 1.1,
      accuracy: 93,
    },
    {
      time: "20:00",
      requests: 98,
      responseTime: 0.9,
      accuracy: 95,
    },
  ]

  const todayStats = {
    totalRequests: 2847,
    avgResponseTime: 1.1,
    avgAccuracy: 93.2,
    peakHour: "12:00-13:00",
    activeModels: 5,
    uptime: "99.8%",
  }

  const modelPerformance = [
    {
      name: "Mistral",
      requests: 1245,
      avgTime: 0.8,
      accuracy: 94,
      trend: "up",
      change: "+12%",
    },
    {
      name: "DeepSeek",
      requests: 856,
      avgTime: 1.2,
      accuracy: 91,
      trend: "up",
      change: "+8%",
    },
    {
      name: "Phi",
      requests: 432,
      avgTime: 0.6,
      accuracy: 88,
      trend: "down",
      change: "-3%",
    },
    {
      name: "Gemma",
      requests: 314,
      avgTime: 0.4,
      accuracy: 92,
      trend: "up",
      change: "+5%",
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Performance Overview
          </CardTitle>
          <CardDescription>Today's system performance metrics and AI model usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Today's Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{todayStats.totalRequests.toLocaleString()}</div>
              <div className="text-sm text-slate-600">Total Requests</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{todayStats.avgResponseTime}s</div>
              <div className="text-sm text-slate-600">Avg Response</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{todayStats.avgAccuracy}%</div>
              <div className="text-sm text-slate-600">Avg Accuracy</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{todayStats.peakHour}</div>
              <div className="text-sm text-slate-600">Peak Hour</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{todayStats.activeModels}</div>
              <div className="text-sm text-slate-600">Active Models</div>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{todayStats.uptime}</div>
              <div className="text-sm text-slate-600">Uptime</div>
            </div>
          </div>

          {/* Hourly Performance Chart */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Hourly Performance Trend</h3>
            <div className="h-32 bg-slate-50 rounded-lg flex items-end justify-between p-4 gap-2">
              {performanceData.map((data, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className="bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                    style={{
                      height: `${(data.requests / 250) * 80}px`,
                      width: "20px",
                    }}
                    title={`${data.requests} requests at ${data.time}`}
                  ></div>
                  <div className="text-xs text-slate-600">{data.time}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Model Performance Today
          </CardTitle>
          <CardDescription>Individual AI model statistics and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modelPerformance.map((model, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {model.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{model.name}</h4>
                    <p className="text-sm text-slate-600">{model.requests.toLocaleString()} requests</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm font-medium">{model.avgTime}s</div>
                    <div className="text-xs text-slate-600">Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{model.accuracy}%</div>
                    <div className="text-xs text-slate-600">Accuracy</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {model.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <Badge
                      variant="outline"
                      className={
                        model.trend === "up"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {model.change}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            System Health Status
          </CardTitle>
          <CardDescription>Real-time monitoring of system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-medium text-sm">AI Server</div>
                <div className="text-xs text-slate-600">localhost:3307</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-medium text-sm">Database</div>
                <div className="text-xs text-slate-600">MySQL Connected</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-medium text-sm">Webhooks</div>
                <div className="text-xs text-slate-600">ElevenLabs Active</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-medium text-sm">Storage</div>
                <div className="text-xs text-slate-600">45GB Available</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
