import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Terminal, CheckCircle } from "lucide-react"
import { CodeBlock } from "@/components/code-block"
import { ConnectionTester } from "@/components/connection-tester"

export default function TroubleshootingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Troubleshooting Guide</h1>
          <p className="text-slate-600">Common issues and solutions for local AI integration</p>
        </div>

        {/* Connection Tester */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Connection Test
            </CardTitle>
            <CardDescription>Test your connection to the local AI server</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectionTester />
          </CardContent>
        </Card>

        {/* Common Issues */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Common Issues
            </CardTitle>
            <CardDescription>Most frequently encountered problems and their solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="port-conflict" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="port-conflict">Port Conflict</TabsTrigger>
                <TabsTrigger value="model-not-responding">Model Issues</TabsTrigger>
                <TabsTrigger value="connection-failed">Connection Failed</TabsTrigger>
              </TabsList>

              <TabsContent value="port-conflict" className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Port 3307 is already in use by another application</AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-3">Solution</h3>
                  <CodeBlock
                    language="bash"
                    code={`# Check what's using port 3307
netstat -ano | findstr :3307

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F

# Restart the AI agent server
./start_agents.sh`}
                  />
                </div>
              </TabsContent>

              <TabsContent value="model-not-responding" className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>AI model is not responding to requests</AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-3">Solution</h3>
                  <CodeBlock
                    language="bash"
                    code={`# Restart specific model (e.g., mistral)
curl -X POST http://localhost:3307/restart -d '{"model":"mistral"}'

# Check model status
curl -X GET http://localhost:3307/models/mistral/status

# Restart all models
./restart_all_models.sh`}
                  />
                </div>
              </TabsContent>

              <TabsContent value="connection-failed" className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Cannot connect to localhost:3307</AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-3">Solution</h3>
                  <CodeBlock
                    language="powershell"
                    code={`# Test network connection
Test-NetConnection -ComputerName localhost -Port 3307

# Check if server is running
Get-Process | Where-Object {$_.ProcessName -like "*agent*"}

# Start server if not running
Start-Process -FilePath "./start_agents.sh"`}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Maintenance Commands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Maintenance Commands
            </CardTitle>
            <CardDescription>Essential commands for maintaining your local AI setup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Service Management</h3>
                <CodeBlock
                  language="bash"
                  code={`# Start all services
./start_agents.sh

# Stop all services
./stop_agents.sh

# Restart services
./restart_agents.sh`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-3">System Verification</h3>
                <CodeBlock
                  language="bash"
                  code={`# Verify installations
./check_install.sh --verify-all

# Check system health
./health_check.sh

# View system logs
tail -f /var/log/ai-agents.log`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-3">Model Updates</h3>
                <CodeBlock
                  language="bash"
                  code={`# Update local models
./update_models.py --automatic

# Update specific model
./update_models.py --model mistral

# Check for updates
./update_models.py --check-only`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
