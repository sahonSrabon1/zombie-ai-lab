import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, ExternalLink, Download, Monitor } from "lucide-react"
import { CodeBlock } from "@/components/code-block"
import Link from "next/link"

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Documentation</h1>
          <p className="text-slate-600">Complete reference and API documentation for local AI integration</p>
        </div>

        {/* Key Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
            <CardDescription>Overview of the main capabilities of your local AI system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="bg-blue-100 text-blue-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Monitor className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Zero Configuration</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>Automatic localhost binding</li>
                  <li>Pre-configured model endpoints</li>
                  <li>Auto-discovery of editor environments</li>
                </ul>
              </div>

              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="bg-green-100 text-green-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Unified Admin Control</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>Web-based admin panel</li>
                  <li>Model management interface</li>
                  <li>System configuration tools</li>
                </ul>
              </div>

              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="bg-purple-100 text-purple-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <ExternalLink className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Real-time Monitoring</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>Local resource usage dashboard</li>
                  <li>Model performance metrics</li>
                  <li>Connection health indicators</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Reference */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Reference</CardTitle>
            <CardDescription>Complete API documentation for interacting with your local AI models</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="status" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="completions">Completions</TabsTrigger>
                <TabsTrigger value="models">Models</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">GET /status</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Check the overall status of the AI server and available models.
                  </p>
                  <CodeBlock language="bash" code={`curl -X GET http://localhost:3307/status`} />
                  <div className="mt-3">
                    <h4 className="font-medium mb-2">Response:</h4>
                    <CodeBlock
                      language="json"
                      code={`{
  "status": "running",
  "models": ["mistral", "deepseek", "phi", "gemma", "tinyllama"],
  "uptime": "2h 15m 30s",
  "memory_usage": "2.1GB"
}`}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="completions" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">POST /v1/completions</h3>
                  <p className="text-sm text-slate-600 mb-3">Generate text completions using the specified model.</p>
                  <CodeBlock
                    language="bash"
                    code={`curl -X POST http://localhost:3307/v1/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "mistral",
    "prompt": "Write a function to calculate fibonacci numbers",
    "max_tokens": 150,
    "temperature": 0.7
  }'`}
                  />
                </div>
              </TabsContent>

              <TabsContent value="models" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">GET /models</h3>
                  <p className="text-sm text-slate-600 mb-3">List all available models and their current status.</p>
                  <CodeBlock language="bash" code={`curl -X GET http://localhost:3307/models`} />

                  <div className="mt-4">
                    <h3 className="font-semibold mb-3">POST /models/{"model"}/restart</h3>
                    <p className="text-sm text-slate-600 mb-3">Restart a specific model.</p>
                    <CodeBlock language="bash" code={`curl -X POST http://localhost:3307/models/mistral/restart`} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Admin Panel Access</h3>
                  <p className="text-sm text-slate-600 mb-3">Access the web-based administration interface.</p>
                  <CodeBlock
                    language="bash"
                    code={`# Open admin panel in browser
start http://localhost:3307/admin

# Or use curl to access admin API
curl -X GET http://localhost:3307/admin/api/system-info`}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Model Specifications */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Model Specifications</CardTitle>
            <CardDescription>Detailed information about each available AI model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {[
                { name: "Mistral", use: "Code Analysis", size: "7B", speed: "Fast" },
                { name: "DeepSeek", use: "Code Generation", size: "6.7B", speed: "Medium" },
                { name: "Phi", use: "General Purpose", size: "3.8B", speed: "Very Fast" },
                { name: "Gemma", use: "Documentation", size: "7B", speed: "Fast" },
                { name: "TinyLlama", use: "Quick Tasks", size: "1.1B", speed: "Ultra Fast" },
              ].map((model) => (
                <div key={model.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">{model.name}</h3>
                    <p className="text-sm text-slate-600">{model.use}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{model.size}</Badge>
                    <Badge variant="secondary">{model.speed}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Access important resources and tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start h-auto p-4 bg-transparent" asChild>
                <a href="http://localhost:3307/admin" target="_blank" rel="noopener noreferrer">
                  <Monitor className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Admin Panel</div>
                    <div className="text-sm text-slate-600">localhost:3307/admin</div>
                  </div>
                </a>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4 bg-transparent" asChild>
                <a href="file:///C:/Agent/docs/index.html" target="_blank" rel="noopener noreferrer">
                  <BookOpen className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Local Documentation</div>
                    <div className="text-sm text-slate-600">C:/Agent/docs/index.html</div>
                  </div>
                </a>
              </Button>

              <Link href="/setup">
                <Button variant="outline" className="justify-start h-auto p-4 w-full bg-transparent">
                  <Download className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Setup Guide</div>
                    <div className="text-sm text-slate-600">Configuration instructions</div>
                  </div>
                </Button>
              </Link>

              <Link href="/troubleshooting">
                <Button variant="outline" className="justify-start h-auto p-4 w-full bg-transparent">
                  <ExternalLink className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Troubleshooting</div>
                    <div className="text-sm text-slate-600">Common issues & solutions</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
