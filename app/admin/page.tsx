'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Package, Receipt, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Stats = {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  })

  const fetchStats = async () => {
    // Ürün sayısı
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Sipariş sayısı ve toplam gelir
    const { data: ordersData } = await supabase
      .from('orders')
      .select('amount, status')

    const totalOrders = ordersData?.length || 0
    const totalRevenue = ordersData
      ?.filter(o => o.status === 'paid')
      ?.reduce((acc, o) => acc + (o.amount || 0), 0) || 0

    // Kullanıcı sayısı
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    setStats({
      totalProducts: productsCount || 0,
      totalOrders,
      totalUsers: usersCount || 0,
      totalRevenue,
    })

    setLoading(false)
  }

  useEffect(() => {
    fetchStats()

    // Sayfa focus'a geldiğinde verileri yenile
    const handleFocus = () => fetchStats()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Site istatistiklerine genel bakış
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue} ₺</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/products">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
            <CardHeader className="flex flex-row items-center gap-3">
              <Package className="h-8 w-8 text-destructive" />
              <div>
                <CardTitle className="text-base">Ürün Yönetimi</CardTitle>
                <CardDescription>Ürünleri ekle, düzenle, sil</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/orders">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
            <CardHeader className="flex flex-row items-center gap-3">
              <Receipt className="h-8 w-8 text-destructive" />
              <div>
                <CardTitle className="text-base">Sipariş Yönetimi</CardTitle>
                <CardDescription>Siparişleri görüntüle ve yönet</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
            <CardHeader className="flex flex-row items-center gap-3">
              <Users className="h-8 w-8 text-destructive" />
              <div>
                <CardTitle className="text-base">Kullanıcı Yönetimi</CardTitle>
                <CardDescription>Kullanıcıları ve rolleri yönet</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}