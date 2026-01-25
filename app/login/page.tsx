// Dosya: app/login/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, LogIn, Eye, EyeOff, MailCheck } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Form Doğrulama Kuralları
const formSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
});

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailCheck, setShowEmailCheck] = useState(false);

  useEffect(() => {
    // URL parametrelerini kontrol et (Mail onayı mesajı için)
    const params = new URLSearchParams(window.location.search);
    if (params.get('message') === 'check-email') {
      setShowEmailCheck(true);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error('Giriş başarısız: ' + error.message);
        setIsLoading(false);
        return;
      }

      toast.success('Başarıyla giriş yapıldı!');

      // URL'den redirect parametresini al
      const searchParams = new URLSearchParams(window.location.search);
      let redirectTo = searchParams.get('redirect');

      // ======== OPEN REDIRECT FIX ========
      // Sadece internal path'lere izin ver (güvenlik)
      const allowedPaths = ['/dashboard', '/admin', '/products', '/callback', '/onboarding'];
      const isValidRedirect = redirectTo &&
        /^\/[a-zA-Z0-9/_-]*$/.test(redirectTo) &&
        allowedPaths.some(path => redirectTo!.startsWith(path));

      if (!isValidRedirect) {
        redirectTo = null; // Geçersiz redirect, varsayılana dön
      }
      // ===================================

      if (!redirectTo) {
        // Profil tablosundan rolü kontrol et
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user?.id)
          .single();

        const isAdmin = profile?.role === 'admin';
        redirectTo = isAdmin ? '/admin' : '/dashboard';
      }

      // Hard navigation ile yönlendir
      window.location.href = redirectTo;

    } catch (error) {
      toast.error('Beklenmedik bir hata oluştu.');
      console.error(error);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Giriş Yap</CardTitle>
          <CardDescription>
            NPC Engineering hesabınıza erişmek için bilgilerinizi girin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showEmailCheck && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 flex items-start gap-3">
              <MailCheck className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold">Kayıt Başarılı!</p>
                <p>Hesabınızı aktifleştirmek için lütfen e-posta kutunuzu kontrol edin ve doğrulama linkine tıklayın.</p>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="ornek@domain.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="******"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">{showPassword ? "Gizle" : "Göster"}</span>
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Giriş Yap
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm text-muted-foreground">
          <p>
            Hesabınız yok mu?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Hemen Kayıt Olun
            </Link>
          </p>
          <Link href="/" className="hover:text-foreground">
            Ana Sayfaya Dön
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}