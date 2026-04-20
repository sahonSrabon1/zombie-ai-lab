"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Server,
  Database,
  Brain,
  Headphones,
  Shield,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react"
import { useState } from "react"

export function SystemOverview() {
  const [refreshing, setRefreshing] = useState(false)

  const systemComponents = [
    {
      name: "AI Models Server",
      status: "online",
      endpoint: "localhost:3307",
      uptime: "99.8%",
      lastCheck: "2 min ago",
      icon: Brain,
      color: "green",
    },
    {
      name: "MySQL Database",
      status: "online",
      endpoint: "localhost:3306",
      uptime: "99.9%",
      lastCheck: "1 min ago",
      icon: Database,
      color: "blue",
    },
    {
      name: "ElevenLabs Webhooks",
      status: "online",
      endpoint: "api.elevenlabs.io",
      uptime: "98.5%",
      lastCheck: "3 min ago",
      icon: Headphones,
      color: "purple",
    },
    {
      name: "Web Server",
      status: "online",
      endpoint: "localhost:3000",
      uptime: "100%",
      lastCheck: "30 sec ago",
      icon: Server,
      color: "orange",
    },
  ]

  const systemMetrics = [
    {
      name: "CPU Usage",
      value: 45,
      max: 100,
      unit: "%",
      status: "normal",
      icon: Cpu,
    },
    {
      name: "Memory Usage",
      value: 6.2,
      max: 16,
      unit: "GB",
      status: "normal",
      icon: MemoryStick,
    },
    {
      name: "Disk Usage",
      value: 45,
      max: 100,
      unit: "GB",
      status: "normal",
      icon: HardDrive,
    },
    {
      name: "Network I/O",
      value: 125,
      max: 1000,
      unit: "MB/s",
      status: "normal",
      icon: Wifi,
    },
  ]

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "offline":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 border-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "offline":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-green-100 text-green-800 border-green-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Overview
            </CardTitle>
            <CardDescription>Real-time monitoring of all system components and performance metrics</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Components Status */}
        <div>
          <h3 className="font-semibold mb-4">System Components</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemComponents.map((component, index) => {
              const IconComponent = component.icon
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(component.status)}
                    <div className={`bg-${component.color}-100 text-${component.color}-800 rounded-lg p-2`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{component.name}</div>
                      <div className="text-xs text-slate-600">{component.endpoint}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={getStatusColor(component.status)}>
                      {component.status}
                    </Badge>
                    <div className="text-xs text-slate-600 mt-1">Uptime: {component.uptime}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* System Metrics */}
        <div>
          <h3 className="font-semibold mb-4">System Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systemMetrics.map((metric, index) => {
              const IconComponent = metric.icon
              const percentage = (metric.value / metric.max) * 100

              return (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-medium">{metric.name}</span>
                    </div>
                    <span className="text-sm text-slate-600">
                      {metric.value}
                      {metric.unit} / {metric.max}
                      {metric.unit}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0{metric.unit}</span>
                    <span>{percentage.toFixed(1)}% used</span>
                    <span>
                      {metric.max}
                      {metric.unit}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-semibold mb-4">Quick System Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Server className="h-4 w-4 mr-2" />
              Restart Services
            </Button>
            <Button variant="outline" size="sm">
              <Database className="h-4 w-4 mr-2" />
              Database Backup
            </Button>
            <Button variant="outline" size="sm">
              <Brain className="h-4 w-4 mr-2" />
              Reload Models
            </Button>
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Security Scan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
