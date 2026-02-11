import nodemailer from 'nodemailer';

interface SendMailParams {
    to: string;
    subject: string;
    text?: string;
    html: string;
    from?: string;
    replyTo?: string;
}

export async function sendMail({ to, subject, text, html, from, replyTo }: SendMailParams) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP configuration missing');
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            // Production'da sertifika doğrulaması AÇIK olmalı
            // Self-signed sertifika kullanılıyorsa env'den kapatılabilir
            rejectUnauthorized: process.env.SMTP_SKIP_TLS_VERIFY !== 'true'
        }
    });

    const mailOptions = {
        from: from || `"NPC Engineering" <${process.env.SMTP_USER}>`,
        to: to,
        replyTo: replyTo,
        subject: subject,
        text: text || html.replace(/<[^>]*>/g, ''), // Fallback text from HTML
        html: html,
    };

    return await transporter.sendMail(mailOptions);
}
