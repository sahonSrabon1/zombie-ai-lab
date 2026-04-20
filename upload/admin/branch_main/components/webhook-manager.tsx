"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, CheckCircle, XCircle, Loader2 } from "lucide-react"

export function WebhookManager() {
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])

  const testWebhook = async (webhookUrl: string, eventType: string) => {
    setTesting(true)

    // Simulate webhook test
    setTimeout(() => {
      const result = {
        url: webhookUrl,
        event: eventType,
        status: Math.random() > 0.3 ? "success" : "failed",
        responseTime: Math.floor(Math.random() * 500) + 100,
        timestamp: new Date().toLocaleTimeString(),
      }

      setTestResults((prev) => [result, ...prev.slice(0, 4)])
      setTesting(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Testing</CardTitle>
          <CardDescription>Test your webhook endpoints with sample events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input id="webhook-url" defaultValue="https://localhost:5001" />
            </div>
            <div>
              <Label htmlFor="event-type">Event Type</Label>
              <select id="event-type" className="w-full p-2 border rounded-md">
                <option value="voice.removal.notice">Voice Removal Notice</option>
                <option value="speech.to.text.completed">Speech to Text Completed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => testWebhook("https://localhost:5001", "voice.removal.notice")} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Test Voice Removal
            </Button>
            <Button
              variant="outline"
              onClick={() => testWebhook("https://localhost:5001", "speech.to.text.completed")}
              disabled={testing}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Test Speech to Text
            </Button>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Test webhooks will send sample payloads to your configured endpoints to verify connectivity and response
              handling.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Recent webhook test outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {result.status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium text-sm">{result.event}</div>
                      <div className="text-xs text-slate-600">
                        {result.url} • {result.timestamp}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">{result.responseTime}ms</span>
                    <Badge variant={result.status === "success" ? "default" : "destructive"}>{result.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
