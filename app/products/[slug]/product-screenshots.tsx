"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductScreenshotsProps {
  screenshots: string[]
  productName: string
  category: string
}

export function ProductScreenshots({ screenshots, productName, category }: ProductScreenshotsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="space-y-4">
      {/* Main Screenshot */}
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-secondary/50">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10">
              <span className="text-xl font-bold text-accent">NPC</span>
            </div>
            <p className="text-sm font-medium text-foreground">{productName}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ekran Görüntüsü {currentIndex + 1}</p>
          </div>
        </div>

        {/* Navigation Arrows */}
        {screenshots.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
              onClick={goToPrevious}
              aria-label="Önceki ekran görüntüsü"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
              onClick={goToNext}
              aria-label="Sonraki ekran görüntüsü"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Category Badge */}
        <div className="absolute right-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
          {category}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {screenshots.length > 1 && (
        <div className="flex gap-2">
          {screenshots.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`relative aspect-video flex-1 overflow-hidden rounded-lg border transition-all ${
                index === currentIndex
                  ? "border-accent ring-2 ring-accent/20"
                  : "border-border opacity-60 hover:opacity-100"
              }`}
              aria-label={`Ekran görüntüsü ${index + 1}`}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
                <span className="text-xs text-muted-foreground">{index + 1}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
