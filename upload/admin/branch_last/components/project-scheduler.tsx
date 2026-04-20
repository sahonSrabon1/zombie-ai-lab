"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { CalendarIcon, Clock, User, CheckCircle, Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Project {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  priority: "high" | "medium" | "low"
  status: "planning" | "in-progress" | "completed" | "on-hold"
  assignee: string
  progress: number
  tasks: Task[]
}

interface Task {
  id: string
  title: string
  completed: boolean
  dueDate: Date
}

export function ProjectScheduler() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
    priority: "medium" as const,
    assignee: "",
    tasks: [] as Task[],
  })

  const addProject = () => {
    if (!formData.name.trim()) {
      toast({
        title: "ত্রুটি!",
        description: "প্রজেক্টের নাম দিন।",
        variant: "destructive",
      })
      return
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      priority: formData.priority,
      status: "planning",
      assignee: formData.assignee,
      progress: 0,
      tasks: [],
    }

    setProjects((prev) => [...prev, newProject])
    setFormData({
      name: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      priority: "medium",
      assignee: "",
      tasks: [],
    })
    setShowAddForm(false)

    toast({
      title: "প্রজেক্ট যোগ হয়েছে! ✅",
      description: `"${newProject.name}" সফলভাবে তৈরি হয়েছে।`,
    })
  }

  const updateProjectStatus = (projectId: string, status: Project["status"]) => {
    setProjects((prev) => prev.map((project) => (project.id === projectId ? { ...project, status } : project)))
  }

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId))
    toast({
      title: "প্রজেক্ট মুছে ফেলা হয়েছে! 🗑️",
      description: "প্রজেক্ট সফলভাবে মুছে ফেলা হয়েছে।",
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "in-progress":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "on-hold":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getProjectsForDate = (date: Date) => {
    return projects.filter((project) => {
      const projectStart = new Date(project.startDate)
      const projectEnd = new Date(project.endDate)
      return date >= projectStart && date <= projectEnd
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">প্রজেক্ট সময়সূচী</h2>
          <p className="text-gray-600">আপনার সকল প্রজেক্টের সময়সূচী পরিকল্পনা করুন</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          নতুন প্রজেক্ট
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              ক্যালেন্ডার
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />

            {selectedDate && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">{selectedDate.toLocaleDateString("bn-BD")} এর প্রজেক্ট</h4>
                <div className="space-y-2">
                  {getProjectsForDate(selectedDate).map((project) => (
                    <div key={project.id} className="p-2 bg-blue-50 rounded text-sm">
                      <div className="font-medium">{project.name}</div>
                      <Badge className={getStatusColor(project.status)} variant="outline">
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                  {getProjectsForDate(selectedDate).length === 0 && (
                    <p className="text-gray-500 text-sm">কোন প্রজেক্ট নেই</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project List */}
        <div className="lg:col-span-2 space-y-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {project.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-600" />
                      )}
                      {project.name}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">{project.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingProject(project)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteProject(project.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Project Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">শুরু:</span>
                      <div className="font-medium">{new Date(project.startDate).toLocaleDateString("bn-BD")}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">শেষ:</span>
                      <div className="font-medium">{new Date(project.endDate).toLocaleDateString("bn-BD")}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">দায়িত্বপ্রাপ্ত:</span>
                      <div className="font-medium flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {project.assignee || "অনির্ধারিত"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">অগ্রগতি:</span>
                      <div className="font-medium">{project.progress}%</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <Progress value={project.progress} className="h-2" />

                  {/* Badges */}
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(project.priority)} variant="outline">
                      {project.priority === "high" ? "উচ্চ" : project.priority === "medium" ? "মধ্যম" : "নিম্ন"} অগ্রাধিকার
                    </Badge>
                    <Badge className={getStatusColor(project.status)} variant="outline">
                      {project.status === "planning"
                        ? "পরিকল্পনা"
                        : project.status === "in-progress"
                          ? "চলমান"
                          : project.status === "completed"
                            ? "সম্পন্ন"
                            : "স্থগিত"}
                    </Badge>
                  </div>

                  {/* Status Update Buttons */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => updateProjectStatus(project.id, "in-progress")}>
                      শুরু করুন
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => updateProjectStatus(project.id, "completed")}>
                      সম্পন্ন
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => updateProjectStatus(project.id, "on-hold")}>
                      স্থগিত
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {projects.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">কোন প্রজেক্ট নেই</h3>
                <p className="text-gray-500 mb-4">আপনার প্রথম প্রজেক্ট তৈরি করুন</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  প্রজেক্ট যোগ করুন
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Project Form */}
      {showAddForm && (
        <Card className="fixed inset-0 z-50 m-4 max-w-2xl mx-auto my-8 max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <CardTitle>নতুন প্রজেক্ট তৈরি করুন</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="প্রজেক্টের নাম"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />

            <Textarea
              placeholder="প্রজেক্টের বিবরণ"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">শুরুর তারিখ</label>
                <Input
                  type="date"
                  value={formData.startDate.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: new Date(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">শেষের তারিখ</label>
                <Input
                  type="date"
                  value={formData.endDate.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: new Date(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">অগ্রাধিকার</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">উচ্চ</SelectItem>
                    <SelectItem value="medium">মধ্যম</SelectItem>
                    <SelectItem value="low">নিম্ন</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">দায়িত্বপ্রাপ্ত</label>
                <Input
                  placeholder="নাম"
                  value={formData.assignee}
                  onChange={(e) => setFormData((prev) => ({ ...prev, assignee: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                বাতিল
              </Button>
              <Button onClick={addProject}>প্রজেক্ট তৈরি করুন</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
