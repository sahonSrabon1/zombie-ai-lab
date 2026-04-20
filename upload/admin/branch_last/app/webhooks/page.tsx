import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Headphones, Plus, Settings, CheckCircle, XCircle, ExternalLink, Mic, Volume2 } from "lucide-react"
import { WebhookManager } from "@/components/webhook-manager"
import { ElevenLabsIntegration } from "@/components/elevenlabs-integration"

export default function WebhooksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ElevenLabs Webhooks</h1>
            <p className="text-slate-600">Manage webhooks and voice integration with ElevenLabs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="https://elevenlabs.io/app/settings/webhooks" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                ElevenLabs Settings
              </a>
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </div>
        </div>

        {/* Current Webhooks */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Active Webhooks
            </CardTitle>
            <CardDescription>Currently configured webhooks for ElevenLabs integration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">sahon</div>
                    <div className="text-sm text-slate-600">https://localhost:5001</div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">HMAC Auth</Badge>
                      <Badge variant="secondary">Voice Library</Badge>
                      <Badge variant="secondary">Speech to Text</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm">
                    Test
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="integration" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="events">Webhook Events</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="integration">
            <ElevenLabsIntegration />
          </TabsContent>

          <TabsContent value="events">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Voice Removal Notice Webhook</CardTitle>
                  <CardDescription>Configure webhook for voice library removal notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="voice-webhook">Select Webhook</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select webhook endpoint" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sahon">sahon - https://localhost:5001</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Alert>
                      <Volume2 className="h-4 w-4" />
                      <AlertDescription>
                        This webhook will be called when a voice in use is scheduled for removal from your library.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Speech to Text Async Webhooks</CardTitle>
                  <CardDescription>Configure webhooks for speech transcription completion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="stt-webhook">Select Webhook Endpoints</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select webhook endpoint" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sahon">sahon - https://localhost:5001</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Alert>
                      <Mic className="h-4 w-4" />
                      <AlertDescription>
                        These webhooks receive events when speech to text async transcription is completed. Only sent if
                        the request was made with the webhook parameter enabled.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="testing">
            <WebhookManager />
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Activity Logs</CardTitle>
                <CardDescription>Recent webhook events and responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      timestamp: "2024-01-15 14:30:25",
                      event: "voice.removal.notice",
                      webhook: "sahon",
                      status: "success",
                      responseTime: "245ms",
                    },
                    {
                      timestamp: "2024-01-15 14:28:12",
                      event: "speech.to.text.completed",
                      webhook: "sahon",
                      status: "success",
                      responseTime: "189ms",
                    },
                    {
                      timestamp: "2024-01-15 14:25:45",
                      event: "speech.to.text.completed",
                      webhook: "sahon",
                      status: "failed",
                      responseTime: "timeout",
                    },
                  ].map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {log.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium text-sm">{log.event}</div>
                          <div className="text-xs text-slate-600">
                            {log.timestamp} • {log.webhook}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">{log.responseTime}</span>
                        <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
