"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectScheduler } from "@/components/project-scheduler"
import { ProjectManager } from "@/components/project-manager"
import { ProjectDelivery } from "@/components/project-delivery"
import { DateTodoList } from "@/components/date-todo-list"
import { CustomCharacter } from "@/components/custom-character"
import { TextCorrection } from "@/components/text-correction"
import { MP3Playlist } from "@/components/mp3-playlist"
import { ProductivityNotepad } from "@/components/productivity-notepad"
import {
  Calendar,
  FolderOpen,
  Truck,
  CheckSquare,
  User,
  FileText,
  Music,
  NotebookPen,
  Download,
  Github,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProductivityToolkit() {
  const [activeTab, setActiveTab] = useState("notepad")

  const downloadProject = () => {
    // This would trigger the download functionality
    alert("প্রজেক্ট ডাউনলোড শুরু হচ্ছে... GitHub থেকে সম্পূর্ণ কোড পাবেন!")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🚀 সম্পূর্ণ প্রোডাক্টিভিটি টুলকিট</h1>
          <p className="text-xl text-gray-600 mb-4">
            আপনার সকল কাজের জন্য একটি সম্পূর্ণ সমাধান - ইনশাআল্লাহ এটি আপনার অনেক কাজে আসবে
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={downloadProject} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              প্রজেক্ট ডাউনলোড করুন
            </Button>
            <Button variant="outline" className="border-gray-300 bg-transparent">
              <Github className="h-4 w-4 mr-2" />
              GitHub এ দেখুন
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
            <TabsTrigger value="notepad" className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4" />
              <span className="hidden sm:inline">নোটপ্যাড</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">সময়সূচী</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">প্রজেক্ট</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">ডেলিভারি</span>
            </TabsTrigger>
            <TabsTrigger value="todo" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">টুডু</span>
            </TabsTrigger>
            <TabsTrigger value="character" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">ক্যারেক্টার</span>
            </TabsTrigger>
            <TabsTrigger value="correction" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">সংশোধন</span>
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">মিউজিক</span>
            </TabsTrigger>
          </TabsList>

          {/* Notepad Tab */}
          <TabsContent value="notepad">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <NotebookPen className="h-5 w-5" />
                  প্রোডাক্টিভিটি নোটপ্যাড
                </CardTitle>
                <CardDescription>শর্টকাট এবং বিভিন্ন প্রোডাক্টিভিটি ফিচার সহ উন্নত নোটপ্যাড</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductivityNotepad />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Schedule Tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  প্রজেক্ট সময়সূচী
                </CardTitle>
                <CardDescription>আপনার প্রজেক্টের সময়সূচী পরিকল্পনা এবং ব্যবস্থাপনা করুন</CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectScheduler />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Management Tab */}
          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  প্রজেক্ট ম্যানেজমেন্ট
                </CardTitle>
                <CardDescription>সম্পূর্ণ প্রজেক্ট ব্যবস্থাপনা এবং ট্র্যাকিং সিস্টেম</CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Delivery Tab */}
          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  প্রজেক্ট ডেলিভারি
                </CardTitle>
                <CardDescription>প্রজেক্ট ডেলিভারি ট্র্যাকিং এবং ক্লায়েন্ট কমিউনিকেশন</CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectDelivery />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Date Todo List Tab */}
          <TabsContent value="todo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  আজকের কাজের তালিকা
                </CardTitle>
                <CardDescription>দৈনিক কাজের তালিকা এবং অগ্রাধিকার ব্যবস্থাপনা</CardDescription>
              </CardHeader>
              <CardContent>
                <DateTodoList />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Character Tab */}
          <TabsContent value="character">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  কাস্টম ক্যারেক্টার
                </CardTitle>
                <CardDescription>আপনার নিজস্ব ক্যারেক্টার তৈরি এবং কাস্টমাইজ করুন</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomCharacter />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Text Correction Tab */}
          <TabsContent value="correction">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  টেক্সট সংশোধন
                </CardTitle>
                <CardDescription>স্বয়ংক্রিয় টেক্সট সংশোধন এবং ব্যাকরণ পরীক্ষা</CardDescription>
              </CardHeader>
              <CardContent>
                <TextCorrection />
              </CardContent>
            </Card>
          </TabsContent>

          {/* MP3 Playlist Tab */}
          <TabsContent value="music">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  কাস্টম MP3 প্লেলিস্ট
                </CardTitle>
                <CardDescription>আপনার প্রিয় গানের প্লেলিস্ট তৈরি এবং পরিচালনা করুন</CardDescription>
              </CardHeader>
              <CardContent>
                <MP3Playlist />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-8 p-4 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600">
            🤲 আল্লাহর রহমতে এই টুলটি তৈরি করা হয়েছে। আশা করি এটি আপনার প্রোডাক্টিভিটি বৃদ্ধিতে সাহায্য করবে।
          </p>
          <p className="text-sm text-gray-500 mt-2">বারাকাল্লাহু ফিকুম - আল্লাহ আপনাদের মধ্যে বরকত দান করুন</p>
        </div>
      </div>
    </div>
  )
}
