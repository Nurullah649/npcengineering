"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductScreenshotsProps {
  screenshots: string[]
  videoUrls?: string[]
  productName: string
  category: string
}

type MediaItem = {
  type: 'image' | 'video'
  url: string
}

export function ProductScreenshots({ screenshots, videoUrls = [], productName, category }: ProductScreenshotsProps) {
  // Combine media: Videos first (optional preference), or images first.
  // Let's put videos first so they are prominent.
  const media: MediaItem[] = [
    ...videoUrls.map(url => ({ type: 'video' as const, url })),
    ...screenshots.map(url => ({ type: 'image' as const, url })),
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  if (media.length === 0) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-secondary/50 flex items-center justify-center">
        <p className="text-muted-foreground">Görsel bulunamadı</p>
      </div>
    )
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1))
  }

  const currentMedia = media[currentIndex]

  const renderMedia = (item: MediaItem, autoPlay = false) => {
    if (item.type === 'image') {
      return (
        <img
          src={item.url}
          alt={productName}
          className="h-full w-full object-contain bg-black/5"
        />
      )
    }

    // Video Handling
    // 1. Is it a file? (mp4, webm, ogg) - Check extension roughly, ignoring query params
    const isFile = /\.(mp4|webm|ogg)(\?|$)/i.test(item.url)

    if (isFile) {
      return (
        <video
          src={item.url}
          controls
          className="h-full w-full object-contain bg-black"
          {...(autoPlay ? { autoPlay: true, muted: true } : {})}
        />
      )
    }

    // 2. Is it YouTube? (Very basic check - improved regex needed for robust apps, but simple here)
    // https://www.youtube.com/watch?v=VIDEO_ID -> embed/VIDEO_ID
    // https://youtu.be/VIDEO_ID -> embed/VIDEO_ID
    let embedUrl = item.url
    if (item.url.includes('youtube.com/watch')) {
      const videoId = item.url.split('v=')[1]?.split('&')[0]
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`
    } else if (item.url.includes('youtu.be/')) {
      const videoId = item.url.split('youtu.be/')[1]?.split('?')[0]
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`
    }

    return (
      <iframe
        src={embedUrl}
        className="h-full w-full"
        title={`Video ${productName}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Media Display */}
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-secondary/50 bg-black/5">
        <div className="absolute inset-0 flex items-center justify-center">
          {renderMedia(currentMedia, false)}
        </div>

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 z-10"
              onClick={goToPrevious}
              aria-label="Önceki"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 z-10"
              onClick={goToNext}
              aria-label="Sonraki"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Category Badge */}
        <div className="absolute right-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm z-10 pointer-events-none">
          {category}
        </div>

        {/* Caption */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm z-10 pointer-events-none">
          {currentIndex + 1} / {media.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {media.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`relative aspect-video w-24 flex-none overflow-hidden rounded-lg border transition-all ${index === currentIndex
                ? "border-accent ring-2 ring-accent/20"
                : "border-border opacity-70 hover:opacity-100"
                }`}
            >
              {item.type === 'video' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  {/* Simple placeholder for video thumbnail if not generating one */}
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-[10px]">
                    VIDEO
                  </div>
                </div>
              ) : (
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
