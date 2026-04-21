export async function probeMcpServer(url: string): Promise<{
  tools: string[];
  resources: string[];
  ms: number;
}> {
  const t0 = Date.now();

  const rpc = async (body: unknown) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { result?: unknown; error?: unknown };
    if (!res.ok) {
      throw new Error(`MCP probe failed: HTTP ${res.status}`);
    }
    if (data && typeof data === 'object' && 'error' in data && (data as { error?: unknown }).error) {
      throw new Error(`MCP probe failed: ${JSON.stringify((data as { error: unknown }).error)}`);
    }
    return data.result;
  };

  await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });

  const toolsResult = (await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })) as {
    tools?: Array<{ name?: string }>;
  };
  const resourcesResult = (await rpc({ jsonrpc: '2.0', id: 3, method: 'resources/list', params: {} })) as {
    resources?: Array<{ name?: string }>;
  };

  return {
    tools: (toolsResult.tools ?? []).map((t) => t.name ?? '').filter(Boolean),
    resources: (resourcesResult.resources ?? []).map((r) => r.name ?? '').filter(Boolean),
    ms: Date.now() - t0,
  };
}
