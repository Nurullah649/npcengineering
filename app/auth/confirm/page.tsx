'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AuthConfirmPage() {
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // URL'deki hash fragment'ı işle
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const accessToken = hashParams.get('access_token')
                const refreshToken = hashParams.get('refresh_token')
                const type = hashParams.get('type')

                if (accessToken && refreshToken) {
                    // Token'ları kullanarak session oluştur
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    })

                    if (error) {
                        setStatus('error')
                        setMessage(error.message)
                        return
                    }

                    setStatus('success')
                    setMessage(type === 'signup' ? 'Hesabınız onaylandı!' : 'Giriş başarılı!')

                    // 2 saniye sonra dashboard'a yönlendir
                    setTimeout(() => {
                        router.push('/dashboard')
                        router.refresh()
                    }, 2000)
                } else {
                    // Token yoksa mevcut session'ı kontrol et
                    const { data: { session } } = await supabase.auth.getSession()

                    if (session) {
                        setStatus('success')
                        setMessage('Zaten giriş yapmışsınız!')
                        setTimeout(() => {
                            router.push('/dashboard')
                        }, 1500)
                    } else {
                        setStatus('error')
                        setMessage('Geçersiz veya süresi dolmuş bağlantı.')
                    }
                }
            } catch (error) {
                setStatus('error')
                setMessage('Bir hata oluştu.')
                console.error(error)
            }
        }

        handleAuthCallback()
    }, [router])

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        {status === 'loading' && (
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        )}
                        {status === 'success' && (
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        )}
                        {status === 'error' && (
                            <XCircle className="h-12 w-12 text-destructive" />
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {status === 'loading' && 'Doğrulanıyor...'}
                        {status === 'success' && 'Başarılı!'}
                        {status === 'error' && 'Hata'}
                    </CardTitle>
                    <CardDescription>
                        {message || 'Lütfen bekleyin...'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {status === 'success' && (
                        <p className="text-sm text-muted-foreground">
                            Dashboard'a yönlendiriliyorsunuz...
                        </p>
                    )}
                    {status === 'error' && (
                        <div className="space-y-4">
                            <Button asChild className="w-full">
                                <Link href="/login">Giriş Sayfasına Git</Link>
                            </Button>
                            <Button variant="outline" asChild className="w-full">
                                <Link href="/">Ana Sayfaya Dön</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
