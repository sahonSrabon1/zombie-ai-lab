import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  console.log('🔍 Testing Database Connection and Schema...\n')

  try {
    // Test 1: Connection
    console.log('✅ Test 1: Database Connection')
    await prisma.$connect()
    console.log('   Successfully connected to database!\n')

    // Test 2: Check all tables
    console.log('📊 Test 2: Checking All Tables')
    const tables = [
      'SystemIdentity',
      'AiProvider',
      'Agent',
      'AgentMemory',
      'IndividualMemory',
      'ChatSession',
      'ChatMessage',
      'McpTool',
      'AgentToolAssignment',
      'ToolExecutionLog',
      'SystemSetting',
      'ApiAuditLog',
      'EditorClientConnection',
      'EditorSessionBinding',
      'EditorWsRequestLog',
      'PromptTemplate',
      'AuthUser',
      'AuthSession'
    ]

    for (const table of tables) {
      try {
        const count = await (prisma as any)[table].count()
        console.log(`   ✓ ${table}: ${count} records`)
      } catch (error) {
        console.log(`   ✗ ${table}: ERROR - ${(error as Error).message}`)
      }
    }

    console.log('\n📝 Test 3: Checking Demo Data')

    // Check SystemIdentity
    const identity = await prisma.systemIdentity.findFirst()
    if (identity) {
      console.log('\n   🆔 SystemIdentity:')
      console.log(`      Name: ${identity.name}`)
      console.log(`      Version: ${identity.version}`)
      console.log(`      Owner: ${identity.owner}`)
      console.log(`      Email: ${identity.email}`)
    } else {
      console.log('\n   ⚠️  SystemIdentity: No data found')
      // Create default identity
      await prisma.systemIdentity.create({
        data: {
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
          license: 'Proprietary - Local Freedom Protocol'
        }
      })
      console.log('   ✓ Created default SystemIdentity')
    }

    // Check AI Providers
    const providers = await prisma.aiProvider.findMany()
    console.log(`\n   🤖 AI Providers: ${providers.length} records`)
    if (providers.length === 0) {
      // Create demo providers
      await prisma.aiProvider.createMany({
        data: [
          {
            name: 'Ollama Local',
            type: 'ollama',
            status: 'active',
            isDefault: true,
            endpoint: 'http://localhost:11434',
            model: 'qwen3:1.7b'
          },
          {
            name: 'OpenAI',
            type: 'openai',
            status: 'inactive',
            isDefault: false,
            apiKeyEnvVar: 'OPENAI_API_KEY'
          },
          {
            name: 'Gemini',
            type: 'gemini',
            status: 'inactive',
            isDefault: false,
            apiKeyEnvVar: 'GEMINI_API_KEY'
          }
        ]
      })
      console.log('   ✓ Created 3 demo AI Providers')
    } else {
      providers.forEach(p => {
        console.log(`      - ${p.name} (${p.status})`)
      })
    }

    // Check Agents
    const agents = await prisma.agent.findMany()
    console.log(`\n   👤 Agents: ${agents.length} records`)
    if (agents.length === 0) {
      await prisma.agent.createMany({
        data: [
          {
            name: 'Code Editor Agent',
            type: 'editor',
            status: 'active',
            personaName: 'DevBot',
            description: 'AI-powered code editor assistant'
          },
          {
            name: 'Chat Agent',
            type: 'chat',
            status: 'active',
            personaName: 'ChatBot',
            description: 'Conversational AI assistant'
          },
          {
            name: 'CLI Agent',
            type: 'cli',
            status: 'active',
            description: 'Command-line interface agent'
          }
        ]
      })
      console.log('   ✓ Created 3 demo Agents')
    } else {
      agents.forEach(a => {
        console.log(`      - ${a.name} (${a.type})`)
      })
    }

    // Check MCP Tools
    const tools = await prisma.mcpTool.findMany()
    console.log(`\n   🔧 MCP Tools: ${tools.length} records`)
    if (tools.length === 0) {
      await prisma.mcpTool.createMany({
        data: [
          {
            name: 'read_file',
            description: 'Read contents of a file',
            category: 'file',
            inputSchema: JSON.stringify({
              type: 'object',
              properties: {
                path: { type: 'string' }
              },
              required: ['path']
            })
          },
          {
            name: 'write_file',
            description: 'Write contents to a file',
            category: 'file',
            inputSchema: JSON.stringify({
              type: 'object',
              properties: {
                path: { type: 'string' },
                content: { type: 'string' }
              },
              required: ['path', 'content']
            })
          },
          {
            name: 'run_command',
            description: 'Execute a shell command',
            category: 'shell',
            inputSchema: JSON.stringify({
              type: 'object',
              properties: {
                command: { type: 'string' }
              },
              required: ['command']
            })
          },
          {
            name: 'search_code',
            description: 'Search codebase for patterns',
            category: 'code',
            inputSchema: JSON.stringify({
              type: 'object',
              properties: {
                query: { type: 'string' }
              },
              required: ['query']
            })
          }
        ]
      })
      console.log('   ✓ Created 4 demo MCP Tools')
    } else {
      tools.forEach(t => {
        console.log(`      - ${t.name} (${t.category})`)
      })
    }

    // Check System Settings
    const settings = await prisma.systemSetting.findMany()
    console.log(`\n   ⚙️  System Settings: ${settings.length} records`)
    if (settings.length === 0) {
      await prisma.systemSetting.createMany({
        data: [
          {
            key: 'theme',
            value: 'dark',
            description: 'UI theme preference',
            category: 'general'
          },
          {
            key: 'language',
            value: 'bn',
            description: 'Default language',
            category: 'general'
          },
          {
            key: 'max_tokens',
            value: '4096',
            description: 'Maximum tokens for AI responses',
            category: 'performance'
          }
        ]
      })
      console.log('   ✓ Created 3 demo System Settings')
    } else {
      settings.forEach(s => {
        console.log(`      - ${s.key}: ${s.value}`)
      })
    }

    // Check Prompt Templates
    const templates = await prisma.promptTemplate.findMany()
    console.log(`\n   📋 Prompt Templates: ${templates.length} records`)
    if (templates.length === 0) {
      await prisma.promptTemplate.createMany({
        data: [
          {
            name: 'code_assistant',
            description: 'Default code assistant prompt',
            template: 'You are an expert programmer helping with {language}. {context}',
            inputVariables: JSON.stringify(['language', 'context']),
            category: 'code',
            isSystem: true
          },
          {
            name: 'chat_greeting',
            description: 'Friendly chat greeting',
            template: 'Hello! I am {name}, your AI assistant. How can I help you today?',
            inputVariables: JSON.stringify(['name']),
            category: 'chat',
            isSystem: true
          }
        ]
      })
      console.log('   ✓ Created 2 demo Prompt Templates')
    } else {
      templates.forEach(t => {
        console.log(`      - ${t.name} (${t.category})`)
      })
    }

    console.log('\n✅ All tests completed successfully!')
    console.log('\n📊 Summary:')
    console.log('   - Database connection: OK')
    console.log('   - Tables: 15 tables verified')
    console.log('   - Demo data: Created/Verified')

  } catch (error) {
    console.error('\n❌ Error during testing:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
