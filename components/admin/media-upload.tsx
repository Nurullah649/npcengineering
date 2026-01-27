'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Upload, X, Image as ImageIcon, Film } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MediaUploadProps {
    initialScreenshots?: string[]
    initialVideoUrls?: string[]
    onScreenshotsChange: (urls: string[]) => void
    onVideoUrlsChange: (urls: string[]) => void
}

export function MediaUpload({
    initialScreenshots = [],
    initialVideoUrls = [],
    onScreenshotsChange,
    onVideoUrlsChange
}: MediaUploadProps) {
    const [screenshots, setScreenshots] = useState<string[]>(initialScreenshots)
    const [videoUrls, setVideoUrls] = useState<string[]>(initialVideoUrls)
    const [currentVideoInput, setCurrentVideoInput] = useState('')
    const [uploading, setUploading] = useState(false)

    // Browser-side Supabase client for upload
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        setUploading(true)
        const newUrls: string[] = []

        try {
            for (const file of acceptedFiles) {
                // Generate unique filename
                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${fileName}`

                // Upload to 'product-media' bucket
                const { error: uploadError } = await supabase.storage
                    .from('product-media')
                    .upload(filePath, file)

                if (uploadError) {
                    toast.error(`${file.name} yüklenemedi: ${uploadError.message}`)
                    continue
                }

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('product-media')
                    .getPublicUrl(filePath)

                newUrls.push(publicUrl)
            }

            if (newUrls.length > 0) {
                const updatedScreenshots = [...screenshots, ...newUrls]
                setScreenshots(updatedScreenshots)
                onScreenshotsChange(updatedScreenshots)
                toast.success(`${newUrls.length} fotoğraf yüklendi`)
            }

        } catch (error) {
            toast.error('Görsel yüklenirken hata oluştu')
        } finally {
            setUploading(false)
        }
    }, [screenshots, onScreenshotsChange, supabase])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxSize: 5 * 1024 * 1024, // 5MB
        disabled: uploading
    })

    const removeScreenshot = (indexToRemove: number) => {
        const updated = screenshots.filter((_, index) => index !== indexToRemove)
        setScreenshots(updated)
        onScreenshotsChange(updated)
    }

    // Video Upload Logic (Multiple)
    const onVideoDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        setUploading(true)
        const newVideoUrls: string[] = []

        try {
            for (const file of acceptedFiles) {
                const fileExt = file.name.split('.').pop()
                const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('product-media')
                    .upload(filePath, file)

                if (uploadError) {
                    toast.error(`${file.name} yüklenemedi: ${uploadError.message}`)
                    continue
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('product-media')
                    .getPublicUrl(filePath)

                newVideoUrls.push(publicUrl)
            }

            if (newVideoUrls.length > 0) {
                const updatedVideos = [...videoUrls, ...newVideoUrls]
                setVideoUrls(updatedVideos)
                onVideoUrlsChange(updatedVideos)
                toast.success(`${newVideoUrls.length} video yüklendi`)
            }

        } catch (error: any) {
            toast.error('Video yüklenirken hata: ' + error.message)
        } finally {
            setUploading(false)
        }
    }, [supabase, videoUrls, onVideoUrlsChange])

    const videoDropzone = useDropzone({
        onDrop: onVideoDrop,
        accept: { 'video/*': ['.mp4', '.webm', '.ogg'] },
        maxSize: 100 * 1024 * 1024, // 100MB limit
        disabled: uploading
    })

    const removeVideo = (indexToRemove: number) => {
        const updated = videoUrls.filter((_, index) => index !== indexToRemove)
        setVideoUrls(updated)
        onVideoUrlsChange(updated)
    }

    const addVideoUrl = () => {
        if (!currentVideoInput.trim()) return
        const updated = [...videoUrls, currentVideoInput.trim()]
        setVideoUrls(updated)
        onVideoUrlsChange(updated)
        setCurrentVideoInput('')
    }

    return (
        <div className="space-y-8">
            {/* --- GÖRSELLER --- */}
            <div className="space-y-3">
                <Label>Ürün Görselleri</Label>

                <div
                    {...getRootProps()}
                    className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        {uploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                            <div className="flex flex-col items-center">
                                <ImageIcon className="h-8 w-8 mb-2" />
                                <span className="text-sm">Görselleri buraya sürükleyin veya tıklayın</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Görsel Listesi */}
                {screenshots.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {screenshots.map((url, index) => (
                            <div key={index} className="group relative aspect-video bg-muted rounded-md overflow-hidden border">
                                <Image src={url} alt="" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeScreenshot(index)}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- VİDEOLAR --- */}
            <div className="space-y-3">
                <Label>Tanıtım Videoları</Label>

                {/* Video Dropzone */}
                <div
                    {...videoDropzone.getRootProps()}
                    className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${videoDropzone.isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <input {...videoDropzone.getInputProps()} />
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        {uploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                            <div className="flex flex-col items-center">
                                <Film className="h-8 w-8 mb-2" />
                                <span className="text-sm">Video dosyalarını (mp4) buraya sürükleyin veya tıklayın</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* URL Ekleme */}
                <div className="flex gap-2">
                    <Input
                        value={currentVideoInput}
                        onChange={(e) => setCurrentVideoInput(e.target.value)}
                        placeholder="veya Video URL'si ekleyin (YouTube/Vimeo)"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVideoUrl())}
                    />
                    <Button type="button" onClick={addVideoUrl} variant="secondary">
                        Ekle
                    </Button>
                </div>

                {/* Video Listesi */}
                {videoUrls.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {videoUrls.map((url, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 rounded bg-muted/50 border">
                                <Film className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm flex-1 truncate">{url}</span>
                                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                        <Upload className="h-3 w-3 rotate-45" />
                                    </a>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    onClick={() => removeVideo(index)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
