# AI Management Dashboard

A comprehensive AI model management and development toolkit with multi-language support (English and Bengali).

## Features

- 🤖 **AI Model Management** - Monitor and control local AI models
- 💬 **Multi-Language Support** - English and Bengali (বাংলা) interface
- 🎛️ **Admin Panel** - Complete administrative interface with sidebar navigation
- 🔧 **Server Management** - WHM domains, SSH tools, server access
- 💾 **Database Tools** - MySQL management, analysis, and backup
- 🎵 **ElevenLabs Integration** - Voice processing and webhooks
- 📝 **Command Library** - PHP, Node.js, Python, Linux, and Ollama commands
- ⚡ **Development Tools** - Git and Docker command interfaces
- 📊 **Real-time Monitoring** - Performance metrics and system health

## System Requirements

- **RAM:** 16GB minimum
- **Disk Space:** 100GB free space
- **Node.js:** 18+ 
- **OS:** Windows 10/11, macOS, or Linux

## Quick Installation (Windows)

### Option 1: Batch Script
1. Download or clone this repository
2. Double-click `install-windows.bat`
3. Follow the on-screen instructions

### Option 2: PowerShell Script
1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Navigate to project directory
4. Run: `.\install-windows.ps1`

### Option 3: Manual Installation
\`\`\`bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Build the project
npm run build

# Start development server
npm run dev
\`\`\`

## Environment Configuration

Create a `.env.local` file with these variables:

\`\`\`env
# AI Management Dashboard Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3307
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3307
DATABASE_USER=root
DATABASE_PASSWORD=105585
DATABASE_NAME=modelsraver1
ELEVENLABS_API_KEY=your_api_key_here
\`\`\`

## Usage

### Public Interface
- **Main Dashboard:** http://localhost:3000
- **Documentation:** http://localhost:3000/documentation
- **Setup Guide:** http://localhost:3000/setup

### Admin Panel
- **Admin Dashboard:** http://localhost:3000/admin
- **Model Management:** http://localhost:3000/admin/models
- **Database Tools:** http://localhost:3000/admin/database
- **Server Management:** http://localhost:3000/admin/server

## Language Support

The dashboard supports both English and Bengali:

- **English Interface:** Default language
- **Bengali Interface:** বাংলা ইন্টারফেস সাপোর্ট

Switch languages using the language selector in the admin sidebar.

## Available Scripts

\`\`\`bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linting

# Windows Installation
install-windows.bat  # Batch script installation
install-windows.ps1  # PowerShell script installation
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── admin/              # Admin panel pages
│   ├── (public pages)/     # Public interface pages
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── admin-sidebar.tsx   # Admin navigation
│   └── (other components)
├── lib/
│   ├── i18n.ts            # Language translations
│   └── language-context.tsx # Language provider
├── install-windows.bat     # Windows batch installer
├── install-windows.ps1     # Windows PowerShell installer
└── README.md
\`\`\`

## Features by Section

### AI Tools
- **AI Chat:** Multi-model chat interface
- **Prompt Generator:** Create optimized prompts
- **Project Ideas:** AI-generated development suggestions

### Server Management
- **WHM Domains:** Domain and SSL management
- **Server Access:** Remote server controls
- **SSH Tools:** Secure shell utilities

### Database Management
- **Database Tools:** MySQL management interface
- **Database Analysis:** Performance and analytics
- **Connection Management:** Database connectivity tools
- **cPanel Integration:** Web hosting panel access

### Command Libraries
- **PHP Commands:** Web development commands
- **Node.js Commands:** JavaScript runtime commands
- **Python Commands:** Python development tools
- **Linux Commands:** System administration
- **Ollama Commands:** Local AI model management

### Development Tools
- **Git Commands:** Version control interface
- **Docker Commands:** Container management

## Troubleshooting

### Common Issues

1. **Port 3307 already in use:**
   \`\`\`bash
   netstat -ano | findstr :3307
   taskkill /PID <PID> /F
   \`\`\`

2. **Node.js not found:**
   - Install Node.js from https://nodejs.org/
   - Restart your terminal/command prompt

3. **Permission errors (Windows):**
   - Run PowerShell as Administrator
   - Enable script execution: `Set-ExecutionPolicy RemoteSigned`

4. **Database connection failed:**
   - Check your `.env.local` configuration
   - Ensure MySQL server is running on port 3307

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add translations for new features
5. Submit a pull request

## Support

- **Documentation:** http://localhost:3000/documentation
- **Troubleshooting:** http://localhost:3000/troubleshooting
- **GitHub Issues:** [Create an issue](https://github.com/your-repo/issues)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
