'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Copy, Loader2 } from 'lucide-react';
import { useState } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export default function APITestPage() {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [endpoint, setEndpoint] = useState('/api/');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState('{}');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(0);

  const handleSendRequest = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const options: RequestInit = {
        method,
        headers: JSON.parse(headers),
      };

      if (method !== 'GET' && method !== 'DELETE') {
        options.body = body;
      }

      const res = await fetch(endpoint, options);
      const data = await res.text();

      setResponseTime(Date.now() - startTime);
      setResponse(JSON.stringify({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers),
        body: data,
      }, null, 2));
    } catch (error) {
      setResponse(JSON.stringify({
        error: error instanceof Error ? error.message : 'Request failed',
      }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (response: string) => {
    try {
      const data = JSON.parse(response);
      if (data.status >= 200 && data.status < 300) return 'text-green-600';
      if (data.status >= 400 && data.status < 500) return 'text-yellow-600';
      if (data.status >= 500) return 'text-red-600';
    } catch {}
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Testing</h1>
        <p className="text-muted-foreground mt-1">Test your backend API endpoints with a built-in client</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Section */}
        <Card>
          <CardHeader>
            <CardTitle>Request</CardTitle>
            <CardDescription>Configure and send API requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={method} onValueChange={(value) => setMethod(value as HttpMethod)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="/api/endpoint"
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Headers (JSON)</label>
              <Textarea
                value={headers}
                onChange={e => setHeaders(e.target.value)}
                className="font-mono text-xs h-24"
              />
            </div>

            {method !== 'GET' && method !== 'DELETE' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Body (JSON)</label>
                <Textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="font-mono text-xs h-32"
                />
              </div>
            )}

            <Button onClick={handleSendRequest} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Request
            </Button>
          </CardContent>
        </Card>

        {/* Response Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Response</CardTitle>
                <CardDescription>API response and details</CardDescription>
              </div>
              {response && (
                <div className="flex gap-2">
                  <Badge variant="outline" className={getStatusColor(response)}>
                    {responseTime}ms
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigator.clipboard.writeText(response)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {response ? (
              <pre className="font-mono text-xs bg-muted p-3 rounded-md overflow-auto max-h-96 whitespace-pre-wrap break-words">
                {response}
              </pre>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No response yet. Send a request to see the response here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
