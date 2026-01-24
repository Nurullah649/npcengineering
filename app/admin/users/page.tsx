'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { updateUserRole } from '../actions'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Loader2, Shield, User } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
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

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean
        userId: string
        currentRole: string
        userName: string
    }>({ open: false, userId: '', currentRole: '', userName: '' })

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Kullanıcılar yüklenirken hata oluştu')
            console.error(error)
        }

        if (data) {
            setUsers(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()

        // Sayfa focus'a geldiğinde verileri yenile
        const handleFocus = () => fetchUsers()
        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [])

    const handleRoleClick = (user: UserProfile) => {
        setConfirmDialog({
            open: true,
            userId: user.id,
            currentRole: user.role,
            userName: user.full_name || user.email
        })
    }

    const confirmRoleChange = async () => {
        const { userId, currentRole } = confirmDialog
        const newRole = currentRole === 'admin' ? 'user' : 'admin'

        try {
            const result = await updateUserRole(userId, newRole as 'admin' | 'user')
            toast.success(result.message)
            fetchUsers()
        } catch (error: any) {
            toast.error(error.message || 'Rol güncellenemedi')
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const newRole = confirmDialog.currentRole === 'admin' ? 'Kullanıcı' : 'Admin'

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
                                                onClick={() => handleRoleClick(user)}
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

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
                title="Rol Değiştir"
                description={`"${confirmDialog.userName}" kullanıcısının rolünü "${newRole}" olarak değiştirmek istediğinizden emin misiniz?`}
                confirmLabel="Değiştir"
                onConfirm={confirmRoleChange}
                variant={confirmDialog.currentRole === 'admin' ? 'destructive' : 'default'}
            />
        </div>
    )
}
