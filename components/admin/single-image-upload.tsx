'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { Label } from '@/components/ui/label'

interface SingleImageUploadProps {
    value?: string
    onChange: (url: string) => void
    label?: string
}

export function SingleImageUpload({
    value,
    onChange,
    label = "Kapak Görseli"
}: SingleImageUploadProps) {
    const [uploading, setUploading] = useState(false)

    // Browser-side Supabase client for upload
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        setUploading(true)
        const file = acceptedFiles[0] // Only take the first file

        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `cover-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${fileName}`

            // Upload to 'product-media' bucket
            const { error: uploadError } = await supabase.storage
                .from('product-media')
                .upload(filePath, file)

            if (uploadError) {
                toast.error(`${file.name} yüklenemedi: ${uploadError.message}`)
                return;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('product-media')
                .getPublicUrl(filePath)

            onChange(publicUrl)
            toast.success(`Kapak görseli yüklendi`)

        } catch (error) {
            toast.error('Görsel yüklenirken hata oluştu')
        } finally {
            setUploading(false)
        }
    }, [onChange, supabase])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024, // 5MB
        disabled: uploading
    })

    const removeImage = () => {
        onChange('')
    }

    return (
        <div className="space-y-3">
            <Label>{label}</Label>

            {value ? (
                <div className="relative aspect-video w-full max-w-sm bg-muted rounded-md overflow-hidden border">
                    <Image src={value} alt="Cover Preview" fill className="object-cover" />
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors w-full max-w-sm
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
                                <span className="text-sm">Görsel seçmek için tıklayın veya sürükleyin</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
