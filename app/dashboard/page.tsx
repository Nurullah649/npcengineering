'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Loader2, Copy, Check, ShoppingBag, Package, Receipt, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      // Siparişleri çek
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, products(name, slug)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersData) {
        setOrders(ordersData as any);
        const totalSpent = ordersData.reduce((acc, o) => acc + (o.amount || 0), 0);
        setStats({ totalOrders: ordersData.length, totalSpent });
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hoşgeldin, {user?.user_metadata?.full_name || user?.email?.split('@')[0]} 👋
        </h1>
        <p className="text-muted-foreground">
          Hesap özetini ve son aktivitelerini buradan görebilirsin.
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Harcama</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpent} ₺</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Satın Alınan Ürün</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Son Siparişler */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Son Siparişler</CardTitle>
            <CardDescription>Son 5 siparişiniz</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/orders">Tümünü Gör</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz bir siparişiniz bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{order.products?.name || 'Ürün'}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), 'd MMM yyyy', { locale: tr })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                      {order.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                    </Badge>
                    <span className="font-medium">{order.amount} ₺</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hızlı Erişim */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/products">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
            <CardHeader className="flex flex-row items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-base">Ürünlerim</CardTitle>
                <CardDescription>Satın aldığın ürünlere eriş</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/settings">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
            <CardHeader className="flex flex-row items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-base">Ayarlar</CardTitle>
                <CardDescription>Profil bilgilerini düzenle</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/#products">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
            <CardHeader className="flex flex-row items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-base">Ürünlere Göz At</CardTitle>
                <CardDescription>Yeni ürünleri keşfet</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}