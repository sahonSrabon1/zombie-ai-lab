"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderOpen, Plus, CheckSquare, User, Calendar, BarChart3 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Project {
  id: string
  name: string
  description: string
  status: "active" | "completed" | "paused"
  progress: number
  startDate: Date
  endDate: Date
  team: string[]
  tasks: Task[]
  budget: number
  spent: number
}

interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed"
  assignee: string
  dueDate: Date
  priority: "high" | "medium" | "low"
}

export function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "ওয়েবসাইট ডেভেলপমেন্ট",
      description: "কোম্পানির নতুন ওয়েবসাইট তৈরি",
      status: "active",
      progress: 65,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-03-01"),
      team: ["আহমেদ", "ফাতিমা", "করিম"],
      tasks: [],
      budget: 50000,
      spent: 32000,
    },
  ])

  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] || null)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    budget: 0,
    endDate: new Date(),
    team: "",
  })

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: new Date(),
    priority: "medium" as const,
  })

  const addProject = () => {
    if (!newProject.name.trim()) {
      toast({
        title: "ত্রুটি!",
        description: "প্রজেক্টের নাম দিন।",
        variant: "destructive",
      })
      return
    }

    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name,
      description: newProject.description,
      status: "active",
      progress: 0,
      startDate: new Date(),
      endDate: newProject.endDate,
      team: newProject.team
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t),
      tasks: [],
      budget: newProject.budget,
      spent: 0,
    }

    setProjects((prev) => [...prev, project])
    setSelectedProject(project)
    setNewProject({ name: "", description: "", budget: 0, endDate: new Date(), team: "" })
    setShowAddProject(false)

    toast({
      title: "প্রজেক্ট তৈরি হয়েছে! ✅",
      description: `"${project.name}" সফলভাবে তৈরি হয়েছে।`,
    })
  }

  const addTask = () => {
    if (!selectedProject || !newTask.title.trim()) {
      toast({
        title: "ত্রুটি!",
        description: "কাজের নাম দিন।",
        variant: "destructive",
      })
      return
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      status: "todo",
      assignee: newTask.assignee,
      dueDate: newTask.dueDate,
      priority: newTask.priority,
    }

    setProjects((prev) => prev.map((p) => (p.id === selectedProject.id ? { ...p, tasks: [...p.tasks, task] } : p)))

    setSelectedProject((prev) => (prev ? { ...prev, tasks: [...prev.tasks, task] } : null))
    setNewTask({ title: "", description: "", assignee: "", dueDate: new Date(), priority: "medium" })
    setShowAddTask(false)

    toast({
      title: "কাজ যোগ হয়েছে! ✅",
      description: `"${task.title}" সফলভাবে যোগ হয়েছে।`,
    })
  }

  const updateTaskStatus = (taskId: string, status: Task["status"]) => {
    if (!selectedProject) return

    setProjects((prev) =>
      prev.map((p) =>
        p.id === selectedProject.id
          ? {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
            }
          : p,
      ),
    )

    setSelectedProject((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
          }
        : null,
    )

    // Update project progress
    const updatedTasks = selectedProject.tasks.map((t) => (t.id === taskId ? { ...t, status } : t))
    const completedTasks = updatedTasks.filter((t) => t.status === "completed").length
    const progress = updatedTasks.length > 0 ? (completedTasks / updatedTasks.length) * 100 : 0

    setProjects((prev) => prev.map((p) => (p.id === selectedProject.id ? { ...p, progress } : p)))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "todo":
        return "bg-gray-100 text-gray-800"
      case "in-progress":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">প্রজেক্ট ম্যানেজমেন্ট</h2>
          <p className="text-gray-600">সম্পূর্ণ প্রজেক্ট ব্যবস্থাপনা এবং ট্র্যাকিং</p>
        </div>
        <Button onClick={() => setShowAddProject(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          নতুন প্রজেক্ট
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Project List Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              প্রজেক্ট তালিকা
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedProject?.id === project.id
                      ? "bg-blue-100 border-2 border-blue-300"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="font-medium text-sm">{project.name}</div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge className={getStatusColor(project.status)} variant="outline">
                      {project.status === "active" ? "সক্রিয়" : project.status === "completed" ? "সম্পন্ন" : "স্থগিত"}
                    </Badge>
                    <span className="text-xs text-gray-500">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1 mt-2" />
                </div>
              ))}

              {projects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">কোন প্রজেক্ট নেই</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedProject ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">সংক্ষিপ্ত</TabsTrigger>
                <TabsTrigger value="tasks">কাজসমূহ</TabsTrigger>
                <TabsTrigger value="team">টিম</TabsTrigger>
                <TabsTrigger value="budget">বাজেট</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedProject.name}</CardTitle>
                      <p className="text-gray-600">{selectedProject.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{selectedProject.progress}%</div>
                          <div className="text-sm text-gray-500">সম্পন্ন</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{selectedProject.tasks.length}</div>
                          <div className="text-sm text-gray-500">মোট কাজ</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{selectedProject.team.length}</div>
                          <div className="text-sm text-gray-500">টিম সদস্য</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.ceil(
                              (selectedProject.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                            )}
                          </div>
                          <div className="text-sm text-gray-500">দিন বাকি</div>
                        </div>
                      </div>

                      <Progress value={selectedProject.progress} className="h-3 mb-4" />

                      <div className="flex gap-2">
                        <Badge className={getStatusColor(selectedProject.status)} variant="outline">
                          {selectedProject.status === "active"
                            ? "সক্রিয়"
                            : selectedProject.status === "completed"
                              ? "সম্পন্ন"
                              : "স্থগিত"}
                        </Badge>
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          {selectedProject.endDate.toLocaleDateString("bn-BD")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Tasks */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        সাম্প্রতিক কাজ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedProject.tasks.slice(0, 5).map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium text-sm">{task.title}</div>
                              <div className="text-xs text-gray-500">{task.assignee}</div>
                            </div>
                            <Badge className={getStatusColor(task.status)} variant="outline">
                              {task.status === "todo" ? "করতে হবে" : task.status === "in-progress" ? "চলমান" : "সম্পন্ন"}
                            </Badge>
                          </div>
                        ))}
                        {selectedProject.tasks.length === 0 && (
                          <p className="text-gray-500 text-center py-4">কোন কাজ নেই</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        কাজের তালিকা
                      </CardTitle>
                      <Button onClick={() => setShowAddTask(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        নতুন কাজ
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedProject.tasks.map((task) => (
                        <div key={task.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{task.title}</h4>
                              <p className="text-sm text-gray-600">{task.description}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getPriorityColor(task.priority)} variant="outline">
                                {task.priority === "high" ? "উচ্চ" : task.priority === "medium" ? "মধ্যম" : "নিম্ন"}
                              </Badge>
                              <Badge className={getStatusColor(task.status)} variant="outline">
                                {task.status === "todo" ? "করতে হবে" : task.status === "in-progress" ? "চলমান" : "সম্পন্ন"}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assignee || "অনির্ধারিত"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {task.dueDate.toLocaleDateString("bn-BD")}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, "in-progress")}
                              disabled={task.status === "in-progress"}
                            >
                              শুরু করুন
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, "completed")}
                              disabled={task.status === "completed"}
                            >
                              সম্পন্ন
                            </Button>
                          </div>
                        </div>
                      ))}

                      {selectedProject.tasks.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>কোন কাজ নেই</p>
                          <Button onClick={() => setShowAddTask(true)} className="mt-2">
                            প্রথম কাজ যোগ করুন
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      টিম সদস্য
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedProject.team.map((member, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{member}</div>
                              <div className="text-sm text-gray-500">টিম সদস্য</div>
                            </div>
                          </div>
                          <div className="mt-3 text-sm">
                            <div className="flex justify-between">
                              <span>কাজ:</span>
                              <span>{selectedProject.tasks.filter((t) => t.assignee === member).length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>সম্পন্ন:</span>
                              <span>
                                {
                                  selectedProject.tasks.filter((t) => t.assignee === member && t.status === "completed")
                                    .length
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {selectedProject.team.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>কোন টিম সদস্য নেই</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Budget Tab */}
              <TabsContent value="budget">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      বাজেট ট্র্যাকিং
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            ৳{selectedProject.budget.toLocaleString("bn-BD")}
                          </div>
                          <div className="text-sm text-gray-600">মোট বাজেট</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            ৳{selectedProject.spent.toLocaleString("bn-BD")}
                          </div>
                          <div className="text-sm text-gray-600">খরচ হয়েছে</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            ৳{(selectedProject.budget - selectedProject.spent).toLocaleString("bn-BD")}
                          </div>
                          <div className="text-sm text-gray-600">বাকি আছে</div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span>বাজেট ব্যবহার</span>
                          <span>{Math.round((selectedProject.spent / selectedProject.budget) * 100)}%</span>
                        </div>
                        <Progress value={(selectedProject.spent / selectedProject.budget) * 100} className="h-3" />
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">খরচের বিবরণ</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>ডেভেলপমেন্ট</span>
                            <span>৳২০,০০০</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>ডিজাইন</span>
                            <span>৳৮,০০০</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>টেস্টিং</span>
                            <span>৳৪,০০০</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">কোন প্রজেক্ট নির্বাচিত নয়</h3>
                <p className="text-gray-500 mb-4">একটি প্রজেক্ট নির্বাচন করুন বা নতুন তৈরি করুন</p>
                <Button onClick={() => setShowAddProject(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  নতুন প্রজেক্ট তৈরি করুন
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>নতুন প্রজেক্ট তৈরি করুন</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="প্রজেক্টের নাম"
                value={newProject.name}
                onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Textarea
                placeholder="প্রজেক্টের বিবরণ"
                value={newProject.description}
                onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="বাজেট (টাকা)"
                value={newProject.budget || ""}
                onChange={(e) => setNewProject((prev) => ({ ...prev, budget: Number(e.target.value) }))}
              />
              <Input
                type="date"
                value={newProject.endDate.toISOString().split("T")[0]}
                onChange={(e) => setNewProject((prev) => ({ ...prev, endDate: new Date(e.target.value) }))}
              />
              <Input
                placeholder="টিম সদস্য (কমা দিয়ে আলাদা করুন)"
                value={newProject.team}
                onChange={(e) => setNewProject((prev) => ({ ...prev, team: e.target.value }))}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddProject(false)}>
                  বাতিল
                </Button>
                <Button onClick={addProject}>তৈরি করুন</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>নতুন কাজ যোগ করুন</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="কাজের নাম"
                value={newTask.title}
                onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="কাজের বিবরণ"
                value={newTask.description}
                onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
              />
              <Input
                placeholder="দায়িত্বপ্রাপ্ত ব্যক্তি"
                value={newTask.assignee}
                onChange={(e) => setNewTask((prev) => ({ ...prev, assignee: e.target.value }))}
              />
              <Input
                type="date"
                value={newTask.dueDate.toISOString().split("T")[0]}
                onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: new Date(e.target.value) }))}
              />
              <select
                className="w-full p-2 border rounded"
                value={newTask.priority}
                onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value as any }))}
              >
                <option value="low">নিম্ন অগ্রাধিকার</option>
                <option value="medium">মধ্যম অগ্রাধিকার</option>
                <option value="high">উচ্চ অগ্রাধিকার</option>
              </select>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddTask(false)}>
                  বাতিল
                </Button>
                <Button onClick={addTask}>যোগ করুন</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
