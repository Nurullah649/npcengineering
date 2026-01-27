import { ContactForm } from "@/components/contact-form"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "İletişim | NPC Engineering",
    description: "Bizimle iletişime geçin. Projeleriniz ve sorularınız için bize yazabilirsiniz.",
}

export default function ContactPage() {
    return (
        <div className="container mx-auto py-10 px-4 min-h-screen flex items-center justify-center">
            <ContactForm />
        </div>
    )
}
