"use client"

import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trash2, Plus, Eye, EyeOff } from "lucide-react"

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
    name: "",
    description: "",
    appearance: {
      skinColor: "#F4C2A1",
      hairColor: "#8B4513",
      eyeColor: "#654321",
      height: 170,
      build: "average",
    },
    personality: {
      traits: [],
      mood: "খুশি",
      energy: 50,
      friendliness: 50,
    },
    clothing: {
      style: "ক্যাজুয়াল",
      colors: ["#0066CC", "#FFFFFF"],
      accessories: [],
    },
    background: {
      occupation: "",
      hobbies: [],
      backstory: "",
    },
  })

  const personalityTraits = [
    "বন্ধুত্বপূর্ণ",
    "বুদ্ধিমান",
    "সৃজনশীল",
    "সাহসী",
    "দয়ালু",
    "হাস্যরসিক",
    "ধৈর্যশীল",
    "উৎসাহী",
    "নির্ভরযোগ্য",
    "অভিযানপ্রিয়",
  ]

  const clothingStyles = ["ক্যাজুয়াল", "ফর্মাল", "ঐতিহ্যবাহী", "আধুনিক", "স্পোর্টস", "আর্টিস্টিক"]

  const accessories = ["চশমা", "টুপি", "গহনা", "ঘড়ি", "ব্যাগ", "স্কার্ফ", "বেল্ট"]

  const hobbies = [
    "পড়া",
    "লেখা",
    "গান",
    "নাচ",
    "রান্না",
    "ভ্রমণ",
    "ফটোগ্রাফি",
    "খেলাধুলা",
    "গার্ডেনিং",
    "পেইন্টিং",
    "প্রোগ্রামিং",
    "সিনেমা দেখা",
  ]

  const createCharacter = () => {
    if (!newCharacter.name?.trim()) {
      toast({
        title: "ত্রুটি!",
        description: "ক্যারেক্টারের নাম দিন।",
        variant: "destructive",
      })
      return
    }

    const character: Character = {
      id: Date.now().toString(),
      name: newCharacter.name,
      description: newCharacter.description || "",
      appearance: newCharacter.appearance!,
      personality: newCharacter.personality!,
      clothing: newCharacter.clothing!,
      background: newCharacter.background!,
    }

    setCharacters((prev) => [...prev, character])
    setSelectedCharacter(character)
    setShowCreateForm(false)

    // Reset form
    setNewCharacter({
      name: "",
      description: "",
      appearance: {
        skinColor: "#F4C2A1",
        hairColor: "#8B4513",
        eyeColor: "#654321",
        height: 170,
        build: "average",
      },
      personality: {
        traits: [],
        mood: "খুশি",
        energy: 50,
        friendliness: 50,
      },
      clothing: {
        style: "ক্যাজুয়াল",
        colors: ["#0066CC", "#FFFFFF"],
        accessories: [],
      },
      background: {
        occupation: "",
        hobbies: [],
        backstory: "",
      },
    })

    toast({
      title: "সফল!",
      description: `${character.name} ক্যারেক্টার তৈরি হয়েছে।`,
    })
  }

  const deleteCharacter = (id: string) => {
    setCharacters((prev) => prev.filter((char) => char.id !== id))
    if (selectedCharacter?.id === id) {
      setSelectedCharacter(null)
    }
    toast({
      title: "মুছে ফেলা হয়েছে",
      description: "ক্যারেক্টার মুছে ফেলা হয়েছে।",
    })
  }

  const toggleTrait = (trait: string) => {
    setNewCharacter((prev) => ({
      ...prev,
      personality: {
        ...prev.personality!,
        traits: prev.personality!.traits.includes(trait)
          ? prev.personality!.traits.filter((t) => t !== trait)
          : [...prev.personality!.traits, trait],
      },
    }))
  }

  const toggleAccessory = (accessory: string) => {
    setNewCharacter((prev) => ({
      ...prev,
      clothing: {
        ...prev.clothing!,
        accessories: prev.clothing!.accessories.includes(accessory)
          ? prev.clothing!.accessories.filter((a) => a !== accessory)
          : [...prev.clothing!.accessories, accessory],
      },
    }))
  }

  const toggleHobby = (hobby: string) => {
    setNewCharacter((prev) => ({
      ...prev,
      background: {
        ...prev.background!,
        hobbies: prev.background!.hobbies.includes(hobby)
          ? prev.background!.hobbies.filter((h) => h !== hobby)
          : [...prev.background!.hobbies, hobby],
      },
    }))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">কাস্টম ক্যারেক্টার</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {previewMode ? "এডিট মোড" : "প্রিভিউ মোড"}
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            নতুন ক্যারেক্টার
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Character List */}
        <Card>
          <CardHeader>
            <CardTitle>ক্যারেক্টার তালিকা</CardTitle>
            <CardDescription>{characters.length} টি ক্যারেক্টার তৈরি হয়েছে</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {characters.map((character) => (
              <div
                key={character.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedCharacter?.id === character.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                }`}
                onClick={() => setSelectedCharacter(character)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback style={{ backgroundColor: character.appearance.skinColor }}>
                        {character.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{character.name}</p>
                      <p className="text-sm text-muted-foreground">{character.background.occupation || "পেশা নেই"}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCharacter(character.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {characters.length === 0 && <p className="text-center text-muted-foreground py-8">কোনো ক্যারেক্টার নেই</p>}
          </CardContent>
        </Card>

        {/* Character Details/Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{selectedCharacter ? selectedCharacter.name : "ক্যারেক্টার নির্বাচন করুন"}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCharacter ? (
              <Tabs defaultValue="appearance" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="appearance">চেহারা</TabsTrigger>
                  <TabsTrigger value="personality">ব্যক্তিত্ব</TabsTrigger>
                  <TabsTrigger value="clothing">পোশাক</TabsTrigger>
                  <TabsTrigger value="background">পটভূমি</TabsTrigger>
                </TabsList>

                <TabsContent value="appearance" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ত্বকের রং</Label>
                      <div
                        className="w-full h-10 rounded border"
                        style={{ backgroundColor: selectedCharacter.appearance.skinColor }}
                      />
                    </div>
                    <div>
                      <Label>চুলের রং</Label>
                      <div
                        className="w-full h-10 rounded border"
                        style={{ backgroundColor: selectedCharacter.appearance.hairColor }}
                      />
                    </div>
                    <div>
                      <Label>চোখের রং</Label>
                      <div
                        className="w-full h-10 rounded border"
                        style={{ backgroundColor: selectedCharacter.appearance.eyeColor }}
                      />
                    </div>
                    <div>
                      <Label>উচ্চতা: {selectedCharacter.appearance.height} সেমি</Label>
                      <div className="mt-2">
                        <Badge variant="outline">{selectedCharacter.appearance.build}</Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="personality" className="space-y-4">
                  <div>
                    <Label>ব্যক্তিত্বের বৈশিষ্ট্য</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCharacter.personality.traits.map((trait) => (
                        <Badge key={trait} variant="secondary">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>মেজাজ: {selectedCharacter.personality.mood}</Label>
                    </div>
                    <div>
                      <Label>শক্তি: {selectedCharacter.personality.energy}%</Label>
                    </div>
                    <div>
                      <Label>বন্ধুত্ব: {selectedCharacter.personality.friendliness}%</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="clothing" className="space-y-4">
                  <div>
                    <Label>পোশাকের স্টাইল: {selectedCharacter.clothing.style}</Label>
                  </div>
                  <div>
                    <Label>রং</Label>
                    <div className="flex gap-2 mt-2">
                      {selectedCharacter.clothing.colors.map((color, index) => (
                        <div key={index} className="w-8 h-8 rounded border" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>আনুষাঙ্গিক</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCharacter.clothing.accessories.map((accessory) => (
                        <Badge key={accessory} variant="outline">
                          {accessory}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="background" className="space-y-4">
                  <div>
                    <Label>পেশা</Label>
                    <p className="mt-1">{selectedCharacter.background.occupation || "নির্দিষ্ট নয়"}</p>
                  </div>
                  <div>
                    <Label>শখ</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCharacter.background.hobbies.map((hobby) => (
                        <Badge key={hobby} variant="secondary">
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>পটভূমির গল্প</Label>
                    <p className="mt-1 text-sm">{selectedCharacter.background.backstory || "কোনো গল্প নেই"}</p>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">একটি ক্যারেক্টার নির্বাচন করুন বা নতুন তৈরি করুন</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Character Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>নতুন ক্যারেক্টার তৈরি করুন</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">মূল তথ্য</TabsTrigger>
                <TabsTrigger value="appearance">চেহারা</TabsTrigger>
                <TabsTrigger value="personality">ব্যক্তিত্ব</TabsTrigger>
                <TabsTrigger value="details">বিস্তারিত</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="name">নাম *</Label>
                  <Input
                    id="name"
                    value={newCharacter.name}
                    onChange={(e) => setNewCharacter((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="ক্যারেক্টারের নাম"
                  />
                </div>
                <div>
                  <Label htmlFor="description">বর্ণনা</Label>
                  <Textarea
                    id="description"
                    value={newCharacter.description}
                    onChange={(e) => setNewCharacter((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="ক্যারেক্টারের সংক্ষিপ্ত বর্ণনা"
                  />
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="skinColor">ত্বকের রং</Label>
                    <Input
                      id="skinColor"
                      type="color"
                      value={newCharacter.appearance?.skinColor}
                      onChange={(e) =>
                        setNewCharacter((prev) => ({
                          ...prev,
                          appearance: { ...prev.appearance!, skinColor: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="hairColor">চুলের রং</Label>
                    <Input
                      id="hairColor"
                      type="color"
                      value={newCharacter.appearance?.hairColor}
                      onChange={(e) =>
                        setNewCharacter((prev) => ({
                          ...prev,
                          appearance: { ...prev.appearance!, hairColor: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="eyeColor">চোখের রং</Label>
                    <Input
                      id="eyeColor"
                      type="color"
                      value={newCharacter.appearance?.eyeColor}
                      onChange={(e) =>
                        setNewCharacter((prev) => ({
                          ...prev,
                          appearance: { ...prev.appearance!, eyeColor: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>শরীরের গঠন</Label>
                    <Select
                      value={newCharacter.appearance?.build}
                      onValueChange={(value: "slim" | "average" | "muscular") =>
                        setNewCharacter((prev) => ({
                          ...prev,
                          appearance: { ...prev.appearance!, build: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slim">চিকন</SelectItem>
                        <SelectItem value="average">স্বাভাবিক</SelectItem>
                        <SelectItem value="muscular">পেশীবহুল</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>উচ্চতা: {newCharacter.appearance?.height} সেমি</Label>
                  <Slider
                    value={[newCharacter.appearance?.height || 170]}
                    onValueChange={([value]) =>
                      setNewCharacter((prev) => ({
                        ...prev,
                        appearance: { ...prev.appearance!, height: value },
                      }))
                    }
                    min={140}
                    max={200}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </TabsContent>

              <TabsContent value="personality" className="space-y-4">
                <div>
                  <Label>ব্যক্তিত্বের বৈশিষ্ট্য</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {personalityTraits.map((trait) => (
                      <div key={trait} className="flex items-center space-x-2">
                        <Checkbox
                          id={trait}
                          checked={newCharacter.personality?.traits.includes(trait)}
                          onCheckedChange={() => toggleTrait(trait)}
                        />
                        <Label htmlFor={trait} className="text-sm">
                          {trait}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>মেজাজ</Label>
                  <Select
                    value={newCharacter.personality?.mood}
                    onValueChange={(value) =>
                      setNewCharacter((prev) => ({
                        ...prev,
                        personality: { ...prev.personality!, mood: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="খুশি">খুশি</SelectItem>
                      <SelectItem value="শান্ত">শান্ত</SelectItem>
                      <SelectItem value="উৎসাহী">উৎসাহী</SelectItem>
                      <SelectItem value="গম্ভীর">গম্ভীর</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>শক্তির মাত্রা: {newCharacter.personality?.energy}%</Label>
                  <Slider
                    value={[newCharacter.personality?.energy || 50]}
                    onValueChange={([value]) =>
                      setNewCharacter((prev) => ({
                        ...prev,
                        personality: { ...prev.personality!, energy: value },
                      }))
                    }
                    min={0}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>বন্ধুত্বের মাত্রা: {newCharacter.personality?.friendliness}%</Label>
                  <Slider
                    value={[newCharacter.personality?.friendliness || 50]}
                    onValueChange={([value]) =>
                      setNewCharacter((prev) => ({
                        ...prev,
                        personality: { ...prev.personality!, friendliness: value },
                      }))
                    }
                    min={0}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div>
                  <Label>পোশাকের স্টাইল</Label>
                  <Select
                    value={newCharacter.clothing?.style}
                    onValueChange={(value) =>
                      setNewCharacter((prev) => ({
                        ...prev,
                        clothing: { ...prev.clothing!, style: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clothingStyles.map((style) => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>আনুষাঙ্গিক</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {accessories.map((accessory) => (
                      <div key={accessory} className="flex items-center space-x-2">
                        <Checkbox
                          id={accessory}
                          checked={newCharacter.clothing?.accessories.includes(accessory)}
                          onCheckedChange={() => toggleAccessory(accessory)}
                        />
                        <Label htmlFor={accessory} className="text-sm">
                          {accessory}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="occupation">পেশা</Label>
                  <Input
                    id="occupation"
                    value={newCharacter.background?.occupation}
                    onChange={(e) =>
                      setNewCharacter((prev) => ({
                        ...prev,
                        background: { ...prev.background!, occupation: e.target.value },
                      }))
                    }
                    placeholder="পেশা লিখুন"
                  />
                </div>
                <div>
                  <Label>শখ</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {hobbies.map((hobby) => (
                      <div key={hobby} className="flex items-center space-x-2">
                        <Checkbox
                          id={hobby}
                          checked={newCharacter.background?.hobbies.includes(hobby)}
                          onCheckedChange={() => toggleHobby(hobby)}
                        />
                        <Label htmlFor={hobby} className="text-sm">
                          {hobby}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="backstory">পটভূমির গল্প</Label>
                  <Textarea
                    id="backstory"
                    value={newCharacter.background?.backstory}
                    onChange={(e) =>
                      setNewCharacter((prev) => ({
                        ...prev,
                        background: { ...prev.background!, backstory: e.target.value },
                      }))
                    }
                    placeholder="ক্যারেক্টারের পটভূমির গল্প লিখুন"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                বাতিল
              </Button>
              <Button onClick={createCharacter}>ক্যারেক্টার তৈরি করুন</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
