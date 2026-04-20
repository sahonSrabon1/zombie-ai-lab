"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Settings, Volume2, Mic, CheckCircle } from "lucide-react"

export function ElevenLabsIntegration() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            ElevenLabs Integration Setup
          </CardTitle>
          <CardDescription>Configure your ElevenLabs API integration for voice processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your ElevenLabs integration is active and configured. Voice processing and webhook events are working
              properly.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-key">ElevenLabs API Key</Label>
                <Input id="api-key" type="password" value="sk-*********************" readOnly />
              </div>
              <div>
                <Label htmlFor="webhook-url">Webhook Endpoint</Label>
                <Input id="webhook-url" value="https://localhost:5001" readOnly />
              </div>
              <div>
                <Label htmlFor="auth-method">Authentication Method</Label>
                <Input id="auth-method" value="HMAC" readOnly />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Active Features</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm">Voice Library Management</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm">Speech to Text</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm">Voice Synthesis</span>
                  <Badge variant="secondary">Available</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm">Real-time Voice</span>
                  <Badge variant="secondary">Available</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild>
              <a href="https://elevenlabs.io/app/settings/webhooks" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open ElevenLabs Settings
              </a>
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure Integration
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Processing Features
          </CardTitle>
          <CardDescription>Available voice processing capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Text to Speech</h3>
              <p className="text-sm text-slate-600 mb-3">Convert AI model responses to natural speech</p>
              <Button size="sm" variant="outline">
                Configure
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Speech to Text</h3>
              <p className="text-sm text-slate-600 mb-3">Convert voice input to text for AI processing</p>
              <Button size="sm" variant="outline">
                Configure
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Voice Cloning</h3>
              <p className="text-sm text-slate-600 mb-3">Create custom voices for AI responses</p>
              <Button size="sm" variant="outline">
                Configure
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Real-time Voice</h3>
              <p className="text-sm text-slate-600 mb-3">Live voice conversation with AI models</p>
              <Button size="sm" variant="outline">
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
