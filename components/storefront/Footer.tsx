"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ShieldCheck, Lock } from "lucide-react";
import { useI18n } from "../../lib/i18n";

export default function Footer() {
    const { t } = useI18n();
    const [whatsapp, setWhatsapp] = useState<string | null>(null);
    const pathname = usePathname();
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        fetch('/api/site-content')
            .then(r => r.json())
            .then(json => {
                if (json.data?.whatsapp_number) {
                    setWhatsapp(json.data.whatsapp_number);
                }
            })
            .catch(console.error);
    }, []);

    // Hide footer in admin area
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <footer className="bg-primary text-primary-fg py-12 mt-auto">
            <div className="container max-w-[1000px] px-4">
                <div className="flex flex-col md:flex-row justify-between gap-10">

                    {/* Logo */}
                    <div>
                        <span className="font-black text-3xl tracking-tighter uppercase">ZUMA</span>
                        {whatsapp && (
                            <div className="mt-4 flex flex-col gap-2">
                                <span className="text-xs uppercase tracking-widest opacity-60 font-bold">{t('website.footer.contactUs')}</span>
                                <a
                                    href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                                    className="flex items-center gap-2 text-primary-fg hover:text-white transition-colors"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <div className="bg-green-500 p-1.5 rounded-lg text-white">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.938 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    </div>
                                    <span className="font-bold">{whatsapp}</span>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Payment */}
                    <div>
                        <h4 className="font-bold text-lg mb-4 leading-tight">{t('website.footer.paymentMethods')}</h4>
                        <div className="flex flex-wrap items-center gap-4 max-w-[360px]">
                            {/* M-Pesa */}
                            <div className="bg-[#e21a22] text-white italic font-black text-sm px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all select-none" title="M-Pesa">M-PESA</div>

                            {/* e-Mola */}
                            <div className="bg-[#ff6600] text-white font-black text-sm px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all select-none" title="e-Mola">e-Mola</div>

                            {/* BIM */}
                            <div className="bg-[#e21a22] text-white flex items-center px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all select-none">
                                <span className="text-[10px] font-bold italic leading-none text-white/90 mr-1.5">millennium</span>
                                <span className="text-base font-black leading-none">bim</span>
                            </div>

                            {/* Visa */}
                            <div className="bg-white dark:bg-card px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center select-none">
                                <svg className="w-12 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16.5 8.3h-1.8c-.5 0-.9.3-1.1.7l-3.2 7.7h2l.4-1h2.5l.2 1h1.8l-1.2-8.4h.4zm-1 5.9h-1.6l.8-2 1.2 5.2-.4-3.2zm-6.1-5.9H7.6L5.1 14.3l-.3-1.3C4.5 12 3.6 11.1 2.6 10.7l1.4 6h2L8.5 8.3h1.3l-.4 0zm-7.9 0H.1L0 8.5c0 .2.2.4.4.4h2L4.6 8.3h-2.1z" fill="transparent" />
                                    <path d="M16.5 8.12875H14.455L14.7358 11.0062L15.66 14.6725H17.8683L21.1442 8.12875H18.2717L16.485 13.065L16.1425 11.2375L15.6567 8.5725C15.54 8.2325 15.2283 8.12875 14.8875 8.12875H11.7758L11.7242 8.35625C11.7242 8.35625 13.4358 8.685 14.455 9.3875H16.5V8.12875ZM11.6667 8.12875H9.50742L8.14992 14.6725H10.3092L11.6667 8.12875ZM2.85842 8.12875C1.86175 8.12875 1.54342 8.875 1.54342 8.875L1.50342 9.04375L0.26425 14.2887H2.38508L3.43592 9.61375H4.44425L3.92425 11.7375H2.38508L1.50342 14.2887C1.50342 14.2887 0.25 14.2887 0.25 14.2887C0.25 14.5387 0.46175 14.6725 0.722583 14.6725H4.2125L4.8525 11.5837C4.8525 11.5837 5.79508 11.5837 6.43508 11.5837L6.68508 12.89L7.02258 14.6725H9.18175L7.82425 8.12875H2.85842V8.12875Z" fill="#1A1F71" />
                                </svg>
                            </div>

                            {/* Mastercard */}
                            <div className="bg-white dark:bg-card px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center select-none">
                                <svg className="w-12 h-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="16" cy="24" r="15" fill="#EB001B" />
                                    <circle cx="32" cy="24" r="15" fill="#F79E1B" />
                                    <path d="M24 10.5C20.4 13.1 18.1 17.3 18.1 22C18.1 26.7 20.4 30.9 24 33.5C27.6 30.9 29.9 26.7 29.9 22C29.9 17.3 27.6 13.1 24 10.5Z" fill="#FF5F00" />
                                </svg>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="mt-12 pt-8 border-t border-white/20 text-xs opacity-70 text-center md:text-left">
                    {t('website.footer.copyright')}
                </div>
            </div>
        </footer>
    );
}
