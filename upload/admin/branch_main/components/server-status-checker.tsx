"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, RefreshCw, AlertTriangle } from "lucide-react"
import { ConnectionTester } from "./connection-tester"

interface ServerStatus {
  endpoint: string
  status: "online" | "offline" | "checking"
  responseTime?: number
  lastChecked: string
}

export function ServerStatusChecker() {
  const [servers, setServers] = useState<ServerStatus[]>([
    {
      endpoint: "http://localhost:3307/status",
      status: "checking",
      lastChecked: "Never",
    },
    {
      endpoint: "http://localhost:3307/models",
      status: "checking",
      lastChecked: "Never",
    },
    {
      endpoint: "http://localhost:3307/health",
      status: "checking",
      lastChecked: "Never",
    },
  ])
  const [checking, setChecking] = useState(false)

  const checkServerStatus = async () => {
    setChecking(true)

    const updatedServers = await Promise.all(
      servers.map(async (server) => {
        const startTime = Date.now()

        try {
          // Simulate server check
          await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

          const responseTime = Date.now() - startTime
          const isOnline = Math.random() > 0.2 // 80% chance of being online

          return {
            ...server,
            status: isOnline ? ("online" as const) : ("offline" as const),
            responseTime: isOnline ? responseTime : undefined,
            lastChecked: new Date().toLocaleTimeString(),
          }
        } catch (error) {
          return {
            ...server,
            status: "offline" as const,
            responseTime: undefined,
            lastChecked: new Date().toLocaleTimeString(),
          }
        }
      }),
    )

    setServers(updatedServers)
    setChecking(false)
  }

  useEffect(() => {
    checkServerStatus()
  }, [])

  const onlineCount = servers.filter((s) => s.status === "online").length
  const totalCount = servers.length

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {onlineCount === totalCount ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : onlineCount > 0 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              {onlineCount}/{totalCount} Services Online
            </span>
          </div>
          <Badge
            variant="outline"
            className={
              onlineCount === totalCount
                ? "bg-green-50 text-green-700 border-green-200"
                : onlineCount > 0
                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                  : "bg-red-50 text-red-700 border-red-200"
            }
          >
            {onlineCount === totalCount
              ? "All Systems Operational"
              : onlineCount > 0
                ? "Partial Outage"
                : "Service Unavailable"}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={checkServerStatus} disabled={checking}>
          {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Check Status
        </Button>
      </div>

      {/* Server Status List */}
      <div className="space-y-3">
        {servers.map((server, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              {server.status === "checking" ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : server.status === "online" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <div>
                <div className="font-medium text-sm">{server.endpoint}</div>
                <div className="text-xs text-slate-600">Last checked: {server.lastChecked}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {server.responseTime && <span className="text-xs text-slate-600">{server.responseTime}ms</span>}
              <Badge variant={server.status === "online" ? "default" : "destructive"} className="text-xs">
                {server.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Status Alerts */}
      {onlineCount < totalCount && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {onlineCount === 0
              ? "All services are currently offline. Please check your local server configuration."
              : `${totalCount - onlineCount} service(s) are currently offline. Some features may be unavailable.`}
          </AlertDescription>
        </Alert>
      )}

      {onlineCount === totalCount && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All services are running normally. Your AI management system is ready to use.
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Tester */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Advanced Connection Testing</h3>
          <ConnectionTester />
        </CardContent>
      </Card>
    </div>
  )
}
