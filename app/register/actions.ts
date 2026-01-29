'use server'

import { createClient } from '@supabase/supabase-js'
import { sendMail } from '@/lib/mail'
import { z } from 'zod'

const registerSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    referralCode: z.string().optional(),
})

// Admin client creating (Service Role)
const getNpcAdminClient = () => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
        throw new Error('Server konfigürasyon hatası: Service Key eksik')
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

export async function registerUser(prevState: any, formData: FormData) {
    try {
        const rawData = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            password: formData.get('password'),
            referralCode: formData.get('referralCode')?.toString() || undefined,
        }

        const validatedData = registerSchema.parse(rawData)

        const supabaseAdmin = getNpcAdminClient()

        // 1. Generate Link (Creates user + returns link)
        // type: 'signup' causes the user to be created if not exists.
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email: validatedData.email,
            password: validatedData.password,
            options: {
                data: {
                    full_name: validatedData.fullName,
                    referral_code: validatedData.referralCode,
                },
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/confirm`
            }
        })

        if (error) {
            console.error('Register/GenerateLink Error:', error)

            // Kullanıcı zaten varsa "User already registered" döner.
            // Bu durumda Supabase'in normal signUp'ı gibi davranıp hata dönmeliyiz.
            return {
                success: false,
                error: error.message
            }
        }

        const { user, properties } = data

        if (!user || !properties?.action_link) {
            return {
                success: false,
                error: 'Üyelik oluşturuldu ancak onay linki üretilemedi.'
            }
        }

        // 2. Send Email
        const confirmLink = properties.action_link

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Hoş Geldiniz, ${validatedData.fullName}!</h2>
                <p>NPC Engineering'e katıldığınız için teşekkür ederiz.</p>
                <p>Hesabınızı onaylamak ve giriş yapmak için lütfen aşağıdaki butona tıklayın:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${confirmLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Hesabımı Onayla</a>
                </div>
                <p>Eğer buton çalışmazsa, aşağıdaki linki tarayıcınıza kopyalayabilirsiniz:</p>
                <p style="word-break: break-all; color: #666; font-size: 14px;">${confirmLink}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">Bu işlemi siz yapmadıysanız, bu maili görmezden gelebilirsiniz.</p>
            </div>
        `

        await sendMail({
            to: validatedData.email,
            subject: 'NPC Engineering - Hesabınızı Onaylayın',
            html: htmlContent,
            text: `Hoş geldiniz! Hesabınızı onaylamak için şu linke tıklayın: ${confirmLink}`
        })

        return {
            success: true,
            message: 'Kayıt başarılı! Lütfen e-posta kutunuzu kontrol edin.'
        }

    } catch (error: any) {
        console.error('Register action error:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message }
        }
        return {
            success: false,
            error: 'Bir hata oluştu: ' + (error.message || 'Bilinmeyen hata')
        }
    }
}
