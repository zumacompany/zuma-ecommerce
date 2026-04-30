"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ptMessages from '../messages/pt.json';
import enMessages from '../messages/en.json';

export const SUPPORTED_LOCALES = ['pt', 'en'] as const;
export const DEFAULT_LOCALE = 'pt';

export type Locale = (typeof SUPPORTED_LOCALES)[number];
type Messages = typeof ptMessages;

interface I18nContextType {
    locale: Locale;
    messages: Messages;
    t: (key: string, values?: Record<string, string | number>) => string;
    setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messagesMap = {
    pt: ptMessages,
    en: enMessages
};

export function isSupportedLocale(value: string | null | undefined): value is Locale {
    return SUPPORTED_LOCALES.includes(value as Locale);
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
    const [messages, setMessages] = useState<Messages>(ptMessages);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        let active = true;

        async function loadLocale() {
            const savedLocale = localStorage.getItem('locale');

            if (isSupportedLocale(savedLocale)) {
                setLocaleState(savedLocale);
                setMessages(messagesMap[savedLocale]);
                setMounted(true);
                return;
            }

            try {
                const res = await fetch('/api/site-content', { cache: 'no-store' });
                const payload = await res.json().catch(() => null);
                const siteLocale = payload?.data?.language;

                if (active && isSupportedLocale(siteLocale)) {
                    setLocaleState(siteLocale);
                    setMessages(messagesMap[siteLocale]);
                }
            } catch (error) {
                console.error('Failed to load site locale:', error);
            } finally {
                if (active) {
                    setMounted(true);
                }
            }
        }

        void loadLocale();

        return () => {
            active = false;
        };
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        setMessages(messagesMap[newLocale]);
        localStorage.setItem('locale', newLocale);
    };

    const t = (key: string, values?: Record<string, string | number>): string => {
        const keys = key.split('.');
        let value: any = messages;

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }

        if (typeof value !== 'string') return key;

        if (values) {
            let result = value;
            Object.entries(values).forEach(([k, v]) => {
                result = result.replace(`{${k}}`, String(v));
            });
            return result;
        }

        return value;
    };

    // Render children with default (pt) locale on server + first client paint
    // to avoid hydration mismatch and visibility flicker. Locale swaps post-mount.
    void mounted;
    return (
        <I18nContext.Provider value={{ locale, messages, t, setLocale }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
}
