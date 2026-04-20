"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Truck, Package, CheckCircle, Clock, Mail, Phone, Calendar, FileText, Send, Download } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Delivery {
  id: string
  projectName: string
  clientName: string
  clientEmail: string
  clientPhone: string
  deliveryDate: Date
  status: "preparing" | "ready" | "delivered" | "approved"
  items: DeliveryItem[]
  notes: string
  feedback: string
}

interface DeliveryItem {
  id: string
  name: string
  type: "file" | "link" | "document"
  url: string
  completed: boolean
}

export function ProjectDelivery() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([
    {
      id: "1",
      projectName: "ওয়েবসাইট ডেভেলপমেন্ট",
      clientName: "আব্দুল করিম",
      clientEmail: "karim@example.com",
      clientPhone: "০১৭১২৩৪৫৬৭৮",
      deliveryDate: new Date("2024-02-15"),
      status: "ready",
      items: [
        { id: "1", name: "ওয়েবসাইট ফাইল", type: "file", url: "", completed: true },
        { id: "2", name: "ডকুমেন্টেশন", type: "document", url: "", completed: true },
        { id: "3", name: "লাইভ লিংক", type: "link", url: "https://example.com", completed: false },
      ],
      notes: "সকল ফাইল প্রস্তুত। ক্লায়েন্টের অনুমোদনের অপেক্ষায়।",
      feedback: "",
    },
  ])

  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(deliveries[0] || null)
  const [showAddDelivery, setShowAddDelivery] = useState(false)
  const [emailTemplate, setEmailTemplate] = useState("")

  const [newDelivery, setNewDelivery] = useState({
    projectName: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    deliveryDate: new Date(),
    notes: "",
  })

  const updateDeliveryStatus = (deliveryId: string, status: Delivery["status"]) => {
    setDeliveries((prev) => prev.map((d) => (d.id === deliveryId ? { ...d, status } : d)))

    if (selectedDelivery?.id === deliveryId) {
      setSelectedDelivery((prev) => (prev ? { ...prev, status } : null))
    }

    toast({
      title: "স্ট্যাটাস আপডেট হয়েছে! ✅",
      description: `ডেলিভারি স্ট্যাটাস "${status}" এ পরিবর্তিত হয়েছে।`,
    })
  }

  const toggleItemCompletion = (itemId: string) => {
    if (!selectedDelivery) return

    const updatedItems = selectedDelivery.items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    )

    setDeliveries((prev) => prev.map((d) => (d.id === selectedDelivery.id ? { ...d, items: updatedItems } : d)))

    setSelectedDelivery((prev) => (prev ? { ...prev, items: updatedItems } : null))
  }

  const generateEmailTemplate = () => {
    if (!selectedDelivery) return

    const template = `বিষয়: ${selectedDelivery.projectName} - প্রজেক্ট ডেলিভারি

প্রিয় ${selectedDelivery.clientName},

আসসালামু আলাইকুম।

আপনার "${selectedDelivery.projectName}" প্রজেক্টটি সম্পন্ন হয়েছে এবং ডেলিভারির জন্য প্রস্তুত।

ডেলিভারি আইটেম:
${selectedDelivery.items.map((item) => `• ${item.name} ${item.completed ? "✅" : "⏳"}`).join("\n")}

অনুগ্রহ করে ফাইলগুলো চেক করে আপনার মতামত জানান।

${selectedDelivery.notes}

ধন্যবাদ।

সাদর,
[আপনার নাম]
[যোগাযোগের তথ্য]`

    setEmailTemplate(template)
  }

  const sendDeliveryEmail = () => {
    if (!selectedDelivery) return

    // This would integrate with an email service
    const mailtoLink = `mailto:${selectedDelivery.clientEmail}?subject=${encodeURIComponent(selectedDelivery.projectName + " - প্রজেক্ট ডেলিভারি")}&body=${encodeURIComponent(emailTemplate)}`
    window.open(mailtoLink)

    toast({
      title: "ইমেইল পাঠানো হচ্ছে! 📧",
      description: "ইমেইল ক্লায়েন্ট খোলা হয়েছে।",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return "bg-yellow-100 text-yellow-800"
      case "ready":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "approved":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing":
        return "প্রস্তুতি"
      case "ready":
        return "প্রস্তুত"
      case "delivered":
        return "ডেলিভার করা হয়েছে"
      case "approved":
        return "অনুমোদিত"
      default:
        return "অজানা"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">প্রজেক্ট ডেলিভারি</h2>
          <p className="text-gray-600">ক্লায়েন্ট ডেলিভারি ট্র্যাকিং এবং কমিউনিকেশন</p>
        </div>
        <Button onClick={() => setShowAddDelivery(true)} className="bg-blue-600 hover:bg-blue-700">
          <Package className="h-4 w-4 mr-2" />
          নতুন ডেলিভারি
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Delivery List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              ডেলিভারি তালিকা
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDelivery?.id === delivery.id
                      ? "bg-blue-100 border-2 border-blue-300"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedDelivery(delivery)}
                >
                  <div className="font-medium text-sm">{delivery.projectName}</div>
                  <div className="text-xs text-gray-600 mt-1">{delivery.clientName}</div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge className={getStatusColor(delivery.status)} variant="outline">
                      {getStatusText(delivery.status)}
                    </Badge>
                    <span className="text-xs text-gray-500">{delivery.deliveryDate.toLocaleDateString("bn-BD")}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedDelivery ? (
            <div className="space-y-6">
              {/* Delivery Overview */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {selectedDelivery.projectName}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">ক্লায়েন্ট: {selectedDelivery.clientName}</p>
                    </div>
                    <Badge className={getStatusColor(selectedDelivery.status)} variant="outline">
                      {getStatusText(selectedDelivery.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedDelivery.clientEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedDelivery.clientPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedDelivery.deliveryDate.toLocaleDateString("bn-BD")}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">সম্পন্ন আইটেম</span>
                      <span className="text-sm text-gray-600">
                        {selectedDelivery.items.filter((item) => item.completed).length} /{" "}
                        {selectedDelivery.items.length}
                      </span>
                    </div>
                    <Progress
                      value={
                        (selectedDelivery.items.filter((item) => item.completed).length /
                          selectedDelivery.items.length) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  {/* Status Update Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateDeliveryStatus(selectedDelivery.id, "ready")}
                      disabled={selectedDelivery.status === "ready"}
                    >
                      প্রস্তুত
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateDeliveryStatus(selectedDelivery.id, "delivered")}
                      disabled={selectedDelivery.status === "delivered"}
                    >
                      ডেলিভার করুন
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateDeliveryStatus(selectedDelivery.id, "approved")}
                      disabled={selectedDelivery.status === "approved"}
                    >
                      অনুমোদিত
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    ডেলিভারি আইটেম
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedDelivery.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleItemCompletion(item.id)}
                            className="w-4 h-4"
                          />
                          <div>
                            <div className={`font-medium ${item.completed ? "line-through text-gray-500" : ""}`}>
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.type === "file" ? "📁 ফাইল" : item.type === "link" ? "🔗 লিংক" : "📄 ডকুমেন্ট"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          {item.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Communication */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    ক্লায়েন্ট কমিউনিকেশন
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">ইমেইল টেমপ্লেট</label>
                    <Textarea
                      value={emailTemplate}
                      onChange={(e) => setEmailTemplate(e.target.value)}
                      placeholder="ইমেইল টেমপ্লেট জেনারেট করুন..."
                      className="min-h-[200px]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={generateEmailTemplate} variant="outline">
                      টেমপ্লেট জেনারেট করুন
                    </Button>
                    <Button onClick={sendDeliveryEmail} disabled={!emailTemplate}>
                      <Send className="h-4 w-4 mr-2" />
                      ইমেইল পাঠান
                    </Button>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">নোট</label>
                    <Textarea
                      value={selectedDelivery.notes}
                      onChange={(e) => {
                        const updatedDelivery = { ...selectedDelivery, notes: e.target.value }
                        setSelectedDelivery(updatedDelivery)
                        setDeliveries((prev) => prev.map((d) => (d.id === selectedDelivery.id ? updatedDelivery : d)))
                      }}
                      placeholder="প্রজেক্ট সম্পর্কে বিশেষ নোট..."
                    />
                  </div>

                  {/* Client Feedback */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">ক্লায়েন্ট ফিডব্যাক</label>
                    <Textarea
                      value={selectedDelivery.feedback}
                      onChange={(e) => {
                        const updatedDelivery = { ...selectedDelivery, feedback: e.target.value }
                        setSelectedDelivery(updatedDelivery)
                        setDeliveries((prev) => prev.map((d) => (d.id === selectedDelivery.id ? updatedDelivery : d)))
                      }}
                      placeholder="ক্লায়েন্টের ফিডব্যাক..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">কোন ডেলিভারি নির্বাচিত নয়</h3>
                <p className="text-gray-500">একটি ডেলিভারি নির্বাচন করুন</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Delivery Modal */}
      {showAddDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>নতুন ডেলিভারি তৈরি করুন</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="প্রজেক্টের নাম"
                value={newDelivery.projectName}
                onChange={(e) => setNewDelivery((prev) => ({ ...prev, projectName: e.target.value }))}
              />
              <Input
                placeholder="ক্লায়েন্টের নাম"
                value={newDelivery.clientName}
                onChange={(e) => setNewDelivery((prev) => ({ ...prev, clientName: e.target.value }))}
              />
              <Input
                placeholder="ক্লায়েন্টের ইমেইল"
                type="email"
                value={newDelivery.clientEmail}
                onChange={(e) => setNewDelivery((prev) => ({ ...prev, clientEmail: e.target.value }))}
              />
              <Input
                placeholder="ক্লায়েন্টের ফোন"
                value={newDelivery.clientPhone}
                onChange={(e) => setNewDelivery((prev) => ({ ...prev, clientPhone: e.target.value }))}
              />
              <Input
                type="date"
                value={newDelivery.deliveryDate.toISOString().split("T")[0]}
                onChange={(e) => setNewDelivery((prev) => ({ ...prev, deliveryDate: new Date(e.target.value) }))}
              />
              <Textarea
                placeholder="বিশেষ নোট"
                value={newDelivery.notes}
                onChange={(e) => setNewDelivery((prev) => ({ ...prev, notes: e.target.value }))}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddDelivery(false)}>
                  বাতিল
                </Button>
                <Button
                  onClick={() => {
                    const delivery: Delivery = {
                      id: Date.now().toString(),
                      ...newDelivery,
                      status: "preparing",
                      items: [],
                      feedback: "",
                    }
                    setDeliveries((prev) => [...prev, delivery])
                    setSelectedDelivery(delivery)
                    setNewDelivery({
                      projectName: "",
                      clientName: "",
                      clientEmail: "",
                      clientPhone: "",
                      deliveryDate: new Date(),
                      notes: "",
                    })
                    setShowAddDelivery(false)
                    toast({
                      title: "ডেলিভারি তৈরি হয়েছে! ✅",
                      description: "নতুন ডেলিভারি সফলভাবে তৈরি হয়েছে।",
                    })
                  }}
                >
                  তৈরি করুন
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
