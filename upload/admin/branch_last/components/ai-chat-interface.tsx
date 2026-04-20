"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Copy, ThumbsUp, ThumbsDown, Settings } from "lucide-react"

export function AIChatInterface() {
  const [selectedModel, setSelectedModel] = useState("mistral")
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant" as const,
      content: "Hello! I'm ready to help you with your development tasks. Which model would you like to use?",
      timestamp: new Date().toLocaleTimeString(),
      model: "system",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const models = [
    { id: "mistral", name: "Mistral", description: "Code Analysis" },
    { id: "deepseek", name: "DeepSeek", description: "Code Generation" },
    { id: "phi", name: "Phi", description: "General Purpose" },
    { id: "gemma", name: "Gemma", description: "Documentation" },
    { id: "tinyllama", name: "TinyLlama", description: "Quick Tasks" },
  ]

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = {
      id: messages.length + 1,
      role: "user" as const,
      content: input,
      timestamp: new Date().toLocaleTimeString(),
      model: selectedModel,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      const assistantMessage = {
        id: messages.length + 2,
        role: "assistant" as const,
        content: `This is a response from ${models.find((m) => m.id === selectedModel)?.name}. In a real implementation, this would connect to your local AI model at localhost:3307 and process your request using the selected model.`,
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Chat Interface */}
      <div className="lg:col-span-3">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Chat Interface
                </CardTitle>
                <CardDescription>Currently using: {models.find((m) => m.id === selectedModel)?.name}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "user" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}
                    >
                      {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div
                      className={`rounded-lg p-3 ${message.role === "user" ? "bg-blue-500 text-white" : "bg-slate-100"}`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div
                        className={`text-xs mt-1 flex items-center gap-2 ${message.role === "user" ? "text-blue-100" : "text-slate-500"}`}
                      >
                        <span>{message.timestamp}</span>
                        {message.model !== "system" && (
                          <Badge variant="outline" className="text-xs">
                            {models.find((m) => m.id === message.model)?.name}
                          </Badge>
                        )}
                      </div>
                      {message.role === "assistant" && message.model !== "system" && (
                        <div className="flex gap-2 mt-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-slate-100 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${models.find((m) => m.id === selectedModel)?.name} anything...`}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Selection Sidebar */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Available Models</CardTitle>
            <CardDescription>Select an AI model for your conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedModel === model.id
                      ? "bg-blue-100 border-2 border-blue-300"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                  onClick={() => setSelectedModel(model.id)}
                >
                  <div className="font-medium">{model.name}</div>
                  <div className="text-sm text-slate-600">{model.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common development tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                "Analyze this code",
                "Generate a function",
                "Write documentation",
                "Debug an issue",
                "Optimize performance",
                "Create unit tests",
              ].map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left bg-transparent"
                  onClick={() => setInput(action)}
                >
                  {action}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
