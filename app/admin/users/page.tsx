'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Loader2, Shield, User } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

type UserProfile = {
    id: string
    email: string
    full_name: string | null
    role: string
    created_at: string
}

export default function AdminUsersPage() {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<UserProfile[]>([])

    const fetchUsers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) {
            setUsers(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const toggleRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin'

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)

        if (error) {
            toast.error('Rol güncellenemedi')
            return
        }

        toast.success(`Rol "${newRole}" olarak güncellendi`)
        fetchUsers()
    }

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
                <h1 className="text-2xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
                <p className="text-muted-foreground">
                    Toplam {users.length} kullanıcı
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Kullanıcılar</CardTitle>
                    <CardDescription>Tüm kayıtlı kullanıcılar ve rolleri</CardDescription>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Henüz kullanıcı yok.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kullanıcı</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Kayıt Tarihi</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user.role === 'admin' ? (
                                                    <Shield className="h-4 w-4 text-destructive" />
                                                ) : (
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="font-medium">{user.full_name || 'İsimsiz'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        <TableCell>
                                            {user.created_at ? format(new Date(user.created_at), 'd MMM yyyy', { locale: tr }) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                                {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleRole(user.id, user.role)}
                                            >
                                                {user.role === 'admin' ? 'User Yap' : 'Admin Yap'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
