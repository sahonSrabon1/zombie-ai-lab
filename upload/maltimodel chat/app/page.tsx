"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, Volume2, VolumeX, Send, Moon, Sun, Plus, Trash2, Menu, X, ImagePlus, Loader, ChevronDown, LogOut, Settings, User } from "lucide-react"
import { useTheme } from "next-themes"

const AI_MODELS = [
  { id: "gpt-4", name: "GPT-4", description: "Most capable" },
  { id: "gpt-3.5", name: "GPT-3.5", description: "Fast and efficient" },
  { id: "claude", name: "Claude", description: "Thoughtful responses" },
]

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  image?: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export default function ChatInterface() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [synthesis, setSynthesis] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState("gpt-4")
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { theme, setTheme } = useTheme()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const currentSession = chatSessions.find((session) => session.id === currentSessionId)
  const messages = currentSession?.messages || []

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = "en-US"

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput((prev) => prev + (prev ? " " : "") + transcript)
        setIsListening(false)
      }

      recognitionInstance.onerror = () => {
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSynthesis(window.speechSynthesis)
    }

    if (chatSessions.length === 0) {
      createNewChat()
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" })
    }
  }

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setChatSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
  }

  const deleteChat = (sessionId: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (currentSessionId === sessionId) {
      setCurrentSessionId(chatSessions[0]?.id || null)
    }
  }

  const generateChatTitle = (message: string) => {
    return message.substring(0, 30) + (message.length > 30 ? "..." : "")
  }

  const startListening = () => {
    if (recognition) {
      setIsListening(true)
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognition) {
      recognition.stop()
      setIsListening(false)
    }
  }

  const speakMessage = (message: string) => {
    if (synthesis) {
      synthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.onend = () => setIsSpeaking(false)
      setIsSpeaking(true)
      synthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthesis) {
      synthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !currentSessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
      image: selectedImage || undefined,
    }

    setChatSessions((prev) =>
      prev.map((session) => {
        if (session.id === currentSessionId) {
          const updatedMessages = [...session.messages, userMessage]
          return {
            ...session,
            messages: updatedMessages,
            title: session.messages.length === 0 ? generateChatTitle(userMessage.content) : session.title,
            updatedAt: new Date(),
          }
        }
        return session
      }),
    )

    setInput("")
    setSelectedImage(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          image: selectedImage,
          history: messages,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      }

      setChatSessions((prev) =>
        prev.map((session) => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              messages: [...session.messages, assistantMessage],
              updatedAt: new Date(),
            }
          }
          return session
        }),
      )
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, an error occurred. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      setChatSessions((prev) =>
        prev.map((session) => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              messages: [...session.messages, errorMessage],
              updatedAt: new Date(),
            }
          }
          return session
        }),
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-zinc-800">
          <Button
            onClick={createNewChat}
            className="w-full justify-start gap-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chatSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                setCurrentSessionId(session.id)
                setSidebarOpen(false)
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors group relative ${
                currentSessionId === session.id ? "bg-zinc-700" : "hover:bg-zinc-800"
              }`}
            >
              <div className="truncate text-sm font-medium">{session.title}</div>
              <div className="text-xs text-zinc-500">{session.createdAt.toLocaleDateString()}</div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteChat(session.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800 space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2 text-zinc-400">
            <User className="h-4 w-4" />
            Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-zinc-400">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-lg border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
              >
                {AI_MODELS.find((m) => m.id === selectedModel)?.name}
                <ChevronDown className="h-4 w-4" />
              </Button>

              {showModelDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-50">
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      className={`w-full text-left px-4 py-3 border-b border-zinc-700 last:border-b-0 hover:bg-zinc-800 transition-colors ${
                        selectedModel === model.id ? "bg-zinc-800" : ""
                      }`}
                      onClick={() => {
                        setSelectedModel(model.id)
                        setShowModelDropdown(false)
                      }}
                    >
                      <div className="font-medium text-sm">{model.name}</div>
                      <div className="text-xs text-zinc-500">{model.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <User className="h-5 w-5" />
              </Button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-50">
                  <button className="w-full text-left px-4 py-3 border-b border-zinc-700 hover:bg-zinc-800 flex items-center gap-2 transition-colors text-sm">
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button className="w-full text-left px-4 py-3 border-b border-zinc-700 hover:bg-zinc-800 flex items-center gap-2 transition-colors text-sm">
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button className="w-full text-left px-4 py-3 hover:bg-zinc-800 flex items-center gap-2 text-red-500 transition-colors text-sm">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Messages Area - Scrollable */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-950 to-black px-4 py-6 space-y-4"
        >
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
                <p className="text-zinc-400 max-w-md">
                  Start a conversation by typing your message below or using voice input.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } animate-in fade-in slide-in-from-bottom-2`}
                >
                  {message.role === "assistant" && (
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      AI
                    </div>
                  )}

                  <div
                    className={`flex flex-col gap-2 max-w-xs sm:max-w-md md:max-w-2xl ${
                      message.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {message.image && (
                      <div className="rounded-lg overflow-hidden">
                        <img
                          src={message.image}
                          alt="Uploaded"
                          className="max-w-xs h-auto rounded-lg"
                        />
                      </div>
                    )}
                    <div
                      className={`px-4 py-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-zinc-800 text-zinc-100 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-500 px-2">
                      <span>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {message.role === "assistant" && (
                        <button
                          className="hover:text-zinc-300 transition-colors"
                          onClick={() =>
                            isSpeaking ? stopSpeaking() : speakMessage(message.content)
                          }
                        >
                          {isSpeaking ? (
                            <VolumeX className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      You
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className="border-t border-zinc-800 bg-zinc-950 p-4 shrink-0">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            {selectedImage && (
              <div className="flex gap-2 items-center px-3 py-2 bg-zinc-800 rounded-lg mb-3">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="h-12 w-12 rounded object-cover"
                />
                <span className="text-sm text-zinc-400 flex-1">Image selected</span>
                <button
                  type="button"
                  className="text-zinc-500 hover:text-zinc-300"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm text-white placeholder-zinc-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                      e.preventDefault()
                      handleSubmit(e as any)
                    }
                  }}
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    className="p-2 hover:bg-zinc-700 rounded transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <ImagePlus className="h-4 w-4 text-zinc-400" />
                  </button>
                  <button
                    type="button"
                    className={`p-2 rounded transition-colors ${
                      isListening
                        ? "bg-red-600 text-white"
                        : "hover:bg-zinc-700 text-zinc-400"
                    }`}
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <div className="text-xs text-zinc-500 mt-2">
              {isListening ? (
                <span className="text-blue-500 font-medium animate-pulse">
                  Listening...
                </span>
              ) : (
                <span>Shift + Enter for new line</span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
