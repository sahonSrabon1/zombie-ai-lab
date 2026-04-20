"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TextCorrection } from "@/components/text-correction"
import { FileText } from "lucide-react"

export default function AdminCorrectionPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">টেক্সট সংশোধন</h1>
          <p className="text-gray-600">স্বয়ংক্রিয় টেক্সট সংশোধন এবং ব্যাকরণ পরীক্ষা</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            টেক্সট এডিটর
          </CardTitle>
          <CardDescription>বানান সংশোধন, ব্যাকরণ পরীক্ষা এবং টেক্সট উন্নতির টুল</CardDescription>
        </CardHeader>
        <CardContent>
          <TextCorrection />
        </CardContent>
      </Card>
    </div>
  )
}
