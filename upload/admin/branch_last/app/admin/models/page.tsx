import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Play, Pause, Settings, Download, Search, Plus, Activity } from "lucide-react"
import Link from "next/link"

export default function AdminModelsPage() {
  const models = [
    {
      id: "mistral",
      name: "Mistral",
      version: "7B",
      status: "running",
      description: "Advanced language model optimized for code analysis",
      requests: 342,
      avgResponse: 0.8,
      accuracy: 94,
      memoryUsage: 2.1,
      lastUsed: "2 minutes ago",
    },
    {
      id: "deepseek",
      name: "DeepSeek",
      version: "6.7B",
      status: "running",
      description: "Specialized model for code generation and programming tasks",
      requests: 189,
      avgResponse: 1.2,
      accuracy: 91,
      memoryUsage: 1.8,
      lastUsed: "5 minutes ago",
    },
    {
      id: "phi",
      name: "Phi",
      version: "3.8B",
      status: "stopped",
      description: "General purpose language model for various tasks",
      requests: 67,
      avgResponse: 0.6,
      accuracy: 88,
      memoryUsage: 0,
      lastUsed: "1 hour ago",
    },
    {
      id: "gemma",
      name: "Gemma",
      version: "2B",
      status: "running",
      description: "Lightweight model optimized for documentation and explanations",
      requests: 156,
      avgResponse: 0.4,
      accuracy: 92,
      memoryUsage: 0.9,
      lastUsed: "1 minute ago",
    },
    {
      id: "tinyllama",
      name: "TinyLlama",
      version: "1.1B",
      status: "running",
      description: "Ultra-fast model for quick tasks and simple queries",
      requests: 423,
      avgResponse: 0.2,
      accuracy: 85,
      memoryUsage: 0.5,
      lastUsed: "30 seconds ago",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-800 border-green-200"
      case "stopped":
        return "bg-red-100 text-red-800 border-red-200"
      case "loading":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Model Management</h1>
          <p className="text-slate-600">Monitor and control your local AI models</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Install Model
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Model
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Models</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Running</p>
                <p className="text-2xl font-bold text-green-600">4</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Requests</p>
                <p className="text-2xl font-bold">1,177</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Memory Usage</p>
                <p className="text-2xl font-bold">5.3GB</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">M</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Models List */}
      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Models</TabsTrigger>
            <TabsTrigger value="running">Running</TabsTrigger>
            <TabsTrigger value="stopped">Stopped</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Input placeholder="Search models..." className="w-64" />
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all">
          <div className="space-y-4">
            {models.map((model) => (
              <Card key={model.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 text-blue-800 rounded-full w-12 h-12 flex items-center justify-center">
                        <Brain className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold">{model.name}</h3>
                          <Badge variant="outline">{model.version}</Badge>
                          <Badge variant="outline" className={getStatusColor(model.status)}>
                            {model.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{model.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{model.requests} requests</span>
                          <span>{model.avgResponse}s avg response</span>
                          <span>{model.accuracy}% accuracy</span>
                          <span>{model.memoryUsage}GB memory</span>
                          <span>Last used: {model.lastUsed}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/models/${model.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant={model.status === "running" ? "destructive" : "default"} size="sm">
                        {model.status === "running" ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="running">
          <div className="space-y-4">
            {models
              .filter((model) => model.status === "running")
              .map((model) => (
                <Card key={model.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 text-green-800 rounded-full w-12 h-12 flex items-center justify-center">
                          <Brain className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold">{model.name}</h3>
                            <Badge variant="outline">{model.version}</Badge>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              {model.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{model.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>{model.requests} requests</span>
                            <span>{model.avgResponse}s avg response</span>
                            <span>{model.accuracy}% accuracy</span>
                            <span>{model.memoryUsage}GB memory</span>
                            <span>Last used: {model.lastUsed}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/models/${model.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Pause className="h-4 w-4 mr-2" />
                          Stop
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="stopped">
          <div className="space-y-4">
            {models
              .filter((model) => model.status === "stopped")
              .map((model) => (
                <Card key={model.id} className="hover:shadow-md transition-shadow opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-red-100 text-red-800 rounded-full w-12 h-12 flex items-center justify-center">
                          <Brain className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold">{model.name}</h3>
                            <Badge variant="outline">{model.version}</Badge>
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                              {model.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{model.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>{model.requests} requests</span>
                            <span>{model.avgResponse}s avg response</span>
                            <span>{model.accuracy}% accuracy</span>
                            <span>Last used: {model.lastUsed}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/models/${model.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="default" size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
