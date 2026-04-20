"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MP3Playlist } from "@/components/mp3-playlist"
import { Music } from "lucide-react"

export default function AdminMusicPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Music className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">কাস্টম MP3 প্লেলিস্ট</h1>
          <p className="text-gray-600">আপনার প্রিয় গানের প্লেলিস্ট তৈরি এবং পরিচালনা করুন</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            মিউজিক প্লেয়ার
          </CardTitle>
          <CardDescription>MP3 ফাইল আপলোড, প্লেলিস্ট তৈরি এবং মিউজিক প্লেব্যাক কন্ট্রোল</CardDescription>
        </CardHeader>
        <CardContent>
          <MP3Playlist />
        </CardContent>
      </Card>
    </div>
  )
}
