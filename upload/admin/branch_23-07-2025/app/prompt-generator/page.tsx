import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Wand2, Copy, Download, Shuffle } from "lucide-react"

export default function PromptGeneratorPage() {
  const promptTemplates = [
    {
      category: "Code Analysis",
      templates: [
        "Analyze this code for potential bugs and security vulnerabilities: {code}",
        "Review this function and suggest improvements: {code}",
        "Explain what this code does step by step: {code}",
      ],
    },
    {
      category: "Code Generation",
      templates: [
        "Create a {language} function that {description}",
        "Write a REST API endpoint for {functionality} using {framework}",
        "Generate unit tests for this function: {code}",
      ],
    },
    {
      category: "Documentation",
      templates: [
        "Write comprehensive documentation for this API: {api_details}",
        "Create a README file for a {project_type} project",
        "Generate inline comments for this code: {code}",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Prompt Generator</h1>
            <p className="text-slate-600">Create optimized prompts for your AI models</p>
          </div>
          <Button>
            <Wand2 className="h-4 w-4 mr-2" />
            Generate Prompt
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prompt Builder */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Builder</CardTitle>
                <CardDescription>Customize your prompt parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="task-type">Task Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="code-analysis">Code Analysis</SelectItem>
                        <SelectItem value="code-generation">Code Generation</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="debugging">Debugging</SelectItem>
                        <SelectItem value="explanation">Explanation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="model">Target Model</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mistral">Mistral</SelectItem>
                        <SelectItem value="deepseek">DeepSeek</SelectItem>
                        <SelectItem value="phi">Phi</SelectItem>
                        <SelectItem value="gemma">Gemma</SelectItem>
                        <SelectItem value="tinyllama">TinyLlama</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="context">Context/Background</Label>
                  <Textarea id="context" placeholder="Provide context for your request..." className="h-24" />
                </div>

                <div>
                  <Label htmlFor="specific-request">Specific Request</Label>
                  <Textarea
                    id="specific-request"
                    placeholder="What exactly do you want the AI to do?"
                    className="h-24"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="length">Response Length</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brief">Brief</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="format">Output Format</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Plain Text</SelectItem>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="code">Code Block</SelectItem>
                        <SelectItem value="list">Bullet Points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Prompt
                  </Button>
                  <Button variant="outline">
                    <Shuffle className="h-4 w-4 mr-2" />
                    Random
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generated Prompt */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Generated Prompt</CardTitle>
                <CardDescription>Your optimized prompt ready to use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <p className="text-sm font-mono">
                    You are a professional code analyst. Please analyze the following code for potential bugs, security
                    vulnerabilities, and performance issues. Provide detailed explanations and specific recommendations
                    for improvement. Format your response in markdown with clear sections for each type of issue found.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                  <Button size="sm">Use in Chat</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Templates Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Prompt Templates</CardTitle>
                <CardDescription>Pre-built prompts for common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="code-analysis" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="code-analysis" className="text-xs">
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="generation" className="text-xs">
                      Generate
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="text-xs">
                      Docs
                    </TabsTrigger>
                  </TabsList>

                  {promptTemplates.map((category) => (
                    <TabsContent
                      key={category.category.toLowerCase().replace(" ", "-")}
                      value={category.category.toLowerCase().replace(" ", "-")}
                      className="space-y-3"
                    >
                      {category.templates.map((template, index) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <p className="text-sm">{template}</p>
                          <div className="flex gap-1 mt-2">
                            <Button variant="ghost" size="sm" className="h-6 text-xs">
                              Use
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Recent Prompts */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Prompts</CardTitle>
                <CardDescription>Your recently generated prompts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { title: "Code Review Prompt", type: "Code Analysis", time: "2 hours ago" },
                    { title: "API Documentation", type: "Documentation", time: "1 day ago" },
                    { title: "Bug Fix Request", type: "Debugging", time: "2 days ago" },
                  ].map((prompt, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg">
                      <div className="font-medium text-sm">{prompt.title}</div>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-xs">
                          {prompt.type}
                        </Badge>
                        <span className="text-xs text-slate-500">{prompt.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
