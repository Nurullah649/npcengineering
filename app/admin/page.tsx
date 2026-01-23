'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Users, ShoppingCart, TrendingUp, Search, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Rol kontrolü
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/dashboard'); // Admin değilse normal panele at
        return;
      }

      // Admin ise verileri çek
      fetchAdminData();
    };

    checkAdmin();
  }, [router]);

  const fetchAdminData = async () => {
    // 1. Kullanıcıları Çek
    const { data: usersData, count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 2. Siparişleri Çek
    const { data: ordersData, count: orderCount } = await supabase
      .from('orders')
      .select('*, profiles(email, full_name), products(name)')
      .order('created_at', { ascending: false });

    // 3. Ciroyu Hesapla
    const totalRevenue = ordersData?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

    setUsers(usersData || []);
    setOrders(ordersData || []);
    setStats({
      users: userCount || 0,
      orders: orderCount || 0,
      revenue: totalRevenue,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2">Admin paneli yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Paneli</h1>
        <Badge variant="outline" className="text-base px-4 py-1">v1.0</Badge>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ciro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.revenue.toLocaleString('tr-TR')} ₺</div>
          </CardContent>
        </Card>
      </div>

      {/* Tablolar */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Son Siparişler</TabsTrigger>
          <TabsTrigger value="users">Kullanıcı Listesi</TabsTrigger>
        </TabsList>

        {/* SİPARİŞLER TABLOSU */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Sipariş Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sipariş ID</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.shopier_order_id || order.id.slice(0,8)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.profiles?.full_name}</span>
                          <span className="text-xs text-muted-foreground">{order.profiles?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.products?.name}</TableCell>
                      <TableCell>{order.amount} ₺</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), 'd MMM yyyy HH:mm', { locale: tr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KULLANICILAR TABLOSU */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kayıtlı Kullanıcılar</CardTitle>
                <div className="flex items-center gap-2">
                   <Search className="h-4 w-4 text-muted-foreground" />
                   <Input placeholder="Ara..." className="w-[200px] h-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Referans Kodu</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {user.ref_code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge variant="destructive">Admin</Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(user.created_at), 'd MMM yyyy', { locale: tr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}