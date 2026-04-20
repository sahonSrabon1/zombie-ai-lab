"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectManager } from "@/components/project-manager"
import { FolderOpen } from "lucide-react"

export default function AdminProjectsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FolderOpen className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">প্রজেক্ট ম্যানেজমেন্ট</h1>
          <p className="text-gray-600">সম্পূর্ণ প্রজেক্ট ব্যবস্থাপনা এবং ট্র্যাকিং সিস্টেম</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            প্রজেক্ট ব্যবস্থাপনা
          </CardTitle>
          <CardDescription>প্রজেক্ট তৈরি, টাস্ক ম্যানেজমেন্ট, টিম কোলাবরেশন এবং বাজেট ট্র্যাকিং</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectManager />
        </CardContent>
      </Card>
    </div>
  )
}
