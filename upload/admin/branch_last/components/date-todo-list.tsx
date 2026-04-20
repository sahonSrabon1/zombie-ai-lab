"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { CheckSquare, Plus, Clock, AlertCircle, Star, CalendarIcon, Trash2, Edit } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Todo {
  id: string
  title: string
  description: string
  completed: boolean
  priority: "high" | "medium" | "low"
  category: string
  dueDate: Date
  createdAt: Date
}

export function DateTodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [showAddTodo, setShowAddTodo] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all")
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all")

  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    category: "",
    dueDate: new Date(),
  })

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem("productivity-todos")
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos).map((todo: any) => ({
        ...todo,
        dueDate: new Date(todo.dueDate),
        createdAt: new Date(todo.createdAt),
      }))
      setTodos(parsedTodos)
    }
  }, [])

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem("productivity-todos", JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (!newTodo.title.trim()) {
      toast({
        title: "ত্রুটি!",
        description: "কাজের নাম দিন।",
        variant: "destructive",
      })
      return
    }

    const todo: Todo = {
      id: Date.now().toString(),
      title: newTodo.title,
      description: newTodo.description,
      completed: false,
      priority: newTodo.priority,
      category: newTodo.category || "সাধারণ",
      dueDate: newTodo.dueDate,
      createdAt: new Date(),
    }

    setTodos((prev) => [...prev, todo])
    setNewTodo({
      title: "",
      description: "",
      priority: "medium",
      category: "",
      dueDate: new Date(),
    })
    setShowAddTodo(false)

    toast({
      title: "কাজ যোগ হয়েছে! ✅",
      description: `"${todo.title}" তালিকায় যোগ হয়েছে।`,
    })
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))

    const todo = todos.find((t) => t.id === id)
    if (todo) {
      toast({
        title: todo.completed ? "কাজ অসম্পন্ন করা হয়েছে" : "কাজ সম্পন্ন! 🎉",
        description: `"${todo.title}" ${todo.completed ? "অসম্পন্ন" : "সম্পন্ন"} করা হয়েছে।`,
      })
    }
  }

  const deleteTodo = (id: string) => {
    const todo = todos.find((t) => t.id === id)
    setTodos((prev) => prev.filter((todo) => todo.id !== id))

    if (todo) {
      toast({
        title: "কাজ মুছে ফেলা হয়েছে! 🗑️",
        description: `"${todo.title}" তালিকা থেকে মুছে ফেলা হয়েছে।`,
      })
    }
  }

  const updateTodo = (updatedTodo: Todo) => {
    setTodos((prev) => prev.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo)))
    setEditingTodo(null)

    toast({
      title: "কাজ আপডেট হয়েছে! ✅",
      description: `"${updatedTodo.title}" সফলভাবে আপডেট হয়েছে।`,
    })
  }

  const getTodosForDate = (date: Date) => {
    return todos.filter((todo) => {
      const todoDate = new Date(todo.dueDate)
      return todoDate.toDateString() === date.toDateString()
    })
  }

  const getFilteredTodos = (todosToFilter: Todo[]) => {
    let filtered = todosToFilter

    // Status filter
    if (filter === "pending") {
      filtered = filtered.filter((todo) => !todo.completed)
    } else if (filter === "completed") {
      filtered = filtered.filter((todo) => todo.completed)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((todo) => todo.priority === priorityFilter)
    }

    return filtered.sort((a, b) => {
      // Sort by priority first, then by due date
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "উচ্চ"
      case "medium":
        return "মধ্যম"
      case "low":
        return "নিম্ন"
      default:
        return "অজানা"
    }
  }

  const isOverdue = (dueDate: Date) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  const todayTodos = selectedDate ? getTodosForDate(selectedDate) : []
  const filteredTodos = getFilteredTodos(todayTodos)

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    pending: todos.filter((t) => !t.completed).length,
    overdue: todos.filter((t) => !t.completed && isOverdue(t.dueDate)).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">আজকের কাজের তালিকা</h2>
          <p className="text-gray-600">দৈনিক কাজের পরিকল্পনা এবং ট্র্যাকিং</p>
        </div>
        <Button onClick={() => setShowAddTodo(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          নতুন কাজ
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">মোট কাজ</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">সম্পন্ন</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">বাকি</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-gray-600">সময় শেষ</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                <h4 className="font-semibold mb-2">{selectedDate.toLocaleDateString("bn-BD")} এর কাজ</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>মোট:</span>
                    <Badge variant="outline">{todayTodos.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>সম্পন্ন:</span>
                    <Badge className="bg-green-100 text-green-800" variant="outline">
                      {todayTodos.filter((t) => t.completed).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>বাকি:</span>
                    <Badge className="bg-orange-100 text-orange-800" variant="outline">
                      {todayTodos.filter((t) => !t.completed).length}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Todo List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  {selectedDate?.toLocaleDateString("bn-BD")} এর কাজসমূহ
                </CardTitle>

                {/* Filters */}
                <div className="flex gap-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">সব কাজ</option>
                    <option value="pending">বাকি কাজ</option>
                    <option value="completed">সম্পন্ন কাজ</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">সব অগ্রাধিকার</option>
                    <option value="high">উচ্চ</option>
                    <option value="medium">মধ্যম</option>
                    <option value="low">নিম্ন</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`p-4 border rounded-lg transition-all ${
                      todo.completed ? "bg-gray-50 opacity-75" : "bg-white"
                    } ${isOverdue(todo.dueDate) && !todo.completed ? "border-red-200 bg-red-50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                        className="w-5 h-5 mt-1"
                      />

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className={`font-medium ${todo.completed ? "line-through text-gray-500" : ""}`}>
                              {todo.title}
                            </h4>
                            {todo.description && (
                              <p className={`text-sm mt-1 ${todo.completed ? "text-gray-400" : "text-gray-600"}`}>
                                {todo.description}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingTodo(todo)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deleteTodo(todo.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={getPriorityColor(todo.priority)} variant="outline">
                            {todo.priority === "high" && <Star className="h-3 w-3 mr-1" />}
                            {getPriorityText(todo.priority)}
                          </Badge>

                          <Badge variant="outline" className="bg-blue-50 text-blue-800">
                            {todo.category}
                          </Badge>

                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {todo.dueDate.toLocaleDateString("bn-BD")}
                          </div>

                          {isOverdue(todo.dueDate) && !todo.completed && (
                            <Badge className="bg-red-100 text-red-800" variant="outline">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              সময় শেষ
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTodos.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">কোন কাজ নেই</h3>
                    <p className="mb-4">
                      {selectedDate?.toDateString() === new Date().toDateString()
                        ? "আজকের জন্য কোন কাজ নেই"
                        : "এই দিনের জন্য কোন কাজ নেই"}
                    </p>
                    <Button onClick={() => setShowAddTodo(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      প্রথম কাজ যোগ করুন
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Todo Modal */}
      {showAddTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>নতুন কাজ যোগ করুন</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="কাজের নাম"
                value={newTodo.title}
                onChange={(e) => setNewTodo((prev) => ({ ...prev, title: e.target.value }))}
              />

              <Textarea
                placeholder="কাজের বিবরণ (ঐচ্ছিক)"
                value={newTodo.description}
                onChange={(e) => setNewTodo((prev) => ({ ...prev, description: e.target.value }))}
              />

              <Input
                placeholder="ক্যাটেগরি (যেমন: কাজ, ব্যক্তিগত, পড়াশোনা)"
                value={newTodo.category}
                onChange={(e) => setNewTodo((prev) => ({ ...prev, category: e.target.value }))}
              />

              <select
                value={newTodo.priority}
                onChange={(e) => setNewTodo((prev) => ({ ...prev, priority: e.target.value as any }))}
                className="w-full p-2 border rounded"
              >
                <option value="low">নিম্ন অগ্রাধিকার</option>
                <option value="medium">মধ্যম অগ্রাধিকার</option>
                <option value="high">উচ্চ অগ্রাধিকার</option>
              </select>

              <Input
                type="date"
                value={newTodo.dueDate.toISOString().split("T")[0]}
                onChange={(e) => setNewTodo((prev) => ({ ...prev, dueDate: new Date(e.target.value) }))}
              />

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddTodo(false)}>
                  বাতিল
                </Button>
                <Button onClick={addTodo}>যোগ করুন</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Todo Modal */}
      {editingTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>কাজ সম্পাদনা করুন</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="কাজের নাম"
                value={editingTodo.title}
                onChange={(e) => setEditingTodo((prev) => (prev ? { ...prev, title: e.target.value } : null))}
              />

              <Textarea
                placeholder="কাজের বিবরণ"
                value={editingTodo.description}
                onChange={(e) => setEditingTodo((prev) => (prev ? { ...prev, description: e.target.value } : null))}
              />

              <Input
                placeholder="ক্যাটেগরি"
                value={editingTodo.category}
                onChange={(e) => setEditingTodo((prev) => (prev ? { ...prev, category: e.target.value } : null))}
              />

              <select
                value={editingTodo.priority}
                onChange={(e) => setEditingTodo((prev) => (prev ? { ...prev, priority: e.target.value as any } : null))}
                className="w-full p-2 border rounded"
              >
                <option value="low">নিম্ন অগ্রাধিকার</option>
                <option value="medium">মধ্যম অগ্রাধিকার</option>
                <option value="high">উচ্চ অগ্রাধিকার</option>
              </select>

              <Input
                type="date"
                value={editingTodo.dueDate.toISOString().split("T")[0]}
                onChange={(e) =>
                  setEditingTodo((prev) => (prev ? { ...prev, dueDate: new Date(e.target.value) } : null))
                }
              />

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingTodo(null)}>
                  বাতিল
                </Button>
                <Button onClick={() => editingTodo && updateTodo(editingTodo)}>আপডেট করুন</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
