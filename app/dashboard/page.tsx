'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Loader2, Copy, Check, ShoppingBag, User as UserIcon, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Veri Tipleri
type Profile = {
  full_name: string | null;
  email: string;
  ref_code: string | null;
  subscription_end_date: string | null;
  role: string;
};

type Order = {
  id: string;
  created_at: string;
  status: string;
  amount: number;
  products: {
    name: string;
    slug: string;
  } | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // 1. Profil Verisini Çek
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(profileData);

      // 2. Siparişleri Çek (Ürün bilgisiyle beraber)
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, products(name, slug)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (ordersData) {
        // Tip dönüşümü gerekebilir, basitleştirilmiş hali:
        setOrders(ordersData as any);
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  const copyToClipboard = () => {
    if (profile?.ref_code) {
      navigator.clipboard.writeText(profile.ref_code);
      setCopied(true);
      toast.success('Referans kodu kopyalandı!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="grid gap-8 md:grid-cols-[1fr_300px]">

        {/* SOL Taraf: Siparişler ve İçerik */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hoşgeldin, {profile?.full_name} 👋</h1>
            <p className="text-muted-foreground">Hesap durumunu ve siparişlerini buradan yönetebilirsin.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Siparişlerim
              </CardTitle>
              <CardDescription>Satın aldığınız son ürünler ve durumları.</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz bir siparişiniz bulunmuyor.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-4">
                      <div className="space-y-1">
                        <div className="font-semibold">{order.products?.name || 'Bilinmeyen Ürün'}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'd MMMM yyyy HH:mm', { locale: tr })}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={order.status === 'paid' || order.status === 'completed' ? 'default' : 'secondary'}>
                          {order.status === 'paid' || order.status === 'completed' ? 'Ödendi' : 'Bekliyor'}
                        </Badge>
                        <div className="font-medium">
                          {order.amount ? `${order.amount} ₺` : '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SAĞ Taraf: Profil Kartı ve Referans */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Üyelik Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{profile?.full_name}</div>
                  <div className="text-xs text-muted-foreground">{profile?.email}</div>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-xs font-medium text-muted-foreground">Referans Kodunuz</label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-2 py-1 text-sm font-mono font-bold">
                    {profile?.ref_code || '---'}
                  </code>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  Bu kodu arkadaşlarınıza vererek puan kazanabilirsiniz.
                </p>
              </div>

              <Separator />

              <div>
                <label className="text-xs font-medium text-muted-foreground">Abonelik Durumu</label>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant={profile?.subscription_end_date ? 'default' : 'outline'}>
                    {profile?.subscription_end_date ? 'Aktif Üye' : 'Üyelik Yok'}
                  </Badge>
                  {profile?.subscription_end_date && (
                    <span className="text-xs text-muted-foreground">
                      Bitiş: {format(new Date(profile.subscription_end_date), 'd MMM yyyy')}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}