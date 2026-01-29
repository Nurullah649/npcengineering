'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AuthConfirmPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // URL'deki hash fragment'ı veya query param'ı işle
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const accessToken = hashParams.get('access_token')
                const refreshToken = hashParams.get('refresh_token')
                const type = hashParams.get('type')

                // Query param'dan 'code' kontrolü
                const code = searchParams.get('code')

                if (code) {
                    // Code varsa session ile takas et
                    const { error } = await supabase.auth.exchangeCodeForSession(code)
                    if (error) {
                        setStatus('error')
                        setMessage(error.message)
                        return
                    }
                    // Başarılı ise devam et (Aşağıdaki session kontrolüne düşecek veya direkt trial başlatıp yönlendireceğiz)
                } else if (accessToken && refreshToken) {
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
                }

                // Oturum açılmış mı diye son bir kontrol yap
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (session) {
                    // Deneme sürümünü başlat
                    try {
                        await fetch('/api/auth/start-trial', { method: 'POST' })
                    } catch (e) {
                        console.error('Trial start failed during confirmation', e)
                    }

                    setStatus('success')
                    setMessage('Hesabınız başarıyla doğrulandı!')

                    setTimeout(() => {
                        router.push('/dashboard')
                        router.refresh()
                    }, 2000)
                } else {
                    if (!code && !accessToken) {
                        // Ne code var, ne token var, ne session var -> Hata
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
    }, [router, searchParams])

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
