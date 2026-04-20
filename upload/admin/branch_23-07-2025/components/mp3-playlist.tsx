"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Plus,
  Trash2,
  Upload,
  Music,
  List,
  Heart,
  Clock,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Song {
  id: string
  title: string
  artist: string
  duration: number
  url: string
  favorite: boolean
  addedAt: Date
}

interface Playlist {
  id: string
  name: string
  songs: Song[]
  createdAt: Date
}

export function MP3Playlist() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<"none" | "one" | "all">("none")
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load playlists from localStorage
  useEffect(() => {
    const savedPlaylists = localStorage.getItem("mp3-playlists")
    if (savedPlaylists) {
      const parsedPlaylists = JSON.parse(savedPlaylists).map((playlist: any) => ({
        ...playlist,
        createdAt: new Date(playlist.createdAt),
        songs: playlist.songs.map((song: any) => ({
          ...song,
          addedAt: new Date(song.addedAt),
        })),
      }))
      setPlaylists(parsedPlaylists)
    }
  }, [])

  // Save playlists to localStorage
  useEffect(() => {
    localStorage.setItem("mp3-playlists", JSON.stringify(playlists))
  }, [playlists])

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0
        audio.play()
      } else {
        playNext()
      }
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [currentSong, repeatMode])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "ত্রুটি!",
        description: "প্লেলিস্টের নাম দিন।",
        variant: "destructive",
      })
      return
    }

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      songs: [],
      createdAt: new Date(),
    }

    setPlaylists((prev) => [...prev, newPlaylist])
    setSelectedPlaylist(newPlaylist)
    setNewPlaylistName("")
    setShowCreatePlaylist(false)

    toast({
      title: "প্লেলিস্ট তৈরি হয়েছে! ✅",
      description: `"${newPlaylist.name}" সফলভাবে তৈরি হয়েছে।`,
    })
  }

  const deletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId))
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(null)
      setCurrentSong(null)
      setIsPlaying(false)
    }

    toast({
      title: "প্লেলিস্ট মুছে ফেলা হয়েছে! 🗑️",
      description: "প্লেলিস্ট সফলভাবে মুছে ফেলা হয়েছে।",
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !selectedPlaylist) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("audio/")) {
        const url = URL.createObjectURL(file)
        const audio = new Audio(url)

        audio.addEventListener("loadedmetadata", () => {
          const newSong: Song = {
            id: Date.now().toString() + Math.random(),
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: "অজানা শিল্পী",
            duration: audio.duration,
            url: url,
            favorite: false,
            addedAt: new Date(),
          }

          setPlaylists((prev) =>
            prev.map((p) => (p.id === selectedPlaylist.id ? { ...p, songs: [...p.songs, newSong] } : p)),
          )

          setSelectedPlaylist((prev) => (prev ? { ...prev, songs: [...prev.songs, newSong] } : null))
        })
      }
    })

    toast({
      title: "গান যোগ হয়েছে! 🎵",
      description: "নতুন গান প্লেলিস্টে যোগ করা হয়েছে।",
    })

    // Reset file input
    event.target.value = ""
  }

  const playSong = (song: Song) => {
    if (audioRef.current) {
      audioRef.current.src = song.url
      audioRef.current.play()
      setCurrentSong(song)
      setIsPlaying(true)
    }
  }

  const togglePlayPause = () => {
    if (!audioRef.current || !currentSong) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const playNext = () => {
    if (!selectedPlaylist || !currentSong) return

    const currentIndex = selectedPlaylist.songs.findIndex((s) => s.id === currentSong.id)
    let nextIndex

    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * selectedPlaylist.songs.length)
    } else {
      nextIndex = (currentIndex + 1) % selectedPlaylist.songs.length
    }

    if (repeatMode === "all" || nextIndex !== 0 || currentIndex !== selectedPlaylist.songs.length - 1) {
      playSong(selectedPlaylist.songs[nextIndex])
    }
  }

  const playPrevious = () => {
    if (!selectedPlaylist || !currentSong) return

    const currentIndex = selectedPlaylist.songs.findIndex((s) => s.id === currentSong.id)
    const prevIndex = currentIndex === 0 ? selectedPlaylist.songs.length - 1 : currentIndex - 1

    playSong(selectedPlaylist.songs[prevIndex])
  }

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const toggleFavorite = (songId: string) => {
    if (!selectedPlaylist) return

    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === selectedPlaylist.id
          ? {
              ...p,
              songs: p.songs.map((s) => (s.id === songId ? { ...s, favorite: !s.favorite } : s)),
            }
          : p,
      ),
    )

    setSelectedPlaylist((prev) =>
      prev
        ? {
            ...prev,
            songs: prev.songs.map((s) => (s.id === songId ? { ...s, favorite: !s.favorite } : s)),
          }
        : null,
    )
  }

  const removeSong = (songId: string) => {
    if (!selectedPlaylist) return

    setPlaylists((prev) =>
      prev.map((p) => (p.id === selectedPlaylist.id ? { ...p, songs: p.songs.filter((s) => s.id !== songId) } : p)),
    )

    setSelectedPlaylist((prev) => (prev ? { ...prev, songs: prev.songs.filter((s) => s.id !== songId) } : null))

    if (currentSong?.id === songId) {
      setCurrentSong(null)
      setIsPlaying(false)
    }

    toast({
      title: "গান সরানো হয়েছে! 🗑️",
      description: "গান প্লেলিস্ট থেকে সরানো হয়েছে।",
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getTotalDuration = () => {
    if (!selectedPlaylist) return 0
    return selectedPlaylist.songs.reduce((total, song) => total + song.duration, 0)
  }

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="audio/*" multiple onChange={handleFileUpload} className="hidden" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">কাস্টম MP3 প্লেলিস্ট</h2>
          <p className="text-gray-600">আপনার প্রিয় গানের প্লেলিস্ট তৈরি এবং পরিচালনা করুন</p>
        </div>
        <Button onClick={() => setShowCreatePlaylist(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          নতুন প্লেলিস্ট
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{playlists.length}</div>
            <div className="text-sm text-gray-600">প্লেলিস্ট</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {playlists.reduce((total, p) => total + p.songs.length, 0)}
            </div>
            <div className="text-sm text-gray-600">মোট গান</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {playlists.reduce((total, p) => total + p.songs.filter((s) => s.favorite).length, 0)}
            </div>
            <div className="text-sm text-gray-600">প্রিয় গান</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatTime(playlists.reduce((total, p) => total + p.songs.reduce((sum, s) => sum + s.duration, 0), 0))}
            </div>
            <div className="text-sm text-gray-600">মোট সময়</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Playlist List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              প্লেলিস্ট
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPlaylist?.id === playlist.id
                      ? "bg-blue-100 border-2 border-blue-300"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedPlaylist(playlist)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{playlist.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {playlist.songs.length} গান • {formatTime(getTotalDuration())}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deletePlaylist(playlist.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {playlists.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">কোন প্লেলিস্ট নেই</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Music Player */}
          {currentSong && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  এখন বাজছে
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Song Info */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{currentSong.title}</h3>
                  <p className="text-gray-600">{currentSong.artist}</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={1}
                    onValueChange={(value) => seekTo(value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsShuffled(!isShuffled)}
                    className={isShuffled ? "bg-blue-100" : ""}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>

                  <Button variant="outline" size="sm" onClick={playPrevious}>
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button onClick={togglePlayPause} size="lg">
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>

                  <Button variant="outline" size="sm" onClick={playNext}>
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const modes: Array<"none" | "one" | "all"> = ["none", "one", "all"]
                      const currentIndex = modes.indexOf(repeatMode)
                      setRepeatMode(modes[(currentIndex + 1) % modes.length])
                    }}
                    className={repeatMode !== "none" ? "bg-blue-100" : ""}
                  >
                    <Repeat className="h-4 w-4" />
                    {repeatMode === "one" && <span className="ml-1 text-xs">1</span>}
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVolume(value[0])}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-8">{volume}%</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Song List */}
          {selectedPlaylist ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    {selectedPlaylist.name}
                  </CardTitle>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    গান যোগ করুন
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedPlaylist.songs.length} গান • {formatTime(getTotalDuration())}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedPlaylist.songs.map((song, index) => (
                    <div
                      key={song.id}
                      className={`p-3 rounded-lg transition-colors ${
                        currentSong?.id === song.id
                          ? "bg-blue-100 border border-blue-300"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Button variant="outline" size="sm" onClick={() => playSong(song)}>
                            {currentSong?.id === song.id && isPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>

                          <div className="flex-1">
                            <div className="font-medium text-sm">{song.title}</div>
                            <div className="text-xs text-gray-500">{song.artist}</div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatTime(song.duration)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleFavorite(song.id)}
                            className={song.favorite ? "text-red-600" : ""}
                          >
                            <Heart className={`h-4 w-4 ${song.favorite ? "fill-current" : ""}`} />
                          </Button>

                          <Button variant="outline" size="sm" onClick={() => removeSong(song.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedPlaylist.songs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">কোন গান নেই</h3>
                      <p className="mb-4">এই প্লেলিস্টে গান যোগ করুন</p>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        প্রথম গান যোগ করুন
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">কোন প্লেলিস্ট নির্বাচিত নয়</h3>
                <p className="text-gray-500 mb-4">একটি প্লেলিস্ট নির্বাচন করুন বা নতুন তৈরি করুন</p>
                <Button onClick={() => setShowCreatePlaylist(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  নতুন প্লেলিস্ট তৈরি করুন
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>নতুন প্লেলিস্ট তৈরি করুন</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="প্লেলিস্টের নাম"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    createPlaylist()
                  }
                }}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreatePlaylist(false)}>
                  বাতিল
                </Button>
                <Button onClick={createPlaylist}>তৈরি করুন</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
