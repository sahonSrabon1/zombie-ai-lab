"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomCharacter } from "@/components/custom-character"
import { User } from "lucide-react"

export default function AdminCharacterPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">কাস্টম ক্যারেক্টার</h1>
          <p className="text-gray-600">আপনার নিজস্ব ক্যারেক্টার তৈরি এবং কাস্টমাইজ করুন</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            ক্যারেক্টার ডিজাইনার
          </CardTitle>
          <CardDescription>ক্যারেক্টারের চেহারা, ব্যক্তিত্ব, পোশাক এবং পটভূমি কাস্টমাইজ করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomCharacter />
        </CardContent>
      </Card>
    </div>
  )
}
