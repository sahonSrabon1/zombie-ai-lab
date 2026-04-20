'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Settings, Trash2, RefreshCw } from 'lucide-react';
import { useAdmin } from '@/lib/context/admin';

// Mock data - replace with API call
const mockProviders = [
  {
    id: '1',
    name: 'OpenAI',
    type: 'LLM Provider',
    status: 'connected' as const,
    apiKey: '****...****',
    models: 5,
  },
  {
    id: '2',
    name: 'Anthropic',
    type: 'LLM Provider',
    status: 'connected' as const,
    apiKey: '****...****',
    models: 3,
  },
  {
    id: '3',
    name: 'Google Vertex',
    type: 'LLM Provider',
    status: 'connected' as const,
    apiKey: '****...****',
    models: 2,
  },
  {
    id: '4',
    name: 'Pinecone',
    type: 'Vector DB',
    status: 'disconnected' as const,
    apiKey: '****...****',
    models: 0,
  },
];

export default function ProvidersPage() {
  const { client } = useAdmin();
  const [search, setSearch] = useState('');
  const [providers, setProviders] = useState(mockProviders);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      // Try to fetch from backend, fallback to mock data
      try {
        const data = await client.get('/providers');
        setProviders(data);
      } catch {
        setProviders(mockProviders);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProviders();
    setRefreshing(false);
  };

  const filteredProviders = providers.filter(
    provider =>
      provider.name.toLowerCase().includes(search.toLowerCase()) ||
      provider.type.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500/10 text-green-700 hover:bg-green-500/20';
      case 'disconnected':
        return 'bg-red-500/10 text-red-700 hover:bg-red-500/20';
      case 'error':
        return 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Providers</h1>
          <p className="text-muted-foreground mt-1">Configure API providers and external services</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Provider
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockProviders.filter(p => p.status === 'connected').length}
            </div>
            <p className="text-xs text-muted-foreground">Out of {mockProviders.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockProviders.reduce((sum, p) => sum + p.models, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all providers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider Configuration</CardTitle>
          <CardDescription>Manage API providers and their credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search providers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Models</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No providers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProviders.map(provider => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{provider.type}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(provider.status)}>
                          {provider.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{provider.models} models</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Settings className="h-4 w-4" />
                            Configure
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
