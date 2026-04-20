import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Brain, Clock, Cpu, Download, MemoryStick, Play, Settings, TrendingUp, Zap } from "lucide-react"
import { ModelChat } from "@/components/model-chat"
import { ModelHistory } from "@/components/model-history"
import { ModelMetrics } from "@/components/model-metrics"

// This would typically come from a database or API
const getModelData = (id: string) => {
  const models = {
    mistral: {
      id: "mistral",
      name: "Mistral",
      version: "7B",
      status: "running",
      description: "Advanced language model optimized for code analysis and understanding complex programming concepts",
      capabilities: ["Code Analysis", "Bug Detection", "Code Review", "Documentation", "Refactoring"],
      specs: {
        parameters: "7 billion",
        architecture: "Transformer",
        contextLength: "32k tokens",
        languages: ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust"],
        memoryRequirement: "4GB",
        diskSpace: "14GB",
      },
      performance: {
        requests: 342,
        avgResponseTime: 0.8,
        accuracy: 94,
        memoryUsage: 2.1,
        cpuUsage: 45,
        uptime: "2d 14h",
        successRate: 98.5,
      },
      installation: {
        location: "C:/AI-Models/mistral-7b/",
        configFile: "C:/AI-Models/mistral-7b/config.json",
        modelFile: "C:/AI-Models/mistral-7b/model.bin",
        lastUpdated: "2024-01-15",
      },
    },
    // Add other models here...
  }

  return models[id as keyof typeof models] || models.mistral
}

export default function ModelDetailPage({ params }: { params: { id: string } }) {
  const model = getModelData(params.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 text-blue-800 rounded-full w-12 h-12 flex items-center justify-center">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                {model.name}
                <Badge variant="secondary">{model.version}</Badge>
                <Badge variant={model.status === "running" ? "default" : "destructive"}>{model.status}</Badge>
              </h1>
              <p className="text-slate-600">{model.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Test Model
            </Button>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Requests</p>
                  <p className="text-2xl font-bold">{model.performance.requests}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Response</p>
                  <p className="text-2xl font-bold">{model.performance.avgResponseTime}s</p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Accuracy</p>
                  <p className="text-2xl font-bold">{model.performance.accuracy}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Success Rate</p>
                  <p className="text-2xl font-bold">{model.performance.successRate}%</p>
                </div>
                <Zap className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="chat">Chat Interface</TabsTrigger>
            <TabsTrigger value="metrics">Performance</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="installation">Installation</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <ModelChat modelId={model.id} modelName={model.name} />
          </TabsContent>

          <TabsContent value="metrics">
            <div className="grid gap-6">
              <ModelMetrics modelId={model.id} />

              {/* Resource Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Resource Usage</CardTitle>
                  <CardDescription>Current system resource consumption</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MemoryStick className="h-4 w-4" />
                        <span className="font-medium">Memory Usage</span>
                      </div>
                      <span className="text-sm text-slate-600">{model.performance.memoryUsage}GB / 8GB</span>
                    </div>
                    <Progress value={(model.performance.memoryUsage / 8) * 100} className="h-3" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        <span className="font-medium">CPU Usage</span>
                      </div>
                      <span className="text-sm text-slate-600">{model.performance.cpuUsage}%</span>
                    </div>
                    <Progress value={model.performance.cpuUsage} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <ModelHistory modelId={model.id} />
          </TabsContent>

          <TabsContent value="specs">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Model Specifications</CardTitle>
                  <CardDescription>Technical details and requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Architecture</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Parameters:</span>
                            <span className="font-medium">{model.specs.parameters}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Architecture:</span>
                            <span className="font-medium">{model.specs.architecture}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Context Length:</span>
                            <span className="font-medium">{model.specs.contextLength}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">System Requirements</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Memory Required:</span>
                            <span className="font-medium">{model.specs.memoryRequirement}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Disk Space:</span>
                            <span className="font-medium">{model.specs.diskSpace}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Supported Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {model.specs.languages.map((lang) => (
                        <Badge key={lang} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="installation">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Installation Details</CardTitle>
                  <CardDescription>File locations and installation information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">File Locations</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <div className="font-medium">Model Directory</div>
                            <div className="text-sm text-slate-600">{model.installation.location}</div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Open
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <div className="font-medium">Configuration File</div>
                            <div className="text-sm text-slate-600">{model.installation.configFile}</div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <div className="font-medium">Model Binary</div>
                            <div className="text-sm text-slate-600">{model.installation.modelFile}</div>
                          </div>
                          <Badge variant="outline">14GB</Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Installation Commands</h3>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg">
                        <pre className="text-sm">
                          {`# Download and install ${model.name}
curl -O https://models.local/mistral-7b.tar.gz
tar -xzf mistral-7b.tar.gz -C /opt/ai-models/
./install-model.sh mistral

# Verify installation
./check-model.sh mistral`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="capabilities">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Model Capabilities</CardTitle>
                  <CardDescription>What this model can do and its strengths</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Primary Capabilities</h3>
                      <div className="space-y-2">
                        {model.capabilities.map((capability) => (
                          <div key={capability} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">{capability}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Best Use Cases</h3>
                      <div className="space-y-2 text-sm text-slate-600">
                        <p>• Analyzing complex codebases for bugs and improvements</p>
                        <p>• Providing detailed code reviews and suggestions</p>
                        <p>• Generating comprehensive documentation</p>
                        <p>• Explaining complex programming concepts</p>
                        <p>• Refactoring legacy code for better maintainability</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
