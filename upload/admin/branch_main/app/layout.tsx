import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/lib/language-context"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, Brain, Database, Headphones, BookOpen, ChevronDown, Code, Server, Terminal } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Management Dashboard",
  description: "Comprehensive AI model management and development toolkit",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                  <Link href="/" className="font-bold text-xl text-blue-600">
                    AI Dashboard
                  </Link>
                  <div className="flex items-center space-x-2">
                    <Link href="/">
                      <Button variant="ghost" size="sm">
                        <Home className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>

                    {/* AI Tools Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Brain className="h-4 w-4 mr-2" />
                          AI Tools
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <Link href="/ai-chat" className="w-full">
                            AI Chat
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/prompt-generator" className="w-full">
                            Prompt Generator
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/project-ideas" className="w-full">
                            Project Ideas
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Server Management Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Server className="h-4 w-4 mr-2" />
                          Server
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <Link href="/server/whm-domains" className="w-full">
                            WHM Domains
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/server/access" className="w-full">
                            Server Access
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/server/ssh-tools" className="w-full">
                            SSH Tools
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Database Tools Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Database className="h-4 w-4 mr-2" />
                          Database
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <Link href="/database" className="w-full">
                            Database Tools
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/database/analysis" className="w-full">
                            Database Analysis
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/database/connection" className="w-full">
                            DB Connection
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/database/cpanel" className="w-full">
                            cPanel DB Access
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Command Library Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Terminal className="h-4 w-4 mr-2" />
                          Commands
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <Link href="/commands/php" className="w-full">
                            PHP Commands
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/commands/nodejs" className="w-full">
                            Node.js Commands
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/commands/python" className="w-full">
                            Python Commands
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/commands/linux" className="w-full">
                            Linux Commands
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/commands/ollama" className="w-full">
                            Ollama Commands
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Development Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Code className="h-4 w-4 mr-2" />
                          Dev Tools
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <Link href="/dev/git" className="w-full">
                            Git Commands
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/dev/docker" className="w-full">
                            Docker Commands
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href="/models">
                      <Button variant="ghost" size="sm">
                        <Brain className="h-4 w-4 mr-2" />
                        Models
                      </Button>
                    </Link>

                    <Link href="/webhooks">
                      <Button variant="ghost" size="sm">
                        <Headphones className="h-4 w-4 mr-2" />
                        Webhooks
                      </Button>
                    </Link>

                    <Link href="/documentation">
                      <Button variant="ghost" size="sm">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Docs
                      </Button>
                    </Link>

                    <Link href="/admin">
                      <Button variant="default" size="sm">
                        Admin Panel
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
            {children}
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
