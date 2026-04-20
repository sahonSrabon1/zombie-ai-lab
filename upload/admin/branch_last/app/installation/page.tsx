import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderOpen, HardDrive, CheckCircle, AlertTriangle, Settings } from "lucide-react"
import { CodeBlock } from "@/components/code-block"

export default function InstallationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Installation Guide</h1>
          <p className="text-slate-600">Complete installation and setup instructions for your AI models</p>
        </div>

        {/* System Requirements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              System Requirements
            </CardTitle>
            <CardDescription>Minimum requirements for running AI models locally</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">16GB</div>
                <div className="text-sm text-slate-600">Minimum RAM</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">100GB</div>
                <div className="text-sm text-slate-600">Free Disk Space</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-2">CUDA</div>
                <div className="text-sm text-slate-600">GPU Support (Optional)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Steps */}
        <Tabs defaultValue="windows" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="windows">Windows</TabsTrigger>
            <TabsTrigger value="linux">Linux</TabsTrigger>
            <TabsTrigger value="macos">macOS</TabsTrigger>
          </TabsList>

          <TabsContent value="windows">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Windows Installation</CardTitle>
                  <CardDescription>Step-by-step installation for Windows systems</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        1
                      </span>
                      Download AI Models Package
                    </h3>
                    <CodeBlock
                      language="powershell"
                      code={`# Download the complete AI models package
Invoke-WebRequest -Uri "https://releases.ai-models.local/windows/ai-models-v1.0.zip" -OutFile "ai-models.zip"

# Extract to default location
Expand-Archive -Path "ai-models.zip" -DestinationPath "C:\AI-Models"`}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        2
                      </span>
                      Install Dependencies
                    </h3>
                    <CodeBlock
                      language="powershell"
                      code={`# Install Python 3.9+ (if not already installed)
winget install Python.Python.3.11

# Install required packages
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install transformers accelerate bitsandbytes`}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        3
                      </span>
                      Configure Environment
                    </h3>
                    <CodeBlock
                      language="powershell"
                      code={`# Set environment variables
[Environment]::SetEnvironmentVariable("AI_MODELS_PATH", "C:\AI-Models", "User")
[Environment]::SetEnvironmentVariable("AI_SERVER_PORT", "3307", "User")

# Add to PATH
$env:PATH += ";C:\AI-Models\bin"`}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        4
                      </span>
                      Start AI Server
                    </h3>
                    <CodeBlock
                      language="powershell"
                      code={`# Navigate to installation directory
cd C:\AI-Models

# Start the AI server
.\start-server.bat

# Verify installation
curl http://localhost:3307/status`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* File Locations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Default File Locations (Windows)
                  </CardTitle>
                  <CardDescription>Standard installation paths and configuration files</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        path: "C:\\AI-Models\\",
                        description: "Main installation directory",
                        type: "Primary",
                      },
                      {
                        path: "C:\\AI-Models\\models\\",
                        description: "Individual model files",
                        type: "Models",
                      },
                      {
                        path: "C:\\AI-Models\\config\\",
                        description: "Configuration files",
                        type: "Config",
                      },
                      {
                        path: "C:\\AI-Models\\logs\\",
                        description: "Server and model logs",
                        type: "Logs",
                      },
                      {
                        path: "C:\\Users\\%USERNAME%\\AppData\\Local\\AI-Models\\",
                        description: "User-specific settings",
                        type: "User Data",
                      },
                    ].map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium font-mono text-sm">{location.path}</div>
                          <div className="text-sm text-slate-600">{location.description}</div>
                        </div>
                        <Badge variant="outline">{location.type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="linux">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Linux Installation</CardTitle>
                  <CardDescription>Installation instructions for Linux distributions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        1
                      </span>
                      Install Dependencies
                    </h3>
                    <CodeBlock
                      language="bash"
                      code={`# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip git curl

# CentOS/RHEL
sudo yum install python3 python3-pip git curl

# Arch Linux
sudo pacman -S python python-pip git curl`}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        2
                      </span>
                      Download and Install
                    </h3>
                    <CodeBlock
                      language="bash"
                      code={`# Create installation directory
sudo mkdir -p /opt/ai-models
cd /opt/ai-models

# Download and extract
wget https://releases.ai-models.local/linux/ai-models-v1.0.tar.gz
sudo tar -xzf ai-models-v1.0.tar.gz

# Set permissions
sudo chown -R $USER:$USER /opt/ai-models
chmod +x /opt/ai-models/bin/*`}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        3
                      </span>
                      Configure Environment
                    </h3>
                    <CodeBlock
                      language="bash"
                      code={`# Add to ~/.bashrc or ~/.zshrc
echo 'export AI_MODELS_PATH="/opt/ai-models"' >> ~/.bashrc
echo 'export AI_SERVER_PORT="3307"' >> ~/.bashrc
echo 'export PATH="$PATH:/opt/ai-models/bin"' >> ~/.bashrc

# Reload shell configuration
source ~/.bashrc`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* File Locations Linux */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Default File Locations (Linux)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        path: "/opt/ai-models/",
                        description: "Main installation directory",
                        type: "Primary",
                      },
                      {
                        path: "/opt/ai-models/models/",
                        description: "Individual model files",
                        type: "Models",
                      },
                      {
                        path: "/etc/ai-models/",
                        description: "System-wide configuration",
                        type: "Config",
                      },
                      {
                        path: "/var/log/ai-models/",
                        description: "Server and model logs",
                        type: "Logs",
                      },
                      {
                        path: "~/.config/ai-models/",
                        description: "User-specific settings",
                        type: "User Data",
                      },
                    ].map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium font-mono text-sm">{location.path}</div>
                          <div className="text-sm text-slate-600">{location.description}</div>
                        </div>
                        <Badge variant="outline">{location.type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="macos">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>macOS Installation</CardTitle>
                  <CardDescription>Installation instructions for macOS systems</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        1
                      </span>
                      Install Homebrew and Dependencies
                    </h3>
                    <CodeBlock
                      language="bash"
                      code={`# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install python@3.11 git curl wget

# Install Python packages
pip3 install torch torchvision torchaudio transformers accelerate`}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        2
                      </span>
                      Download and Install
                    </h3>
                    <CodeBlock
                      language="bash"
                      code={`# Create installation directory
sudo mkdir -p /usr/local/ai-models
cd /usr/local/ai-models

# Download and extract
curl -L https://releases.ai-models.local/macos/ai-models-v1.0.tar.gz -o ai-models.tar.gz
sudo tar -xzf ai-models.tar.gz

# Set permissions
sudo chown -R $(whoami):staff /usr/local/ai-models
chmod +x /usr/local/ai-models/bin/*`}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        3
                      </span>
                      Configure Environment
                    </h3>
                    <CodeBlock
                      language="bash"
                      code={`# Add to ~/.zshrc (default shell on macOS)
echo 'export AI_MODELS_PATH="/usr/local/ai-models"' >> ~/.zshrc
echo 'export AI_SERVER_PORT="3307"' >> ~/.zshrc
echo 'export PATH="$PATH:/usr/local/ai-models/bin"' >> ~/.zshrc

# Reload shell configuration
source ~/.zshrc`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* File Locations macOS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Default File Locations (macOS)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        path: "/usr/local/ai-models/",
                        description: "Main installation directory",
                        type: "Primary",
                      },
                      {
                        path: "/usr/local/ai-models/models/",
                        description: "Individual model files",
                        type: "Models",
                      },
                      {
                        path: "/usr/local/etc/ai-models/",
                        description: "System-wide configuration",
                        type: "Config",
                      },
                      {
                        path: "/usr/local/var/log/ai-models/",
                        description: "Server and model logs",
                        type: "Logs",
                      },
                      {
                        path: "~/Library/Application Support/AI-Models/",
                        description: "User-specific settings",
                        type: "User Data",
                      },
                    ].map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium font-mono text-sm">{location.path}</div>
                          <div className="text-sm text-slate-600">{location.description}</div>
                        </div>
                        <Badge variant="outline">{location.type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Custom Installation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Custom Installation Locations
            </CardTitle>
            <CardDescription>How to change default installation paths</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                If you need to install in a different location due to disk space or security requirements, follow these
                steps to customize your installation.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Environment Variables</h3>
                <CodeBlock
                  language="bash"
                  code={`# Set custom installation path
export AI_MODELS_PATH="/your/custom/path/ai-models"
export AI_CONFIG_PATH="/your/custom/path/config"
export AI_LOGS_PATH="/your/custom/path/logs"

# Update configuration file
echo "MODELS_DIR=$AI_MODELS_PATH/models" > $AI_CONFIG_PATH/server.conf
echo "PORT=3307" >> $AI_CONFIG_PATH/server.conf
echo "LOG_DIR=$AI_LOGS_PATH" >> $AI_CONFIG_PATH/server.conf`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-3">Migration Script</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Use this script to move an existing installation to a new location:
                </p>
                <CodeBlock
                  language="bash"
                  code={`#!/bin/bash
# Migration script for AI Models

OLD_PATH="/opt/ai-models"
NEW_PATH="/your/new/path/ai-models"

# Stop the server
./stop-server.sh

# Create new directory
mkdir -p "$NEW_PATH"

# Copy files
cp -r "$OLD_PATH"/* "$NEW_PATH/"

# Update configuration
sed -i "s|$OLD_PATH|$NEW_PATH|g" "$NEW_PATH/config/server.conf"

# Update environment variables
echo "export AI_MODELS_PATH=\"$NEW_PATH\"" >> ~/.bashrc

# Start server with new path
cd "$NEW_PATH"
./start-server.sh`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Installation Verification
            </CardTitle>
            <CardDescription>Verify that your installation is working correctly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Quick Verification</h3>
                <CodeBlock
                  language="bash"
                  code={`# Check server status
curl http://localhost:3307/status

# Expected response:
# {"status":"running","models":["mistral","deepseek","phi","gemma","tinyllama"]}

# Test model endpoint
curl -X POST http://localhost:3307/v1/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model":"mistral","prompt":"Hello","max_tokens":10}'`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-3">Comprehensive Health Check</h3>
                <CodeBlock
                  language="bash"
                  code={`# Run the built-in health check script
./health-check.sh --full

# Check individual models
./health-check.sh --model mistral
./health-check.sh --model deepseek
./health-check.sh --model phi
./health-check.sh --model gemma
./health-check.sh --model tinyllama

# View system resources
./health-check.sh --resources`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
