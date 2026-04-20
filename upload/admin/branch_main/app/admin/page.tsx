"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import {
  Brain,
  Database,
  MessageSquare,
  Headphones,
  Server,
  Activity,
  Users,
  TrendingUp,
  Shield,
  Clock,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { DailyPerformance } from "@/components/daily-performance"
import { SystemOverview } from "@/components/system-overview"

export default function AdminDashboard() {
  const { t } = useLanguage()

  const stats = [
    {
      title: "Active Models",
      value: "5",
      change: "+2 from last week",
      icon: Brain,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Requests",
      value: "12,847",
      change: "+18% from last month",
      icon: BarChart3,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Avg Response Time",
      value: "1.2s",
      change: "-0.3s improvement",
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Connected Editors",
      value: "3",
      change: "Stable",
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
  ]

  const quickActions = [
    {
      title: "AI Chat Interface",
      description: "Interactive chat with AI models",
      href: "/ai-chat",
      icon: MessageSquare,
      color: "bg-blue-500",
    },
    {
      title: "Database Tools",
      description: "Manage MySQL database",
      href: "/database",
      icon: Database,
      color: "bg-green-500",
    },
    {
      title: "ElevenLabs Webhooks",
      description: "Voice processing integration",
      href: "/webhooks",
      icon: Headphones,
      color: "bg-purple-500",
    },
    {
      title: "Server Management",
      description: "WHM and server tools",
      href: "/server/whm-domains",
      icon: Server,
      color: "bg-orange-500",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: "model",
      title: "Mistral model started",
      time: "2 minutes ago",
      icon: Brain,
      status: "success",
    },
    {
      id: 2,
      type: "request",
      title: "Code analysis completed",
      time: "5 minutes ago",
      icon: Activity,
      status: "success",
    },
    {
      id: 3,
      type: "webhook",
      title: "ElevenLabs webhook received",
      time: "8 minutes ago",
      icon: Headphones,
      status: "success",
    },
    {
      id: 4,
      type: "database",
      title: "Database backup completed",
      time: "12 minutes ago",
      icon: Database,
      status: "success",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Monitor and manage your AI infrastructure</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Daily Performance */}
      <DailyPerformance />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access frequently used tools and features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action) => {
                  const IconComponent = action.icon
                  return (
                    <Link key={action.title} href={action.href}>
                      <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`${action.color} text-white p-2 rounded-lg`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <h3 className="font-semibold">{action.title}</h3>
                        </div>
                        <p className="text-sm text-slate-600">{action.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* System Performance */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                System Performance
              </CardTitle>
              <CardDescription>Real-time system metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-slate-600">45%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "45%" }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-slate-600">6.2GB / 16GB</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "38%" }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Disk Usage</span>
                  <span className="text-sm text-slate-600">45GB / 100GB</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: "45%" }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const IconComponent = activity.icon
                  return (
                    <div key={activity.id} className="flex items-center gap-3">
                      <div className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{activity.title}</div>
                        <div className="text-xs text-slate-600">{activity.time}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.status}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription>Current system health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Server</span>
                  <Badge className="bg-green-100 text-green-800">Running</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Webhooks</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SSL Certificate</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Expires Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Overview */}
      <SystemOverview />
    </div>
  )
}
