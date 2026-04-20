"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  FileText,
  Bold,
  Italic,
  Underline,
  List,
  Hash,
  Quote,
  Code,
  Eye,
  Edit,
  Copy,
  Trash2,
  Search,
  Plus,
  Clock,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
}

export function ProductivityNotepad() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNoteContent, setNewNoteContent] = useState("")
  const [newTag, setNewTag] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("productivity-notes")
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }))
      setNotes(parsedNotes)
    }
  }, [])

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem("productivity-notes", JSON.stringify(notes))
  }, [notes])

  const createNewNote = () => {
    if (!newNoteTitle.trim()) {
      toast({
        title: "ত্রুটি!",
        description: "নোটের শিরোনাম দিন।",
        variant: "destructive",
      })
      return
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    }

    setNotes((prev) => [newNote, ...prev])
    setSelectedNote(newNote)
    setNewNoteTitle("")
    setNewNoteContent("")
    setIsEditing(true)

    toast({
      title: "নোট তৈরি হয়েছে! ✅",
      description: `"${newNote.title}" সফলভাবে তৈরি হয়েছে।`,
    })
  }

  const updateNote = (noteId: string, updates: Partial<Note>) => {
    setNotes((prev) => prev.map((note) => (note.id === noteId ? { ...note, ...updates, updatedAt: new Date() } : note)))

    if (selectedNote?.id === noteId) {
      setSelectedNote((prev) => (prev ? { ...prev, ...updates, updatedAt: new Date() } : null))
    }
  }

  const deleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
    if (selectedNote?.id === noteId) {
      setSelectedNote(null)
    }

    toast({
      title: "নোট মুছে ফেলা হয়েছে! 🗑️",
      description: "নোট সফলভাবে মুছে ফেলা হয়েছে।",
    })
  }

  const addTag = (noteId: string) => {
    if (!newTag.trim()) return

    const note = notes.find((n) => n.id === noteId)
    if (note && !note.tags.includes(newTag)) {
      updateNote(noteId, { tags: [...note.tags, newTag] })
      setNewTag("")
    }
  }

  const removeTag = (noteId: string, tagToRemove: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (note) {
      updateNote(noteId, { tags: note.tags.filter((tag) => tag !== tagToRemove) })
    }
  }

  const insertText = (before: string, after = "") => {
    if (!textareaRef.current || !selectedNote) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    const newText = before + selectedText + after

    const newContent = textarea.value.substring(0, start) + newText + textarea.value.substring(end)

    updateNote(selectedNote.id, { content: newContent })

    // Set cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const downloadNote = (note: Note) => {
    const content = `# ${note.title}\n\n${note.content}\n\nTags: ${note.tags.join(", ")}\nCreated: ${note.createdAt.toLocaleString("bn-BD")}\nUpdated: ${note.updatedAt.toLocaleString("bn-BD")}`
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${note.title}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "নোট ডাউনলোড হয়েছে! 📥",
      description: "নোট মার্কডাউন ফরম্যাটে ডাউনলোড হয়েছে।",
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "কপি হয়েছে! 📋",
      description: "টেক্সট ক্লিপবোর্ডে কপি হয়েছে।",
    })
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const formatMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>")
      .replace(/^- (.*$)/gm, "<li>$1</li>")
      .replace(/\n/g, "<br>")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">প্রোডাক্টিভিটি নোটপ্যাড</h2>
          <p className="text-gray-600">উন্নত ফিচার সহ নোট লেখা এবং সংরক্ষণ</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
            {isEditing ? <Eye className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            {isEditing ? "প্রিভিউ" : "এডিট"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Notes List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              নোট তালিকা
            </CardTitle>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="নোট খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedNote?.id === note.id
                      ? "bg-blue-100 border-2 border-blue-300"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="font-medium text-sm truncate">{note.title}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">{note.content.substring(0, 50)}...</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1">
                      {note.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {note.updatedAt.toLocaleDateString("bn-BD")}
                    </div>
                  </div>
                </div>
              ))}

              {filteredNotes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">কোন নোট নেই</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Editor */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="create" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">নতুন নোট</TabsTrigger>
              <TabsTrigger value="edit" disabled={!selectedNote}>
                নোট এডিট করুন
              </TabsTrigger>
            </TabsList>

            {/* Create New Note */}
            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    নতুন নোট তৈরি করুন
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="নোটের শিরোনাম"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="আপনার নোট লিখুন..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="min-h-[300px]"
                  />
                  <Button onClick={createNewNote} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    নোট তৈরি করুন
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Edit Existing Note */}
            <TabsContent value="edit">
              {selectedNote ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Edit className="h-5 w-5" />
                          {selectedNote.title}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          তৈরি: {selectedNote.createdAt.toLocaleString("bn-BD")} | আপডেট:{" "}
                          {selectedNote.updatedAt.toLocaleString("bn-BD")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(selectedNote.content)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadNote(selectedNote)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteNote(selectedNote.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Title Editor */}
                    <Input
                      value={selectedNote.title}
                      onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                      className="font-medium"
                    />

                    {/* Formatting Toolbar */}
                    {isEditing && (
                      <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded">
                        <Button variant="outline" size="sm" onClick={() => insertText("**", "**")}>
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => insertText("*", "*")}>
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => insertText("__", "__")}>
                          <Underline className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => insertText("`", "`")}>
                          <Code className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => insertText("# ")}>
                          <Hash className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => insertText("- ")}>
                          <List className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => insertText("> ")}>
                          <Quote className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Content Editor/Preview */}
                    {isEditing ? (
                      <Textarea
                        ref={textareaRef}
                        value={selectedNote.content}
                        onChange={(e) => updateNote(selectedNote.id, { content: e.target.value })}
                        className="min-h-[400px] font-mono"
                        placeholder="আপনার নোট লিখুন... (মার্কডাউন সাপোর্ট করে)"
                      />
                    ) : (
                      <div
                        className="min-h-[400px] p-4 border rounded prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: formatMarkdown(selectedNote.content),
                        }}
                      />
                    )}

                    {/* Tags */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ট্যাগ</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedNote.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeTag(selectedNote.id, tag)}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="নতুন ট্যাগ"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addTag(selectedNote.id)
                            }
                          }}
                        />
                        <Button onClick={() => addTag(selectedNote.id)}>যোগ করুন</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">কোন নোট নির্বাচিত নয়</h3>
                    <p className="text-gray-500">একটি নোট নির্বাচন করুন বা নতুন তৈরি করুন</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
