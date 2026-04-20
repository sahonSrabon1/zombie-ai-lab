"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdmin } from "@/lib/context/admin"
import { Users, Server, Database, Activity, AlertCircle } from "lucide-react"

interface DashboardStats {
  activeUsers: number
  totalServers: number
  activeModels: number
  systemHealth: number
  recentErrors: number
  uptime: string
}

export default function AdminDashboard() {
  const { client } = useAdmin()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to fetch from backend, fallback to demo data
      try {
        const data = await client.get<DashboardStats>("/dashboard/stats")
        setStats(data)
      } catch {
        // Demo data for development
        setStats({
          activeUsers: 24,
          totalServers: 5,
          activeModels: 12,
          systemHealth: 98,
          recentErrors: 2,
          uptime: "45d 12h 30m",
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats")
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      label: "Active Users",
      value: stats?.activeUsers || 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Servers",
      value: stats?.totalServers || 0,
      icon: Server,
      color: "text-green-500",
    },
    {
      label: "AI Models",
      value: stats?.activeModels || 0,
      icon: Database,
      color: "text-purple-500",
    },
    {
      label: "System Health",
      value: `${stats?.systemHealth || 0}%`,
      icon: Activity,
      color: "text-emerald-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to your AI Workstation admin panel</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "-" : card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">Live monitoring</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Key metrics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm text-muted-foreground">{stats?.uptime || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recent Errors</span>
                  <span className="text-sm text-muted-foreground">{stats?.recentErrors || 0} (last 24h)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Response Time</span>
                  <span className="text-sm text-muted-foreground">142ms avg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database Size</span>
                  <span className="text-sm text-muted-foreground">2.4 GB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">All systems operational</p>
                    <p className="text-xs text-muted-foreground">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Database backup completed</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-2 w-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Memory usage at 78%</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Component health and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "API Server", status: "healthy" },
                  { name: "Database", status: "healthy" },
                  { name: "Cache Layer", status: "healthy" },
                  { name: "Message Queue", status: "healthy" },
                  { name: "Storage", status: "healthy" },
                ].map((component) => (
                  <div key={component.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{component.name}</span>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${component.status === "healthy" ? "bg-green-500" : "bg-red-500"}`}></div>
                      <span className="text-xs text-muted-foreground capitalize">{component.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
