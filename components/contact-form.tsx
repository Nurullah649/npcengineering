"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "İsim en az 2 karakter olmalıdır.",
    }),
    email: z.string().email({
        message: "Geçerli bir e-posta adresi giriniz.",
    }),
    message: z.string().min(10, {
        message: "Mesaj en az 10 karakter olmalıdır.",
    }),
})

export function ContactForm() {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            message: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Bir hata oluştu")
            }

            toast.success("Mesajınız başarıyla gönderildi!")
            form.reset()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Mesaj gönderilemedi.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>İletişime Geç</CardTitle>
                <CardDescription>
                    Sorularınız için aşağıdaki formu doldurarak bize ulaşabilirsiniz.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ad Soyad</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Adınız Soyadınız" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-posta</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ornek@mail.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mesaj</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Mesajınızı buraya yazın..."
                                            className="resize-none min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Gönderiliyor...
                                </>
                            ) : (
                                "Gönder"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
