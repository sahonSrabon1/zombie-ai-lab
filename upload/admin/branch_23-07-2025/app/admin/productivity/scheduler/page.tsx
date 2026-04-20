"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectScheduler } from "@/components/project-scheduler"
import { Calendar } from "lucide-react"

export default function AdminSchedulerPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">প্রজেক্ট সময়সূচী</h1>
          <p className="text-gray-600">আপনার প্রজেক্টের সময়সূচী পরিকল্পনা এবং ব্যবস্থাপনা করুন</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            সময়সূচী ব্যবস্থাপনা
          </CardTitle>
          <CardDescription>প্রজেক্টের সময়সূচী তৈরি, ট্র্যাক এবং আপডেট করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectScheduler />
        </CardContent>
      </Card>
    </div>
  )
}
