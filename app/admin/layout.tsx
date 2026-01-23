'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import {
    LayoutDashboard,
    Package,
    Receipt,
    Users,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Separator } from '@/components/ui/separator'

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
    },
    {
        title: 'Ürünler',
        href: '/admin/products',
        icon: Package,
    },
    {
        title: 'Siparişler',
        href: '/admin/orders',
        icon: Receipt,
    },
    {
        title: 'Kullanıcılar',
        href: '/admin/users',
        icon: Users,
    },
]

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user

            if (!user) {
                console.log('Admin Layout: No user found, redirecting to login')
                router.push('/login')
                return
            }

            // Admin kontrolü - Sadece metadata kontrolü
            const adminCheck = user.user_metadata?.role === 'admin'

            console.log('Admin check result:', adminCheck, 'Email:', user.email, 'Role:', user.user_metadata?.role)

            if (!adminCheck) {
                console.log('Admin Layout: Not admin, redirecting to dashboard')
                router.push('/dashboard')
                return
            }

            setUser(user)
            setIsAdmin(true)
            setLoading(false)
        }
        checkAuth()
    }, [router])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!isAdmin) {
        return null
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />

            <div className="flex flex-1">
                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:z-0",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full",
                        "lg:top-0 lg:h-auto"
                    )}
                >
                    <div className="flex h-full flex-col pt-16 lg:pt-0">
                        {/* Mobile Close Button */}
                        <div className="flex items-center justify-between p-4 lg:hidden">
                            <span className="font-semibold">Admin Menü</span>
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Admin Badge */}
                        <div className="hidden lg:flex items-center gap-2 p-4 border-b border-border bg-destructive/10">
                            <Shield className="h-5 w-5 text-destructive" />
                            <div>
                                <div className="text-sm font-medium text-destructive">Admin Panel</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {user?.email}
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 space-y-1 p-4">
                            {sidebarItems.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/admin' && pathname.startsWith(item.href))

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                            isActive
                                                ? "bg-destructive text-destructive-foreground"
                                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.title}
                                        {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                                    </Link>
                                )
                            })}
                        </nav>

                        <Separator />

                        {/* User Dashboard Link */}
                        <div className="p-4 space-y-2">
                            <Link href="/dashboard">
                                <Button variant="outline" className="w-full justify-start gap-3">
                                    <LayoutDashboard className="h-4 w-4" />
                                    Kullanıcı Paneli
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                                onClick={handleSignOut}
                            >
                                <LogOut className="h-4 w-4" />
                                Çıkış Yap
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    {/* Mobile Header */}
                    <div className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-destructive/10 p-4 lg:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <Shield className="h-5 w-5 text-destructive" />
                        <span className="font-medium text-destructive">Admin Panel</span>
                    </div>

                    {/* Page Content */}
                    <div className="p-4 lg:p-6">
                        {children}
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    )
}
