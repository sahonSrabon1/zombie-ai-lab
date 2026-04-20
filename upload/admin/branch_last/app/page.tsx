"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import {
  Brain,
  Database,
  Server,
  Activity,
  Users,
  Settings,
  Zap,
  MessageSquare,
  Code,
  Terminal,
  Headphones,
  BookOpen,
  ArrowRight,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { DailyPerformance } from "@/components/daily-performance"
import { SystemOverview } from "@/components/system-overview"

export default function Dashboard() {
  const { t } = useLanguage()

  const stats = [
    {
      title: "Active Models",
      value: "5",
      change: "+2 from last week",
      icon: Brain,
      color: "blue",
    },
    {
      title: "Total Requests Today",
      value: "2,847",
      change: "+18% from yesterday",
      icon: Activity,
      color: "green",
    },
    {
      title: "Database Connections",
      value: "23",
      change: "Stable",
      icon: Database,
      color: "purple",
    },
    {
      title: "Server Uptime",
      value: "99.9%",
      change: "Last 30 days",
      icon: Server,
      color: "orange",
    },
  ]

  const quickActions = [
    {
      title: "AI Chat Interface",
      description: "Interactive chat with local AI models",
      href: "/ai-chat",
      icon: MessageSquare,
      color: "bg-blue-500",
    },
    {
      title: "Database Tools",
      description: "Manage MySQL database connections",
      href: "/database",
      icon: Database,
      color: "bg-green-500",
    },
    {
      title: "Server Management",
      description: "WHM domains and server tools",
      href: "/server/whm-domains",
      icon: Server,
      color: "bg-purple-500",
    },
    {
      title: "Command Library",
      description: "PHP, Node.js, Python commands",
      href: "/commands/php",
      icon: Terminal,
      color: "bg-orange-500",
    },
    {
      title: "Model Management",
      description: "Monitor and configure AI models",
      href: "/models",
      icon: Brain,
      color: "bg-indigo-500",
    },
    {
      title: "Webhooks",
      description: "ElevenLabs voice integration",
      href: "/webhooks",
      icon: Headphones,
      color: "bg-pink-500",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: "model",
      title: "Mistral model started successfully",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">AI Management Dashboard</h1>
          <p className="text-xl text-slate-600">Comprehensive local AI model management and development toolkit</p>
          <div className="flex items-center gap-4 mt-4">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              System Online
            </Badge>
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              Last updated: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
                  </div>
                  <div
                    className={`bg-${stat.color}-100 text-${stat.color}-800 rounded-full w-12 h-12 flex items-center justify-center`}
                  >
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Daily Performance */}
        <div className="mb-8">
          <DailyPerformance />
        </div>

        {/* System Overview */}
        <div className="mb-8">
          <SystemOverview />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Access frequently used tools and features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => {
                    const IconComponent = action.icon
                    return (
                      <Link key={action.title} href={action.href}>
                        <div className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer group">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`${action.color} text-white p-2 rounded-lg group-hover:scale-110 transition-transform`}
                            >
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold group-hover:text-blue-600 transition-colors">
                              {action.title}
                            </h3>
                            <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-sm text-slate-600">{action.description}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Performance
                </CardTitle>
                <CardDescription>Real-time system metrics and usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm text-slate-600">45%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: "45%" }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-slate-600">6.2GB / 16GB</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: "38%" }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI Model Load</span>
                    <span className="text-sm text-slate-600">3.1GB / 8GB</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: "39%" }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network I/O</span>
                    <span className="text-sm text-slate-600">125 MB/s</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: "62%" }}
                    ></div>
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
                <CardDescription>Latest system events and operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const IconComponent = activity.icon
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{activity.title}</div>
                          <div className="text-xs text-slate-600">{activity.time}</div>
                        </div>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {activity.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>Essential documentation and tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/setup">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Settings className="h-4 w-4 mr-2" />
                    Setup & Configuration
                  </Button>
                </Link>
                <Link href="/documentation">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Documentation
                  </Button>
                </Link>
                <Link href="/troubleshooting">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Code className="h-4 w-4 mr-2" />
                    Troubleshooting
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
