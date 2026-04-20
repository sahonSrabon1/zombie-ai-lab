'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { Plus, Search, RefreshCw } from 'lucide-react';
import { useAdmin } from '@/lib/context/admin';

// Mock data - replace with API call
const mockModels = [
  {
    id: '1',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    version: '2024-04-09',
    status: 'active' as const,
    lastUpdated: '2024-04-15',
  },
  {
    id: '2',
    name: 'Claude 3.5',
    provider: 'Anthropic',
    version: '3.5',
    status: 'active' as const,
    lastUpdated: '2024-04-10',
  },
  {
    id: '3',
    name: 'Gemini Pro',
    provider: 'Google',
    version: '1.0',
    status: 'active' as const,
    lastUpdated: '2024-04-08',
  },
  {
    id: '4',
    name: 'Mistral Large',
    provider: 'Mistral',
    version: '2402',
    status: 'inactive' as const,
    lastUpdated: '2024-03-20',
  },
];

export default function ModelsPage() {
  const { client } = useAdmin();
  const [search, setSearch] = useState('');
  const [models, setModels] = useState(mockModels);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      // Try to fetch from backend, fallback to mock data
      try {
        const data = await client.get('/models');
        setModels(data);
      } catch {
        setModels(mockModels);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchModels();
    setRefreshing(false);
  };

  const filteredModels = models.filter(
    model =>
      model.name.toLowerCase().includes(search.toLowerCase()) ||
      model.provider.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 hover:bg-green-500/20';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-700 hover:bg-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Models</h1>
          <p className="text-muted-foreground mt-1">Manage AI models and their configurations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Model
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>View and manage all configured AI models</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
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
                  <TableHead>Provider</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No models found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredModels.map(model => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>{model.provider}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{model.version}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(model.status)}>
                          {model.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(model.lastUpdated).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
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
