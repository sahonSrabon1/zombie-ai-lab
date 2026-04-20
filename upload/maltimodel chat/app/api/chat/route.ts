import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface ChatRequest {
  message: string
  history: Message[]
}

// Simple AI response function (replace with your preferred AI service)
async function generateResponse(message: string, history: Message[]): Promise<string> {
  // This is a placeholder - replace with your AI service integration
  // You can integrate with OpenAI, Anthropic, or your local LLM server

  // For now, return a bilingual response based on input language
  const isBengali = /[\u0980-\u09FF]/.test(message)

  if (isBengali) {
    return `আপনি বলেছেন: "${message}"\n\nআমি একটি AI সহায়ক। আমি বাংলা এবং ইংরেজি উভয় ভাষায় কথা বলতে পারি। আপনার প্রশ্নের উত্তর দেওয়ার জন্য আমি এখানে আছি।`
  } else {
    return `You said: "${message}"\n\nI'm an AI assistant that can communicate in both Bengali and English. I'm here to help answer your questions and assist you with various tasks.`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, history }: ChatRequest = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Generate AI response
    const response = await generateResponse(message, history)

    // Store conversation in database
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          user_message TEXT NOT NULL,
          assistant_response TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      await sql`
        INSERT INTO conversations (user_message, assistant_response)
        VALUES (${message}, ${response})
      `
    } catch (dbError) {
      console.error("Database error:", dbError)
      // Continue even if database fails
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
