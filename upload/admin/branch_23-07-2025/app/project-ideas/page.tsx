import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lightbulb, Star, Code, Globe, Smartphone, Database } from "lucide-react"

export default function ProjectIdeasPage() {
  const projectIdeas = [
    {
      id: 1,
      title: "AI-Powered Code Review Assistant",
      description:
        "Build a tool that automatically reviews pull requests and suggests improvements using local AI models.",
      difficulty: "Intermediate",
      category: "Development Tools",
      technologies: ["Python", "Git API", "AI Models"],
      estimatedTime: "2-3 weeks",
      icon: Code,
      featured: true,
    },
    {
      id: 2,
      title: "Smart Documentation Generator",
      description: "Create a system that automatically generates comprehensive documentation from codebases.",
      difficulty: "Advanced",
      category: "Documentation",
      technologies: ["Node.js", "AST Parsing", "Markdown"],
      estimatedTime: "3-4 weeks",
      icon: Globe,
      featured: false,
    },
    {
      id: 3,
      title: "Voice-Controlled Development Environment",
      description: "Integrate ElevenLabs voice processing with your IDE for hands-free coding assistance.",
      difficulty: "Advanced",
      category: "Voice Integration",
      technologies: ["ElevenLabs API", "VS Code Extension", "Speech Recognition"],
      estimatedTime: "4-5 weeks",
      icon: Smartphone,
      featured: true,
    },
    {
      id: 4,
      title: "Database Query Optimizer",
      description: "Use AI to analyze and optimize SQL queries for better performance.",
      difficulty: "Intermediate",
      category: "Database Tools",
      technologies: ["SQL", "Performance Analysis", "AI Models"],
      estimatedTime: "2-3 weeks",
      icon: Database,
      featured: false,
    },
    {
      id: 5,
      title: "Automated Testing Suite Generator",
      description: "Generate comprehensive test suites automatically based on code analysis.",
      difficulty: "Advanced",
      category: "Testing",
      technologies: ["Jest", "Code Analysis", "Test Generation"],
      estimatedTime: "3-4 weeks",
      icon: Code,
      featured: false,
    },
    {
      id: 6,
      title: "AI Chat Bot for Customer Support",
      description: "Build a customer support chatbot using your local AI models.",
      difficulty: "Beginner",
      category: "Customer Service",
      technologies: ["React", "WebSocket", "AI Models"],
      estimatedTime: "1-2 weeks",
      icon: Globe,
      featured: true,
    },
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Project Ideas</h1>
            <p className="text-slate-600">AI-powered project suggestions and development inspiration</p>
          </div>
          <Button>
            <Lightbulb className="h-4 w-4 mr-2" />
            Generate New Ideas
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input placeholder="Search projects..." className="w-full" />
              </div>
              <div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development Tools</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="voice">Voice Integration</SelectItem>
                    <SelectItem value="database">Database Tools</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Time Estimate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1-2 weeks</SelectItem>
                    <SelectItem value="2-3">2-3 weeks</SelectItem>
                    <SelectItem value="3-4">3-4 weeks</SelectItem>
                    <SelectItem value="4+">4+ weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Projects */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectIdeas
              .filter((project) => project.featured)
              .map((project) => {
                const IconComponent = project.icon
                return (
                  <Card key={project.id} className="border-2 border-blue-200 bg-blue-50/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-800 rounded-full w-10 h-10 flex items-center justify-center">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        </div>
                        <Badge className={getDifficultyColor(project.difficulty)}>{project.difficulty}</Badge>
                      </div>
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium text-slate-700 mb-2">Technologies:</div>
                          <div className="flex flex-wrap gap-1">
                            {project.technologies.map((tech) => (
                              <Badge key={tech} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Est. {project.estimatedTime}</span>
                          <Button size="sm">Start Project</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </div>

        {/* All Projects */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">All Project Ideas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectIdeas.map((project) => {
              const IconComponent = project.icon
              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="bg-slate-100 text-slate-800 rounded-full w-10 h-10 flex items-center justify-center">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <Badge className={getDifficultyColor(project.difficulty)}>{project.difficulty}</Badge>
                    </div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-2">Technologies:</div>
                        <div className="flex flex-wrap gap-1">
                          {project.technologies.map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Est. {project.estimatedTime}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                          <Button size="sm">Start</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
