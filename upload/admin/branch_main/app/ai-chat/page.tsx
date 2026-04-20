import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Zap } from "lucide-react"
import { AIChatInterface } from "@/components/ai-chat-interface"

export default function AIChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">AI Chat Interface</h1>
            <p className="text-slate-600">Interactive chat with all your local AI models</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Bot className="h-4 w-4 mr-2" />
              Model Settings
            </Button>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              Quick Actions
            </Button>
          </div>
        </div>

        {/* Quick Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[
            { name: "Mistral", use: "Code Analysis", color: "blue" },
            { name: "DeepSeek", use: "Code Generation", color: "green" },
            { name: "Phi", use: "General Purpose", color: "purple" },
            { name: "Gemma", use: "Documentation", color: "orange" },
            { name: "TinyLlama", use: "Quick Tasks", color: "pink" },
          ].map((model) => (
            <Card key={model.name} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4 text-center">
                <div
                  className={`bg-${model.color}-100 text-${model.color}-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3`}
                >
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{model.name}</h3>
                <p className="text-sm text-slate-600">{model.use}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Chat Interface */}
        <AIChatInterface />
      </div>
    </div>
  )
}
