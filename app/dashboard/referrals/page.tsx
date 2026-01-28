'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Loader2, Share2, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';

export default function ReferralsPage() {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [refCode, setRefCode] = useState<string | null>(null);
    const [stats, setStats] = useState({ count: 0 });

    useEffect(() => {
        fetchReferralData();
    }, []);

    async function fetchReferralData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('ref_code, referral_count')
                .eq('id', user.id)
                .single();

            if (profile) {
                setRefCode(profile.ref_code);
                setStats({ count: profile.referral_count || 0 });
            }
        } catch (error) {
            console.error('Error fetching referral data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function generateCode() {
        setGenerating(true);
        try {
            const res = await fetch('/api/referrals/generate', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                setRefCode(data.code);
                toast.success('Referans kodunuz oluşturuldu!');
            } else {
                toast.error('Kod oluşturulamadı: ' + data.error);
            }
        } catch (error) {
            toast.error('Bir hata oluştu.');
        } finally {
            setGenerating(false);
        }
    }

    function copyLink() {
        if (!refCode) return;
        const link = `${window.location.origin}/register?ref=${refCode}`;
        navigator.clipboard.writeText(link);
        toast.success('Referans linki kopyalandı!');
    }

    if (loading) {
        return <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Referanslarım</h2>
                    <p className="text-muted-foreground">
                        Arkadaşlarını davet et, indirim kazan!
                    </p>
                </div>
            </div>

            {!refCode ? (
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle>Henüz referans kodunuz yok</CardTitle>
                        <CardDescription>
                            Hemen bir kod oluşturun ve %50'ye varan indirimlerden yararlanın.
                            Her davet ettiğiniz arkadaşınız için %5 indirim kazanırsınız.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={generateCode} disabled={generating}>
                            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Referans Kodu Oluştur
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Stats Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Toplam Davet
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.count}</div>
                            <p className="text-xs text-muted-foreground">
                                Kişi kaydoldu
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Kazanılan İndirim
                            </CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">%{Math.min(stats.count * 5, 50)}</div>
                            <p className="text-xs text-muted-foreground">
                                Aktif indirim oranı (Max %50)
                            </p>
                        </CardContent>
                    </Card>

                    {/* Code & Link Card */}
                    <Card className="md:col-span-2 lg:col-span-1 border-primary/50 bg-primary/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Kodunuz hazır!</CardTitle>
                            <CardDescription>Paylaşmaya başlayın</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="mb-2 text-sm font-medium text-muted-foreground">Referans Kodu</div>
                                <div className="flex items-center gap-2">
                                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-lg font-semibold">
                                        {refCode}
                                    </code>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                        navigator.clipboard.writeText(refCode);
                                        toast.success('Kopyalandı');
                                    }}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 text-sm font-medium text-muted-foreground">Davet Linki</div>
                                <div className="flex gap-2">
                                    <Input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${refCode}`} className="bg-background/50" />
                                    <Button onClick={copyLink}>
                                        <Share2 className="mr-2 h-4 w-4" />
                                        Kopyala
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
