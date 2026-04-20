"use client"

import { useState } from "react"
import { toast } from "@/hooks/use-toast"

interface Character {
  id: string
  name: string
  description: string
  appearance: {
    skinColor: string
    hairColor: string
    eyeColor: string
    height: number
    build: "slim" | "average" | "muscular"
  }
  personality: {
    traits: string[]
    mood: string
    energy: number
    friendliness: number
  }
  clothing: {
    style: string
    colors: string[]
    accessories: string[]
  }
  background: {
    occupation: string
    hobbies: string[]
    backstory: string
  }
}

export function CustomCharacter() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const [newCharacter, setNewCharacter] = useState<Partial<Character>>({
    name: '',
    description: '',
    appearance: {
      skinColor: '#F4C2A1',
      hairColor: '#8B4513',
      eyeColor: '#654321',
      height: 170,
      build: 'average'
    },
    personality: {
      traits: [],
      mood: 'খুশি',
      energy: 50,
      friendliness: 50
    },
    clothing: {
      style: 'ক্যাজুয়াল',
      colors: ['#0066CC', '#FFFFFF'],
      accessories: []
    },
    background: {
      occupation: '',
      hobbies: [],
      backstory: ''
    }
  })

  const personalityTraits = [
    'বন্ধুত্বপূর্ণ', 'বুদ্ধিমান', 'সৃজনশীল', 'সাহসী', 'দয়ালু',
    'হাস্যরসিক', 'ধৈর্যশীল', 'উৎসাহী', 'নির্ভরযোগ্য', 'অভিযানপ্রিয়'
  ]

  const clothingStyles = [
    'ক্যাজুয়াল', 'ফর্মাল', 'ঐতিহ্যবাহী', 'আধুনিক', 'স্পোর্টস', 'আর্টিস্টিক'
  ]

  const accessories = [
    'চশমা', 'টুপি', 'গহনা', 'ঘড়ি', 'ব্যাগ', 'স্কার্ফ', 'বেল্ট'
  ]

  const hobbies = [
    'পড়া', 'লেখা', 'গান', 'নাচ', 'রান্না', 'ভ্রমণ', 'ফটোগ্রাফি', 
    'খেলাধুলা', 'গার্ডেনিং', 'পেইন্টিং', 'প্রোগ্রামিং', 'সিনেমা দেখা'
  ]

  const createCharacter = () => {
    if (!newCharacter.name?.trim()) {
      toast({
        title: "ত্রুটি!",
        description: "ক্যারেক্টারের নাম দিন।",
        variant: "destructive"
      })
      return
    }

    const character: Character = {
      id: Date.now().toString(),
      name: newCharacter.name,
      description: newCharacter.description || '',
      appearance: newCharacter.appearance!,
      personality: newCharacter.personality!,
      clothing: newCharacter.clothing!,
      background: newCharacter.background!
    }

    setCharacters(prev => [...prev, character])
    setSelectedCharacter(character)
    setShowCreateForm(false)
    
    // Reset form
    setNewCharacter({
      name: '',
      description: '',
      appearance: {
