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
    initialVideoUrl?: string | null
    onScreenshotsChange: (urls: string[]) => void
    onVideoUrlChange: (url: string | null) => void
}

export function MediaUpload({
    initialScreenshots = [],
    initialVideoUrl = '',
    onScreenshotsChange,
    onVideoUrlChange
}: MediaUploadProps) {
    const [screenshots, setScreenshots] = useState<string[]>(initialScreenshots)
    const [videoUrl, setVideoUrl] = useState<string>(initialVideoUrl || '')
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
                    console.error('Upload error:', uploadError)
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
            console.error('File drop error:', error)
            toast.error('Dosya yüklenirken bir hata oluştu')
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

    const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setVideoUrl(val)
        onVideoUrlChange(val || null)
    }

    return (
        <div className="space-y-6">
            {/* Resim Yükleme Alanı */}
            <div className="space-y-3">
                <Label>Ürün Görselleri</Label>

                <div
                    {...getRootProps()}
                    className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        {uploading ? (
                            <>
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p>Yükleniyor...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-10 w-10 mb-2" />
                                <p className="font-medium text-foreground">
                                    {isDragActive ? 'Dosyaları buraya bırakın' : 'Fotoğrafları sürükleyip bırakın'}
                                </p>
                                <p className="text-sm">veya seçmek için tıklayın (Max 5MB)</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Önizleme Listesi */}
                {screenshots.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4 animate-in fade-in">
                        {screenshots.map((url, index) => (
                            <div key={index} className="group relative aspect-video bg-muted rounded-md overflow-hidden border border-border">
                                <Image
                                    src={url}
                                    alt={`Screenshot ${index + 1}`}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeScreenshot(index)}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/50 text-white backdrop-blur-sm">
                                    #{index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video URL Alanı */}
            <div className="space-y-3">
                <Label htmlFor="videoUrl">Video URL (YouTube / Vimeo)</Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Film className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="videoUrl"
                            value={videoUrl}
                            onChange={handleVideoUrlChange}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="pl-9"
                        />
                    </div>
                    {videoUrl && (
                        <Button variant="ghost" size="icon" asChild>
                            <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                                <Upload className="h-4 w-4 rotate-45" /> {/* Using rotate for external link look or use ExternalLink icon */}
                            </a>
                        </Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    Tanıtım videosunun bağlantısını buraya yapıştırın.
                </p>
            </div>
        </div>
    )
}
