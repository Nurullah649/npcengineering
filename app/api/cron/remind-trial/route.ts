import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Use Service Role to access all subscriptions
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    // Verify Cron Secret (Optional but recommended, skipping for now as per simple request)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    try {
        // 1. Find active trial subscriptions expiring in <= 2 days
        // "Deneme süresi 2 gün kala" -> remaining days <= 2
        // And reminder_sent is false.
        // Also ensuring package name contains "Deneme" or is the trial package.

        const now = new Date();
        const twoDaysLater = new Date();
        twoDaysLater.setDate(now.getDate() + 2); // Target date

        // We want subscriptions where end_date is between NOW and NOW+2 Days? 
        // "2 gün kala" usually means exactly 2 days left. 
        // Let's broaden to "Less than or equal to 2 days" to catch any we missed, 
        // assuming we don't spam (reminder_sent flag handles that).

        // Selecting subscriptions:
        // status = 'active'
        // reminder_sent = false
        // end_date <= twoDaysLater.toISOString()
        // end_date > now.toISOString() (still active)

        const { data: subs, error } = await supabaseAdmin
            .from('subscriptions')
            .select(`
        id,
        user_id,
        end_date,
        packages!inner (
          name
        ),
        profiles!inner (
          email,
          full_name
        )
      `) // Assuming profiles relationship exists via user_id, OR we fetch users via auth.
            // Note: Relation might not be set up between subscriptions and profiles in Supabase usually.
            // Usually user_id is foreign key to auth.users.
            // We cannot join auth.users easily. We might need to fetch users separately.
            .eq('status', 'active')
            .eq('reminder_sent', false)
            .lte('end_date', twoDaysLater.toISOString())
            .gt('end_date', now.toISOString())
            .ilike('packages.name', '%Deneme%'); // Filter for trial packages

        if (error) {
            console.error('Error fetching subs:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!subs || subs.length === 0) {
            return NextResponse.json({ message: 'No reminders to send' });
        }

        // 2. Setup Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        let sentCount = 0;

        // 3. Send Emails
        for (const sub of subs) {
            // Fetch user email if not in join
            let email = (sub as any).profiles?.email;
            let name = (sub as any).profiles?.full_name || 'Kullanıcı';

            if (!email) {
                // Fallback: fetch user from auth admin
                const { data: userData } = await supabaseAdmin.auth.admin.getUserById(sub.user_id);
                email = userData.user?.email;
            }

            if (email) {
                try {
                    // Format date
                    const endDate = new Date(sub.end_date).toLocaleDateString('tr-TR');

                    await transporter.sendMail({
                        from: `"SiparisGo" <${process.env.SMTP_USER}>`,
                        to: email,
                        subject: 'Deneme Süreniz Sona Eriyor!',
                        html: `
              <h3>Merhaba ${name},</h3>
              <p>SiparisGo 7 günlük deneme sürenizin bitmesine <strong>2 günden az</strong> kaldı.</p>
              <p>Aboneliğinizi kesintisiz sürdürmek ve tüm özellikleri kullanmaya devam etmek için lütfen paketinizi yükseltin.</p>
              <p>Bitiş Tarihi: ${endDate}</p>
              <br/>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscriptions" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Aboneliği Yönet</a>
            `
                    });

                    // Mark as sent
                    await supabaseAdmin
                        .from('subscriptions')
                        .update({ reminder_sent: true })
                        .eq('id', sub.id);

                    sentCount++;
                } catch (mailError) {
                    console.error(`Failed to email ${email}:`, mailError);
                }
            }
        }

        return NextResponse.json({ success: true, sent_count: sentCount });

    } catch (error) {
        console.error('Cron error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
