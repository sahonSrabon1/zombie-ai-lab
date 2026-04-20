"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DateTodoList } from "@/components/date-todo-list"
import { CheckSquare } from "lucide-react"

export default function AdminTodoPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <CheckSquare className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">আজকের কাজের তালিকা</h1>
          <p className="text-gray-600">দৈনিক কাজের তালিকা এবং অগ্রাধিকার ব্যবস্থাপনা</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            টুডু ম্যানেজমেন্ট
          </CardTitle>
          <CardDescription>দৈনিক কাজের পরিকল্পনা, অগ্রাধিকার নির্ধারণ এবং প্রগ্রেস ট্র্যাকিং</CardDescription>
        </CardHeader>
        <CardContent>
          <DateTodoList />
        </CardContent>
      </Card>
    </div>
  )
}
