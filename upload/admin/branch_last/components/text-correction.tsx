"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertCircle, Copy, Download, RefreshCw, FileText, Zap, BookOpen, Languages } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Correction {
  type: "spelling" | "grammar" | "style" | "punctuation"
  original: string
  suggestion: string
  position: number
  reason: string
}

export function TextCorrection() {
  const [inputText, setInputText] = useState("")
  const [correctedText, setCorrectedText] = useState("")
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")

  // Common Bengali spelling mistakes and corrections
  const bengaliCorrections = [
    { wrong: "আমি", correct: "আমি", type: "spelling" },
    { wrong: "তুমি", correct: "তুমি", type: "spelling" },
    { wrong: "সে", correct: "সে", type: "spelling" },
    { wrong: "আমরা", correct: "আমরা", type: "spelling" },
    { wrong: "তোমরা", correct: "তোমরা", type: "spelling" },
    { wrong: "তারা", correct: "তারা", type: "spelling" },
    // Add more corrections as needed
  ]

  // Common English spelling mistakes and corrections
  const englishCorrections = [
    { wrong: "recieve", correct: "receive", type: "spelling" },
    { wrong: "seperate", correct: "separate", type: "spelling" },
    { wrong: "definately", correct: "definitely", type: "spelling" },
    { wrong: "occured", correct: "occurred", type: "spelling" },
    { wrong: "begining", correct: "beginning", type: "spelling" },
    { wrong: "accomodate", correct: "accommodate", type: "spelling" },
    { wrong: "neccessary", correct: "necessary", type: "spelling" },
    { wrong: "embarass", correct: "embarrass", type: "spelling" },
    { wrong: "maintainance", correct: "maintenance", type: "spelling" },
    { wrong: "existance", correct: "existence", type: "spelling" },
  ]

  const processText = async () => {
    if (!inputText.trim()) {
      toast({
        title: "ত্রুটি!",
        description: "টেক্সট লিখুন।",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    let processedText = inputText
    const foundCorrections: Correction[] = []

    // Check for spelling mistakes
    const allCorrections = [...bengaliCorrections, ...englishCorrections]

    allCorrections.forEach((correction) => {
      const regex = new RegExp(`\\b${correction.wrong}\\b`, "gi")
      const matches = [...inputText.matchAll(regex)]

      matches.forEach((match) => {
        if (match.index !== undefined) {
          foundCorrections.push({
            type: correction.type as any,
            original: match[0],
            suggestion: correction.correct,
            position: match.index,
            reason: `"${correction.wrong}" এর সঠিক বানান "${correction.correct}"`,
          })

          processedText = processedText.replace(match[0], correction.correct)
        }
      })
    })

    // Check for basic grammar issues
    const grammarChecks = [
      {
        pattern: /\s+/g,
        replacement: " ",
        reason: "অতিরিক্ত স্পেস সরানো হয়েছে",
      },
      {
        pattern: /\.{2,}/g,
        replacement: "...",
        reason: "একাধিক ডট সংশোধন করা হয়েছে",
      },
      {
        pattern: /\?{2,}/g,
        replacement: "?",
        reason: "একাধিক প্রশ্নবোধক চিহ্ন সংশোধন করা হয়েছে",
      },
      {
        pattern: /!{2,}/g,
        replacement: "!",
        reason: "একাধিক বিস্ময়বোধক চিহ্ন সংশোধন করা হয়েছে",
      },
    ]

    grammarChecks.forEach((check) => {
      const matches = [...processedText.matchAll(check.pattern)]
      matches.forEach((match) => {
        if (match.index !== undefined && match[0] !== check.replacement) {
          foundCorrections.push({
            type: "punctuation",
            original: match[0],
            suggestion: check.replacement,
            position: match.index,
            reason: check.reason,
          })
        }
      })
      processedText = processedText.replace(check.pattern, check.replacement)
    })

    // Check for style improvements
    if (processedText.length > 0) {
      // Capitalize first letter if not already
      if (processedText[0] !== processedText[0].toUpperCase()) {
        foundCorrections.push({
          type: "style",
          original: processedText[0],
          suggestion: processedText[0].toUpperCase(),
          position: 0,
          reason: "বাক্যের শুরুতে বড় হাতের অক্ষর ব্যবহার করুন",
        })
        processedText = processedText[0].toUpperCase() + processedText.slice(1)
      }
    }

    setCorrections(foundCorrections)
    setCorrectedText(processedText)
    setIsProcessing(false)
    setActiveTab("results")

    toast({
      title: "টেক্সট সংশোধন সম্পন্ন! ✅",
      description: `${foundCorrections.length}টি সংশোধন পাওয়া গেছে।`,
    })
  }

  const applySuggestion = (index: number) => {
    const correction = corrections[index]
    const newText = correctedText.replace(correction.original, correction.suggestion)
    setCorrectedText(newText)

    // Remove the applied correction
    setCorrections((prev) => prev.filter((_, i) => i !== index))

    toast({
      title: "সংশোধন প্রয়োগ করা হয়েছে! ✅",
      description: `"${correction.original}" কে "${correction.suggestion}" দিয়ে প্রতিস্থাপন করা হয়েছে।`,
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "কপি হয়েছে! 📋",
      description: "টেক্সট ক্লিপবোর্ডে কপি হয়েছে।",
    })
  }

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "ডাউনলোড হয়েছে! 📥",
      description: "টেক্সট ফাইল ডাউনলোড হয়েছে।",
    })
  }

  const resetEditor = () => {
    setInputText("")
    setCorrectedText("")
    setCorrections([])
    setActiveTab("editor")
  }

  const getCorrectionTypeColor = (type: string) => {
    switch (type) {
      case "spelling":
        return "bg-red-100 text-red-800"
      case "grammar":
        return "bg-orange-100 text-orange-800"
      case "style":
        return "bg-blue-100 text-blue-800"
      case "punctuation":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCorrectionTypeText = (type: string) => {
    switch (type) {
      case "spelling":
        return "বানান"
      case "grammar":
        return "ব্যাকরণ"
      case "style":
        return "স্টাইল"
      case "punctuation":
        return "যতিচিহ্ন"
      default:
        return "অন্যান্য"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">টেক্সট সংশোধন</h2>
          <p className="text-gray-600">স্বয়ংক্রিয় বানান, ব্যাকরণ এবং স্টাইল সংশোধন</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetEditor} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            রিসেট
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inputText.length}</div>
            <div className="text-sm text-gray-600">অক্ষর</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{inputText.split(/\s+/).filter((w) => w).length}</div>
            <div className="text-sm text-gray-600">শব্দ</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{corrections.length}</div>
            <div className="text-sm text-gray-600">সংশোধন</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {inputText.split(/[.!?]+/).filter((s) => s.trim()).length}
            </div>
            <div className="text-sm text-gray-600">বাক্য</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            এডিটর
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            ফলাফল
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            পরামর্শ
          </TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                টেক্সট এডিটর
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="এখানে আপনার টেক্সট লিখুন... (বাংলা এবং ইংরেজি উভয় ভাষা সাপোর্ট করে)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[300px]"
              />

              <div className="flex gap-2">
                <Button onClick={processText} disabled={isProcessing || !inputText.trim()} className="flex-1">
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      প্রক্রিয়াকরণ...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      টেক্সট সংশোধন করুন
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={() => copyToClipboard(inputText)} disabled={!inputText.trim()}>
                  <Copy className="h-4 w-4 mr-2" />
                  কপি
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Text */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  মূল টেক্সট
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded border min-h-[300px] whitespace-pre-wrap">
                  {inputText || "কোন টেক্সট নেই"}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(inputText)} disabled={!inputText}>
                    <Copy className="h-4 w-4 mr-2" />
                    কপি
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadText(inputText, "original-text.txt")}
                    disabled={!inputText}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ডাউনলোড
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Corrected Text */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  সংশোধিত টেক্সট
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-green-50 rounded border min-h-[300px] whitespace-pre-wrap">
                  {correctedText || "এখনো কোন সংশোধন করা হয়নি"}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(correctedText)}
                    disabled={!correctedText}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    কপি
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadText(correctedText, "corrected-text.txt")}
                    disabled={!correctedText}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ডাউনলোড
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                সংশোধনের পরামর্শ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {corrections.length > 0 ? (
                <div className="space-y-4">
                  {corrections.map((correction, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getCorrectionTypeColor(correction.type)} variant="outline">
                            {getCorrectionTypeText(correction.type)}
                          </Badge>
                          <span className="text-sm text-gray-500">অবস্থান: {correction.position}</span>
                        </div>
                        <Button size="sm" onClick={() => applySuggestion(index)}>
                          প্রয়োগ করুন
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">ভুল:</span>
                          <code className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                            {correction.original}
                          </code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">সঠিক:</span>
                          <code className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            {correction.suggestion}
                          </code>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">কারণ:</span> {correction.reason}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">কোন সংশোধন পাওয়া যায়নি</h3>
                  <p>আপনার টেক্সট ইতিমধ্যে সঠিক অথবা এখনো কোন টেক্সট প্রক্রিয়া করা হয়নি।</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            টিপস এবং পরামর্শ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Languages className="h-4 w-4" />
                ভাষা সাপোর্ট
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• বাংলা এবং ইংরেজি উভয় ভাষা সাপোর্ট করে</li>
                <li>• মিশ্র ভাষার টেক্সট সংশোধন করতে পারে</li>
                <li>• ইউনিকোড সাপোর্ট সহ</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                ফিচার
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• বানান সংশোধন</li>
                <li>• ব্যাকরণ পরীক্ষা</li>
                <li>• যতিচিহ্ন সংশোধন</li>
                <li>• স্টাইল উন্নতি</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
