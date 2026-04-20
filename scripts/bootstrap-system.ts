import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function bootstrap() {
  console.log('🚀 Bootstrapping ZombieCoder system...');

  // 1. Create System Identity
  console.log('\n📝 Creating System Identity...');
  const identity = await prisma.systemIdentity.upsert({
    where: { id: 'zombiecoder-v1' },
    update: {},
    create: {
      id: 'zombiecoder-v1',
      name: 'ZombieCoder',
      version: '1.0.0',
      tagline: 'যেখানে কোড ও কথা বলে',
      owner: 'Sahon Srabon',
      organization: 'Developer Zone',
      address: '235 South Pirarbag, Amtala Bazar, Mirpur - 60 feet',
      location: 'Dhaka, Bangladesh',
      phone: '+880 1323-626282',
      email: 'infi@zombiecoder.my.id',
      website: 'https://zombiecoder.my.id/',
      license: 'Proprietary - Local Freedom Protocol',
    },
  });
  console.log(`✅ System Identity: ${identity.name} v${identity.version}`);

  // 2. Create AI Providers
  console.log('\n🤖 Creating AI Providers...');
  
  const providers = await Promise.all([
    // Ollama Local Provider
    prisma.aiProvider.upsert({
      where: { id: 'ollama-local' },
      update: {},
      create: {
        id: 'ollama-local',
        name: 'Ollama Local',
        type: 'ollama',
        status: 'active',
        isDefault: true,
        endpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_DEFAULT_MODEL || 'llama3.2:1b',
        config: JSON.stringify({ temperature: 0.7, maxTokens: 4096 }),
      },
    }),
    
    // OpenAI Provider
    prisma.aiProvider.upsert({
      where: { id: 'openai' },
      update: {},
      create: {
        id: 'openai',
        name: 'OpenAI',
        type: 'openai',
        status: process.env.OPENAI_API_KEY ? 'active' : 'inactive',
        isDefault: false,
        apiKeyEnvVar: 'OPENAI_API_KEY',
        config: JSON.stringify({ temperature: 0.7, maxTokens: 4096 }),
      },
    }),
    
    // Gemini Provider
    prisma.aiProvider.upsert({
      where: { id: 'gemini' },
      update: {},
      create: {
        id: 'gemini',
        name: 'Google Gemini',
        type: 'gemini',
        status: process.env.GEMINI_API_KEY ? 'active' : 'inactive',
        isDefault: false,
        apiKeyEnvVar: 'GEMINI_API_KEY',
        config: JSON.stringify({ temperature: 0.7, maxTokens: 4096 }),
      },
    }),
  ]);
  
  providers.forEach(p => console.log(`✅ Provider: ${p.name} (${p.status})`));

  // 3. Create Agents
  console.log('\n🎯 Creating Agents...');
  
  const agents = await Promise.all([
    // Editor Agent
    prisma.agent.upsert({
      where: { id: 'editor-agent' },
      update: {},
      create: {
        id: 'editor-agent',
        name: 'Editor Agent',
        type: 'editor',
        status: 'active',
        personaName: 'ZombieCoder Dev Agent',
        description: 'Full-stack development agent with code editing capabilities',
        providerId: 'ollama-local',
        config: JSON.stringify({
          maxTokens: 4096,
          temperature: 0.7,
          capabilities: ['code-generation', 'refactoring', 'debugging', 'testing'],
          languagePreferences: ['typescript', 'javascript', 'python'],
        }),
      },
    }),
    
    // Chat Agent
    prisma.agent.upsert({
      where: { id: 'chat-agent' },
      update: {},
      create: {
        id: 'chat-agent',
        name: 'Chat Agent',
        type: 'chat',
        status: 'active',
        personaName: 'ZombieCoder Assistant',
        description: 'Conversational AI assistant for general queries',
        providerId: 'ollama-local',
        config: JSON.stringify({
          maxTokens: 2048,
          temperature: 0.8,
          capabilities: ['conversation', 'qa', 'explanation'],
        }),
      },
    }),
    
    // CLI Agent
    prisma.agent.upsert({
      where: { id: 'cli-agent' },
      update: {},
      create: {
        id: 'cli-agent',
        name: 'CLI Agent',
        type: 'cli',
        status: 'active',
        description: 'Command-line interface agent for terminal operations',
        providerId: 'ollama-local',
        config: JSON.stringify({
          maxTokens: 2048,
          temperature: 0.5,
          capabilities: ['shell-commands', 'file-operations', 'system-info'],
        }),
      },
    }),
  ]);
  
  agents.forEach(a => console.log(`✅ Agent: ${a.name} (${a.type})`));

  // 4. Create Default System Settings
  console.log('\n⚙️ Creating System Settings...');
  
  const settings = await Promise.all([
    prisma.systemSetting.upsert({
      where: { key: 'provider_cache_ttl' },
      update: {},
      create: {
        key: 'provider_cache_ttl',
        value: process.env.PROVIDER_SETTINGS_CACHE_TTL_MS || '2000',
        description: 'Cache TTL for provider settings in milliseconds',
        category: 'performance',
      },
    }),
    
    prisma.systemSetting.upsert({
      where: { key: 'public_gateway_enabled' },
      update: {},
      create: {
        key: 'public_gateway_enabled',
        value: process.env.PUBLIC_GATEWAY_ENABLED || 'true',
        description: 'Enable public API gateway',
        category: 'security',
      },
    }),
    
    prisma.systemSetting.upsert({
      where: { key: 'log_level' },
      update: {},
      create: {
        key: 'log_level',
        value: process.env.LOG_LEVEL || 'info',
        description: 'Application log level',
        category: 'general',
      },
    }),
  ]);
  
  settings.forEach(s => console.log(`✅ Setting: ${s.key} = ${s.value}`));

  // 5. Create Default MCP Tools
  console.log('\n🔧 Creating MCP Tools...');
  
  const tools = await Promise.all([
    prisma.mcpTool.upsert({
      where: { name: 'read_file' },
      update: {},
      create: {
        name: 'read_file',
        description: 'Read contents of a file',
        category: 'file',
        inputSchema: JSON.stringify({
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to read' },
          },
          required: ['path'],
        }),
        enabled: true,
      },
    }),
    
    prisma.mcpTool.upsert({
      where: { name: 'write_file' },
      update: {},
      create: {
        name: 'write_file',
        description: 'Write contents to a file',
        category: 'file',
        inputSchema: JSON.stringify({
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to write' },
            content: { type: 'string', description: 'Content to write' },
          },
          required: ['path', 'content'],
        }),
        enabled: true,
      },
    }),
    
    prisma.mcpTool.upsert({
      where: { name: 'run_terminal' },
      update: {},
      create: {
        name: 'run_terminal',
        description: 'Execute a terminal command',
        category: 'shell',
        inputSchema: JSON.stringify({
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Command to execute' },
          },
          required: ['command'],
        }),
        enabled: true,
      },
    }),
    
    prisma.mcpTool.upsert({
      where: { name: 'search_codebase' },
      update: {},
      create: {
        name: 'search_codebase',
        description: 'Search the codebase semantically',
        category: 'code',
        inputSchema: JSON.stringify({
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
          },
          required: ['query'],
        }),
        enabled: true,
      },
    }),
  ]);
  
  tools.forEach(t => console.log(`✅ Tool: ${t.name} (${t.category})`));

  // 6. Create Default Prompt Templates
  console.log('\n📄 Creating Prompt Templates...');
  
  const templates = await Promise.all([
    prisma.promptTemplate.upsert({
      where: { name: 'system-identity' },
      update: {},
      create: {
        name: 'system-identity',
        description: 'System identity and persona template',
        template: `You are {name} v{version}, created by {owner} at {organization}.
Your tagline: {tagline}
Location: {location}
License: {license}`,
        inputVariables: JSON.stringify(['name', 'version', 'owner', 'organization', 'tagline', 'location', 'license']),
        category: 'identity',
        isSystem: true,
      },
    }),
    
    prisma.promptTemplate.upsert({
      where: { name: 'code-assistant' },
      update: {},
      create: {
        name: 'code-assistant',
        description: 'Code generation and assistance template',
        template: `You are an expert software developer. Help the user with:
- Writing clean, efficient code
- Debugging issues
- Explaining concepts
- Best practices

Language: {language}
Framework: {framework}`,
        inputVariables: JSON.stringify(['language', 'framework']),
        category: 'code',
        isSystem: true,
      },
    }),
  ]);
  
  templates.forEach(t => console.log(`✅ Template: ${t.name} (${t.category})`));

  console.log('\n✅ Bootstrap complete!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 System Identity`);
  console.log(`   - ${providers.length} AI Providers`);
  console.log(`   - ${agents.length} Agents`);
  console.log(`   - ${settings.length} System Settings`);
  console.log(`   - ${tools.length} MCP Tools`);
  console.log(`   - ${templates.length} Prompt Templates`);
}

bootstrap()
  .catch((e) => {
    console.error('❌ Bootstrap failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
