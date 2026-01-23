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

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
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
      try {
        // Önce user'ı kontrol et
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          console.log('No user found, redirecting to login');
          router.push('/login');
          return;
        }

        setUser(currentUser);

        // 1. Profil Verisini Çek
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profileError) {
          console.log('Profile not found, using user metadata');
          // Profil yoksa user metadata'dan oluştur
          setProfile({
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Kullanıcı',
            email: currentUser.email || '',
            ref_code: null,
            subscription_end_date: null,
            role: currentUser.user_metadata?.role || 'user',
          });
        } else {
          setProfile(profileData);
        }

        // 2. Siparişleri Çek (Ürün bilgisiyle beraber)
        try {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('*, products(name, slug)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

          if (ordersData) {
            setOrders(ordersData as any);
          }
        } catch (orderError) {
          console.log('Could not fetch orders:', orderError);
          // Orders tablosu yoksa veya hata varsa boş bırak
          setOrders([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Dashboard error:', error);
        setLoading(false);
      }
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
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null; // Router.push halledecek
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container max-w-6xl py-10">
          <div className="grid gap-8 md:grid-cols-[1fr_300px]">

            {/* SOL Taraf: Siparişler ve İçerik */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Hoşgeldin, {profile?.full_name || user.email?.split('@')[0]} 👋
                </h1>
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
                      <div className="font-medium">{profile?.full_name || user.email?.split('@')[0]}</div>
                      <div className="text-xs text-muted-foreground">{profile?.email || user.email}</div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Referans Kodunuz</label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 rounded bg-muted px-2 py-1 text-sm font-mono font-bold">
                        {profile?.ref_code || '---'}
                      </code>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={copyToClipboard} disabled={!profile?.ref_code}>
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
      </main>
      <Footer />
    </div>
  );
}