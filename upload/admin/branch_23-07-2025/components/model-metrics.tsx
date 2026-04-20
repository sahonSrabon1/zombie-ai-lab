"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Clock, Target } from "lucide-react"

interface ModelMetricsProps {
  modelId: string
}

export function ModelMetrics({ modelId }: ModelMetricsProps) {
  const metrics = {
    totalRequests: 342,
    successfulRequests: 337,
    failedRequests: 5,
    averageResponseTime: 0.8,
    peakResponseTime: 2.1,
    minResponseTime: 0.3,
    tokensProcessed: 45678,
    averageTokensPerRequest: 134,
    accuracy: 94,
    uptime: 99.2,
    requestsPerHour: [12, 18, 25, 31, 28, 35, 42, 38, 29, 33, 27, 22],
    responseTimeHistory: [0.7, 0.8, 0.9, 0.6, 0.8, 1.1, 0.7, 0.9, 0.8, 0.7, 0.8, 0.9],
  }

  const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100

  return (
    <div className="grid gap-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Requests</p>
                <p className="text-2xl font-bold">{metrics.totalRequests}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Success Rate</p>
                <p className="text-2xl font-bold">{successRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Response</p>
                <p className="text-2xl font-bold">{metrics.averageResponseTime}s</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Uptime</p>
                <p className="text-2xl font-bold">{metrics.uptime}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Detailed performance analysis and statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Response Time Breakdown */}
          <div>
            <h3 className="font-semibold mb-3">Response Time Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Average</span>
                  <span className="font-medium">{metrics.averageResponseTime}s</span>
                </div>
                <Progress value={(metrics.averageResponseTime / 3) * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Peak</span>
                  <span className="font-medium">{metrics.peakResponseTime}s</span>
                </div>
                <Progress value={(metrics.peakResponseTime / 3) * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Minimum</span>
                  <span className="font-medium">{metrics.minResponseTime}s</span>
                </div>
                <Progress value={(metrics.minResponseTime / 3) * 100} className="h-2" />
              </div>
            </div>
          </div>

          {/* Token Processing */}
          <div>
            <h3 className="font-semibold mb-3">Token Processing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium">Total Tokens Processed</div>
                  <div className="text-sm text-slate-600">{metrics.tokensProcessed.toLocaleString()}</div>
                </div>
                <Badge variant="outline">{metrics.averageTokensPerRequest} avg/request</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium">Processing Efficiency</div>
                  <div className="text-sm text-slate-600">Tokens per second</div>
                </div>
                <Badge variant="outline">
                  {Math.round(metrics.averageTokensPerRequest / metrics.averageResponseTime)}/s
                </Badge>
              </div>
            </div>
          </div>

          {/* Request Status */}
          <div>
            <h3 className="font-semibold mb-3">Request Status Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Successful Requests</span>
                <div className="flex items-center gap-2">
                  <Progress value={successRate} className="w-24 h-2" />
                  <span className="text-sm font-medium">{metrics.successfulRequests}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Failed Requests</span>
                <div className="flex items-center gap-2">
                  <Progress value={(metrics.failedRequests / metrics.totalRequests) * 100} className="w-24 h-2" />
                  <span className="text-sm font-medium">{metrics.failedRequests}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div>
            <h3 className="font-semibold mb-3">Performance Indicators</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{metrics.accuracy}%</div>
                <div className="text-sm text-green-700">Accuracy Score</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{metrics.uptime}%</div>
                <div className="text-sm text-blue-700">Uptime</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{Math.round(metrics.totalRequests / 24)}</div>
                <div className="text-sm text-purple-700">Requests/Hour</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
