"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, User, Bot, Download } from "lucide-react"

interface ModelHistoryProps {
  modelId: string
}

export function ModelHistory({ modelId }: ModelHistoryProps) {
  const history = [
    {
      id: 1,
      timestamp: "2024-01-15 14:30:25",
      type: "chat",
      user: "user123",
      prompt: "Analyze this JavaScript function for potential bugs",
      response: "I found 3 potential issues in your function...",
      responseTime: 0.8,
      tokens: 156,
    },
    {
      id: 2,
      timestamp: "2024-01-15 14:28:12",
      type: "code_review",
      user: "developer456",
      prompt: "Review this React component for best practices",
      response: "Here are some improvements you can make...",
      responseTime: 1.2,
      tokens: 234,
    },
    {
      id: 3,
      timestamp: "2024-01-15 14:25:45",
      type: "documentation",
      user: "user789",
      prompt: "Generate documentation for this API endpoint",
      response: "Here's comprehensive documentation for your API...",
      responseTime: 0.6,
      tokens: 189,
    },
    {
      id: 4,
      timestamp: "2024-01-15 14:22:18",
      type: "debugging",
      user: "user123",
      prompt: "Help me debug this Python error",
      response: "The error is caused by...",
      responseTime: 0.9,
      tokens: 145,
    },
    {
      id: 5,
      timestamp: "2024-01-15 14:18:33",
      type: "refactoring",
      user: "developer456",
      prompt: "Suggest refactoring improvements for this code",
      response: "I recommend the following refactoring strategies...",
      responseTime: 1.1,
      tokens: 278,
    },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case "chat":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "code_review":
        return "bg-green-100 text-green-800 border-green-200"
      case "documentation":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "debugging":
        return "bg-red-100 text-red-800 border-red-200"
      case "refactoring":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Interaction History
            </CardTitle>
            <CardDescription>Recent conversations and requests for this model</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={getTypeColor(item.type)}>
                    {item.type.replace("_", " ")}
                  </Badge>
                  <span className="text-sm text-slate-600">{item.timestamp}</span>
                  <span className="text-sm text-slate-600">User: {item.user}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{item.responseTime}s</span>
                  <span>{item.tokens} tokens</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                    <User className="h-3 w-3" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">User Prompt</p>
                    <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">{item.prompt}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3 w-3" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Model Response</p>
                    <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">{item.response}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
