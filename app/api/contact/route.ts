import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { escapeHtml } from '@/lib/utils';

const contactSchema = z.object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır'),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, message } = contactSchema.parse(body);

        // Validate environment variables
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('SMTP configuration missing');
            return NextResponse.json(
                { error: 'Sunucu yapılandırma hatası' },
                { status: 500 }
            );
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

        const mailOptions = {
            from: `"Web Sitesi İletişim" <${process.env.SMTP_USER}>`,
            to: process.env.MY_EMAIL || process.env.SMTP_USER, // Fallback to sender if receiver not set
            replyTo: email,
            subject: `Yeni İletişim Formu Mesajı: ${safeName}`,
            text: message,
            html: `
        <h3>Yeni bir mesajın var!</h3>
        <p><strong>Gönderen:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Mesaj:</strong></p>
        <p>${safeMessage}</p>
      `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: 'Mail başarıyla gönderildi' }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error('Mail sending error:', error);
        return NextResponse.json({ error: 'Mail gönderilemedi' }, { status: 500 });
    }
}
