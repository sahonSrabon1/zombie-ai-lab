"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductivityNotepad } from "@/components/productivity-notepad"
import { NotebookPen } from "lucide-react"

export default function AdminNotepadPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <NotebookPen className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">প্রোডাক্টিভিটি নোটপ্যাড</h1>
          <p className="text-gray-600">শর্টকাট এবং বিভিন্ন প্রোডাক্টিভিটি ফিচার সহ উন্নত নোটপ্যাড</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <NotebookPen className="h-5 w-5" />
            নোটপ্যাড
          </CardTitle>
          <CardDescription>টেক্সট লেখা, সেভ করা, এবং বিভিন্ন ফরম্যাটিং অপশন সহ সম্পূর্ণ নোটপ্যাড</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductivityNotepad />
        </CardContent>
      </Card>
    </div>
  )
}
