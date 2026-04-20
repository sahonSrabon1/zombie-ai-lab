"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectDelivery } from "@/components/project-delivery"
import { Truck } from "lucide-react"

export default function AdminDeliveryPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Truck className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">প্রজেক্ট ডেলিভারি</h1>
          <p className="text-gray-600">প্রজেক্ট ডেলিভারি ট্র্যাকিং এবং ক্লায়েন্ট কমিউনিকেশন</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            ডেলিভারি ম্যানেজমেন্ট
          </CardTitle>
          <CardDescription>ক্লায়েন্ট ডেলিভারি ট্র্যাকিং, ইমেইল টেমপ্লেট এবং ফিডব্যাক ম্যানেজমেন্ট</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectDelivery />
        </CardContent>
      </Card>
    </div>
  )
}
