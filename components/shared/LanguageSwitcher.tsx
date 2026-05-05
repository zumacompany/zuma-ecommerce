"use client";
import { useState, useEffect } from 'react';
import { SUPPORTED_LOCALES, useI18n } from '../lib/i18n';

type LanguageSwitcherProps = {
    compact?: boolean;
};

export default function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
    const [mounted, setMounted] = useState(false);
    const { locale, setLocale } = useI18n();

    useEffect(() => {
        setMounted(true);
    }, []);

    const switchLocale = (newLocale: (typeof SUPPORTED_LOCALES)[number]) => {
        if (newLocale === locale) return;
        setLocale(newLocale);
    };

    if (!mounted) return <div className={`${compact ? 'h-9 w-28 rounded-md' : 'h-10 w-32 rounded-lg'} bg-muted/10 animate-pulse`} />;

    return (
        <div className={`flex items-center ${compact ? 'gap-1 p-1.5 rounded-md' : 'gap-2 p-2 rounded-lg'} bg-muted/20`}>
            <button
                onClick={() => switchLocale('pt')}
                className={`flex items-center ${compact ? 'gap-1.5 px-2 py-1.5 rounded-md' : 'gap-2 px-3 py-2 rounded-lg'} transition-all ${locale === 'pt'
                    ? 'bg-zuma-600 text-white shadow-md'
                    : 'hover:bg-muted/30 text-muted'
                    }`}
                title="Português"
            >
                {/* Mozambique Flag */}
                <svg className={compact ? "h-4 w-4" : "w-5 h-5"} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
                    <rect width="900" height="600" fill="#007a3d" />
                    <rect y="200" width="900" height="200" fill="#000" />
                    <rect y="400" width="900" height="200" fill="#fcdd09" />
                    <rect width="900" height="40" y="160" fill="#fff" />
                    <rect width="900" height="40" y="400" fill="#fff" />
                    <polygon points="0,0 0,600 450,300" fill="#c8102e" />
                    <polygon points="175,300 225,340 285,340 240,375 260,435 175,390 90,435 110,375 65,340 125,340" fill="#fcdd09" />
                </svg>
                <span className={compact ? "text-xs font-medium" : "text-sm font-medium"}>PT</span>
            </button>

            <button
                onClick={() => switchLocale('en')}
                className={`flex items-center ${compact ? 'gap-1.5 px-2 py-1.5 rounded-md' : 'gap-2 px-3 py-2 rounded-lg'} transition-all ${locale === 'en'
                    ? 'bg-zuma-600 text-white shadow-md'
                    : 'hover:bg-muted/30 text-muted'
                    }`}
                title="English"
            >
                {/* US Flag */}
                <svg className={compact ? "h-4 w-4" : "w-5 h-5"} viewBox="0 0 7410 3900" xmlns="http://www.w3.org/2000/svg">
                    <rect width="7410" height="3900" fill="#b22234" />
                    <path d="M0,450H7410m0,600H0m0,600H7410m0,600H0m0,600H7410m0,600H0" stroke="#fff" strokeWidth="300" />
                    <rect width="2964" height="2100" fill="#3c3b6e" />
                </svg>
                <span className={compact ? "text-xs font-medium" : "text-sm font-medium"}>EN</span>
            </button>
        </div>
    );
}
