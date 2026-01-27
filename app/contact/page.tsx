import { ContactForm } from "@/components/contact-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "İletişim | NPC Engineering",
    description: "Bizimle iletişime geçin. Projeleriniz ve sorularınız için bize yazabilirsiniz.",
}

export default function ContactPage() {
    return (
        <div className="container relative mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12 md:py-24">

            <div className="absolute left-4 top-4 md:left-8 md:top-8">
                <Button variant="ghost" asChild className="gap-2">
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4" />
                        Ana Sayfaya Dön
                    </Link>
                </Button>
            </div>

            <div className="w-full max-w-5xl rounded-3xl border bg-card shadow-2xl overflow-hidden">
                <div className="grid lg:grid-cols-2">
                    {/* Info Section */}
                    <div className="bg-accent p-10 text-accent-foreground flex flex-col justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-6">Bizimle İletişime Geçin</h1>
                            <p className="text-accent-foreground/80 mb-12 text-lg leading-relaxed">
                                Projeleriniz hakkında konuşmak, soru sormak veya sadece merhaba demek için bize ulaşın.
                                Ekibimiz en kısa sürede size dönüş yapacaktır.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-background/10 rounded-lg">
                                        <Phone className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Telefon</h3>
                                        <p className="text-accent-foreground/80">+90 555 026 59 47</p>
                                        <p className="text-accent-foreground/80">+90 545 314 55 65</p>
                                        <p className="text-sm text-accent-foreground/60 mt-1">Hafta içi 09:00 - 18:00</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-background/10 rounded-lg">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">E-posta</h3>
                                        <p className="text-accent-foreground/80">support@npcengineering.com</p>
                                        <p className="text-sm text-accent-foreground/60 mt-1">Her zaman bize yazabilirsiniz</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-background/10 rounded-lg">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Konum</h3>
                                        <p className="text-accent-foreground/80">Konya, Türkiye</p>
                                        <p className="text-sm text-accent-foreground/60 mt-1">NPC Engineering HQ</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex gap-4">
                            {/* Social Media placeholders if needed */}
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="p-10 bg-background flex items-center">
                        <div className="w-full">
                            <ContactForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
