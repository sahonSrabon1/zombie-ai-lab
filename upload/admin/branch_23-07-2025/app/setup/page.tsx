import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Terminal, Code, Settings } from "lucide-react"
import { ServerStatusChecker } from "@/components/server-status-checker"
import { CodeBlock } from "@/components/code-block"

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Setup & Configuration</h1>
          <p className="text-slate-600">Configure your local AI agent integration step by step</p>
        </div>

        {/* Server Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              1. Local Server Setup Verification
            </CardTitle>
            <CardDescription>First, verify that your local server is running correctly</CardDescription>
          </CardHeader>
          <CardContent>
            <ServerStatusChecker />

            <div className="mt-6">
              <h3 className="font-semibold mb-3">Manual Verification</h3>
              <CodeBlock
                language="bash"
                code={`# Verify server status
curl -X GET http://localhost:3307/status

# Expected response:
# {"status":"running","models":["mistral","deepseek","phi","gemma","tinyllama"]}`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Editor Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              2. Editor Configuration
            </CardTitle>
            <CardDescription>Configure your preferred code editor for local AI integration</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cursor" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cursor">Cursor</TabsTrigger>
                <TabsTrigger value="vscode">VS Code</TabsTrigger>
              </TabsList>

              <TabsContent value="cursor" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Cursor Workspace Settings</h3>
                  <p className="text-sm text-slate-600 mb-3">Add this configuration to your workspace settings.json:</p>
                  <CodeBlock
                    language="json"
                    code={`{
  "ai.agent": {
    "endpoint": "http://localhost:3307/v1/completions",
    "localModels": {
      "codeAnalysis": "mistral",
      "codeGeneration": "deepseek",
      "documentation": "gemma"
    },
    "fallbackToLocal": true
  }
}`}
                  />
                </div>
              </TabsContent>

              <TabsContent value="vscode" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">VS Code Settings</h3>
                  <p className="text-sm text-slate-600 mb-3">Add this configuration to your settings.json:</p>
                  <CodeBlock
                    language="json"
                    code={`{
  "localAI.enable": true,
  "localAI.endpoint": "http://127.0.0.1:3307",
  "localAI.modelMapping": {
    "default": "mistral",
    "documentation": "gemma",
    "codegen": "deepseek"
  }
}`}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Model Activation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              3. Model Activation Protocol
            </CardTitle>
            <CardDescription>Understanding how models connect and activate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Automatic Local Binding</h3>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Models auto-connect to localhost:3307 on server start. No manual configuration needed for
                    pre-installed components.
                  </AlertDescription>
                </Alert>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Editor-Specific Integration</h3>
                <CodeBlock
                  language="python"
                  code={`# Sample detection logic in editors
def detect_local_models():
    if check_port(3307):
        return get_models_from_localhost()
    else:
        use_local_fallback_cache()`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Access */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation Access Points</CardTitle>
            <CardDescription>All documentation is locally available at these locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium">Primary Documentation</div>
                  <div className="text-sm text-slate-600">file:///C:/Agent/docs/index.html</div>
                </div>
                <Badge variant="outline">Primary</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium">Model Specifications</div>
                  <div className="text-sm text-slate-600">file:///C:/Agent/docs/model_specs/</div>
                </div>
                <Badge variant="outline">Per-model</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium">Editor Integration</div>
                  <div className="text-sm text-slate-600">file:///C:/Agent/docs/editor_integration/</div>
                </div>
                <Badge variant="outline">Editor-specific</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
