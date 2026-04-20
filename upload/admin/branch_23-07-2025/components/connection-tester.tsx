"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, Play } from "lucide-react"

interface TestResult {
  endpoint: string
  status: "success" | "failed" | "timeout"
  responseTime?: number
  error?: string
}

export function ConnectionTester() {
  const [endpoint, setEndpoint] = useState("http://localhost:3307")
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const testConnection = async () => {
    setTesting(true)
    const startTime = Date.now()

    try {
      // Simulate connection test
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const responseTime = Date.now() - startTime
      const result: TestResult = {
        endpoint,
        status: "success",
        responseTime,
      }

      setResults((prev) => [result, ...prev.slice(0, 4)])
    } catch (error) {
      const result: TestResult = {
        endpoint,
        status: "failed",
        error: "Connection refused",
      }

      setResults((prev) => [result, ...prev.slice(0, 4)])
    } finally {
      setTesting(false)
    }
  }

  const testEndpoints = [
    "http://localhost:3307/status",
    "http://localhost:3307/models",
    "http://localhost:3307/health",
    "http://127.0.0.1:3307/status",
  ]

  const runAllTests = async () => {
    setTesting(true)
    setResults([])

    for (const testEndpoint of testEndpoints) {
      const startTime = Date.now()

      try {
        // Simulate test for each endpoint
        await new Promise((resolve) => setTimeout(resolve, 800))

        const responseTime = Date.now() - startTime
        const result: TestResult = {
          endpoint: testEndpoint,
          status: Math.random() > 0.3 ? "success" : "failed",
          responseTime: Math.random() > 0.3 ? responseTime : undefined,
          error: Math.random() > 0.3 ? undefined : "Connection timeout",
        }

        setResults((prev) => [...prev, result])
      } catch (error) {
        const result: TestResult = {
          endpoint: testEndpoint,
          status: "failed",
          error: "Network error",
        }

        setResults((prev) => [...prev, result])
      }
    }

    setTesting(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="endpoint">Test Endpoint</Label>
            <Input
              id="endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://localhost:3307"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={testConnection} disabled={testing} className="w-full">
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>
          </div>
        </div>

        <Button variant="outline" onClick={runAllTests} disabled={testing} className="w-full bg-transparent">
          {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
          Run All Tests
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Test Results</h3>
          {results.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                {result.status === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <div>
                  <div className="font-medium text-sm">{result.endpoint}</div>
                  {result.error && <div className="text-xs text-red-600">{result.error}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {result.responseTime && <span className="text-xs text-slate-600">{result.responseTime}ms</span>}
                <Badge variant={result.status === "success" ? "default" : "destructive"}>{result.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>PowerShell Test:</strong> You can also test the connection using PowerShell:
          <code className="block mt-2 p-2 bg-slate-100 rounded text-sm">
            Test-NetConnection -ComputerName localhost -Port 3307
          </code>
        </AlertDescription>
      </Alert>
    </div>
  )
}
