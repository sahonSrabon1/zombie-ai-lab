"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Brain,
  Database,
  Server,
  Settings,
  Users,
  Globe,
  Code,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  Webhook,
  FileText,
  HelpCircle,
  FolderOpen,
  Calendar,
  Truck,
  CheckSquare,
  User,
  Music,
  NotebookPen,
  ChevronDown,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"

const navigation = [
  {
    name: "Dashboard",
    nameKey: "dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    name: "Models",
    nameKey: "models",
    href: "/admin/models",
    icon: Brain,
    badge: "5",
  },
  {
    name: "Database",
    nameKey: "database",
    href: "/admin/database",
    icon: Database,
  },
  {
    name: "Server",
    nameKey: "server",
    href: "/admin/server",
    icon: Server,
  },
  {
    name: "Analytics",
    nameKey: "analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    name: "Webhooks",
    nameKey: "webhooks",
    href: "/admin/webhooks",
    icon: Webhook,
  },
  {
    name: "Users",
    nameKey: "users",
    href: "/admin/users",
    icon: Users,
  },
]

// Productivity Tools Menu
const productivityTools = [
  {
    name: "প্রোডাক্টিভিটি নোটপ্যাড",
    href: "/admin/productivity/notepad",
    icon: NotebookPen,
    description: "উন্নত নোটপ্যাড ও শর্টকাট",
  },
  {
    name: "প্রজেক্ট সময়সূচী",
    href: "/admin/productivity/scheduler",
    icon: Calendar,
    description: "প্রজেক্ট পরিকল্পনা ও সময়সূচী",
  },
  {
    name: "প্রজেক্ট ম্যানেজমেন্ট",
    href: "/admin/productivity/projects",
    icon: FolderOpen,
    description: "সম্পূর্ণ প্রজেক্ট ব্যবস্থাপনা",
  },
  {
    name: "প্রজেক্ট ডেলিভারি",
    href: "/admin/productivity/delivery",
    icon: Truck,
    description: "ক্লায়েন্ট ডেলিভারি ট্র্যাকিং",
  },
  {
    name: "কাজের তালিকা",
    href: "/admin/productivity/todo",
    icon: CheckSquare,
    description: "দৈনিক কাজের পরিকল্পনা",
  },
  {
    name: "কাস্টম ক্যারেক্টার",
    href: "/admin/productivity/character",
    icon: User,
    description: "ক্যারেক্টার তৈরি ও কাস্টমাইজ",
  },
  {
    name: "টেক্সট সংশোধন",
    href: "/admin/productivity/correction",
    icon: FileText,
    description: "স্বয়ংক্রিয় টেক্সট সংশোধন",
  },
  {
    name: "MP3 প্লেলিস্ট",
    href: "/admin/productivity/music",
    icon: Music,
    description: "কাস্টম মিউজিক প্লেলিস্ট",
  },
]

const publicLinks = [
  {
    name: "Public Dashboard",
    nameKey: "publicDashboard",
    href: "/",
    icon: Globe,
  },
  {
    name: "AI Chat",
    nameKey: "aiChat",
    href: "/ai-chat",
    icon: Code,
  },
  {
    name: "Documentation",
    nameKey: "documentation",
    href: "/documentation",
    icon: FileText,
  },
  {
    name: "Setup Guide",
    nameKey: "setupGuide",
    href: "/setup",
    icon: Terminal,
  },
  {
    name: "Troubleshooting",
    nameKey: "troubleshooting",
    href: "/troubleshooting",
    icon: HelpCircle,
  },
]

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { t, language, setLanguage } = useLanguage()

  const isProductivityActive = pathname.startsWith("/admin/productivity")

  return (
    <div
      className={cn(
        "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 h-screen",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Admin Panel</h2>
              <p className="text-sm text-slate-600">AI Management</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          <div className="space-y-1">
            {!collapsed && (
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Administration</p>
            )}

            {/* Regular Navigation Items */}
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      collapsed ? "px-2" : "px-3",
                      isActive && "bg-blue-600 text-white hover:bg-blue-700",
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", collapsed ? "" : "mr-3")} />
                    {!collapsed && (
                      <>
                        <span>{item.name}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Button>
                </Link>
              )
            })}

            {/* Productivity Tools Dropdown */}
            {collapsed ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isProductivityActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start px-2",
                      isProductivityActive && "bg-green-600 text-white hover:bg-green-700",
                    )}
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" className="w-80">
                  <DropdownMenuLabel>প্রোডাক্টিভিটি টুলস</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {productivityTools.map((tool) => (
                    <DropdownMenuItem key={tool.href} asChild>
                      <Link href={tool.href} className="flex items-center gap-3 p-3">
                        <tool.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-xs text-gray-500">{tool.description}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isProductivityActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start px-3",
                      isProductivityActive && "bg-green-600 text-white hover:bg-green-700",
                    )}
                  >
                    <Wrench className="h-4 w-4 mr-3" />
                    <span>প্রোডাক্টিভিটি টুলস</span>
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" className="w-80">
                  <DropdownMenuLabel>প্রোডাক্টিভিটি টুলস</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {productivityTools.map((tool) => (
                    <DropdownMenuItem key={tool.href} asChild>
                      <Link href={tool.href} className="flex items-center gap-3 p-3">
                        <tool.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-xs text-gray-500">{tool.description}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Settings */}
            <Link href="/admin/settings">
              <Button
                variant={pathname === "/admin/settings" ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  collapsed ? "px-2" : "px-3",
                  pathname === "/admin/settings" && "bg-blue-600 text-white hover:bg-blue-700",
                )}
              >
                <Settings className={cn("h-4 w-4", collapsed ? "" : "mr-3")} />
                {!collapsed && <span>Settings</span>}
              </Button>
            </Link>
          </div>

          <Separator className="my-4" />

          <div className="space-y-1">
            {!collapsed && (
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Public Access</p>
            )}
            {publicLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-slate-600 hover:text-slate-900",
                    collapsed ? "px-2" : "px-3",
                  )}
                >
                  <item.icon className={cn("h-4 w-4", collapsed ? "" : "mr-3")} />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Language Selector */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-200">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Language</p>
            <div className="flex gap-2">
              <Button
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
                className="flex-1"
              >
                English
              </Button>
              <Button
                variant={language === "bn" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("bn")}
                className="flex-1"
              >
                বাংলা
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="p-4 border-t border-slate-200">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          {!collapsed && (
            <div>
              <p className="text-xs font-medium text-slate-900">System Status</p>
              <p className="text-xs text-slate-600">All Systems Operational</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
