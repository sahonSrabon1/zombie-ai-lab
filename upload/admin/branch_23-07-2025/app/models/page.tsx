import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Cpu, MemoryStick, Play, Settings, TrendingUp } from "lucide-react"
import Link from "next/link"

const models = [
  {
    id: "mistral",
    name: "Mistral",
    version: "7B",
    status: "running",
    usage: "Code Analysis",
    requests: 342,
    avgResponseTime: "0.8s",
    accuracy: 94,
    memoryUsage: 2.1,
    cpuUsage: 45,
    uptime: "2d 14h",
    description: "Advanced language model optimized for code analysis and understanding",
    capabilities: ["Code Analysis", "Bug Detection", "Code Review", "Documentation"],
    lastUsed: "2 minutes ago",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    version: "6.7B",
    status: "running",
    usage: "Code Generation",
    requests: 289,
    avgResponseTime: "1.2s",
    accuracy: 91,
    memoryUsage: 1.8,
    cpuUsage: 38,
    uptime: "2d 14h",
    description: "Specialized model for generating high-quality code across multiple languages",
    capabilities: ["Code Generation", "Refactoring", "API Integration", "Testing"],
    lastUsed: "5 minutes ago",
  },
  {
    id: "phi",
    name: "Phi",
    version: "3.8B",
    status: "running",
    usage: "General Purpose",
    requests: 156,
    avgResponseTime: "0.6s",
    accuracy: 89,
    memoryUsage: 1.2,
    cpuUsage: 28,
    uptime: "2d 14h",
    description: "Lightweight model for general-purpose tasks and quick responses",
    capabilities: ["General Chat", "Quick Tasks", "Simple Queries", "Explanations"],
    lastUsed: "1 minute ago",
  },
  {
    id: "gemma",
    name: "Gemma",
    version: "7B",
    status: "running",
    usage: "Documentation",
    requests: 198,
    avgResponseTime: "1.0s",
    accuracy: 96,
    memoryUsage: 2.0,
    cpuUsage: 35,
    uptime: "2d 14h",
    description: "Optimized for creating comprehensive documentation and technical writing",
    capabilities: ["Documentation", "Technical Writing", "Tutorials", "API Docs"],
    lastUsed: "8 minutes ago",
  },
  {
    id: "tinyllama",
    name: "TinyLlama",
    version: "1.1B",
    status: "running",
    usage: "Quick Tasks",
    requests: 445,
    avgResponseTime: "0.3s",
    accuracy: 85,
    memoryUsage: 0.6,
    cpuUsage: 15,
    uptime: "2d 14h",
    description: "Ultra-fast model for simple tasks and rapid responses",
    capabilities: ["Quick Responses", "Simple Tasks", "Basic Chat", "Fast Processing"],
    lastUsed: "30 seconds ago",
  },
]

export default function ModelsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">AI Models</h1>
            <p className="text-slate-600">Manage and monitor your local AI models</p>
          </div>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Model Settings
          </Button>
        </div>

        {/* Models Grid */}
        <div className="grid gap-6">
          {models.map((model) => (
            <Card key={model.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-10 h-10 flex items-center justify-center">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {model.name}
                        <Badge variant="secondary">{model.version}</Badge>
                        <Badge variant={model.status === "running" ? "default" : "destructive"}>{model.status}</Badge>
                      </CardTitle>
                      <CardDescription>{model.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/models/${model.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Button size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Test Model
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                    <TabsTrigger value="usage">Usage</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{model.requests}</div>
                        <div className="text-sm text-slate-600">Total Requests</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{model.avgResponseTime}</div>
                        <div className="text-sm text-slate-600">Avg Response</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{model.accuracy}%</div>
                        <div className="text-sm text-slate-600">Accuracy</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{model.uptime}</div>
                        <div className="text-sm text-slate-600">Uptime</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="performance" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MemoryStick className="h-4 w-4" />
                            <span className="text-sm font-medium">Memory Usage</span>
                          </div>
                          <span className="text-sm text-slate-600">{model.memoryUsage}GB</span>
                        </div>
                        <Progress value={(model.memoryUsage / 4) * 100} className="h-2" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4" />
                            <span className="text-sm font-medium">CPU Usage</span>
                          </div>
                          <span className="text-sm text-slate-600">{model.cpuUsage}%</span>
                        </div>
                        <Progress value={model.cpuUsage} className="h-2" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="capabilities" className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {model.capabilities.map((capability) => (
                        <Badge key={capability} variant="outline">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-slate-600">
                      <strong>Primary Use Case:</strong> {model.usage}
                    </div>
                    <div className="text-sm text-slate-600">
                      <strong>Last Used:</strong> {model.lastUsed}
                    </div>
                  </TabsContent>

                  <TabsContent value="usage" className="space-y-4">
                    <div className="h-32 bg-slate-50 rounded-lg flex items-center justify-center">
                      <div className="text-center text-slate-500">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                        <div className="text-sm">Usage chart would be displayed here</div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
